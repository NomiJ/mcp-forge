"""
Spec Parser

Parses OpenAPI 3.x (JSON/YAML) and Swagger 2.x specs into ToolCard objects.

Mapping rules (from architecture.md):
- Tool name: operationId if present (normalized to snake_case), else {method}_{path_segments}
- Description: summary if present, falls back to description, falls back to ""
- Parameters: normalized from path, query, header, cookie locations
- Auth: extracted from securitySchemes / securityDefinitions, matched per operation
"""

import re
import uuid
import json
from typing import Optional

import httpx
import yaml

from app.models import ToolCard, SpecMetadata, Parameter, AuthScheme, RequestBody

HTTP_METHODS = ["get", "post", "put", "delete", "patch"]


# ---------------------------------------------------------------------------
# Name derivation
# ---------------------------------------------------------------------------

def _camel_to_snake(name: str) -> str:
    name = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1_\2", name)
    name = re.sub(r"([a-z\d])([A-Z])", r"\1_\2", name)
    return name.lower()


def _path_to_slug(path: str) -> str:
    """Turn /pets/{id}/photos into pets_photos (drop path params)."""
    parts = [
        re.sub(r"[^a-z0-9]", "", segment.lower())
        for segment in path.split("/")
        if segment and not segment.startswith("{")
    ]
    return "_".join(p for p in parts if p) or "root"


def _derive_tool_name(operation: dict, method: str, path: str) -> str:
    op_id = operation.get("operationId")
    if op_id:
        name = _camel_to_snake(str(op_id))
        name = re.sub(r"[^a-z0-9_]", "_", name)
        name = re.sub(r"_+", "_", name).strip("_")
        return name or f"{method}_{_path_to_slug(path)}"
    return f"{method}_{_path_to_slug(path)}"


# ---------------------------------------------------------------------------
# Schema / type helpers
# ---------------------------------------------------------------------------

def _resolve_schema_type(schema: dict) -> str:
    if not schema:
        return "any"
    t = schema.get("type", "")
    if t == "array":
        items = schema.get("items", {})
        return f"array[{_resolve_schema_type(items)}]"
    if t:
        return t
    if "$ref" in schema:
        return schema["$ref"].split("/")[-1]
    return "object"


def _resolve_ref(ref: str, spec: dict) -> dict:
    """Resolve a local $ref like '#/components/schemas/Pet'."""
    if not ref.startswith("#/"):
        return {}
    parts = ref.lstrip("#/").split("/")
    node = spec
    for part in parts:
        part = part.replace("~1", "/").replace("~0", "~")
        if isinstance(node, dict):
            node = node.get(part, {})
        else:
            return {}
    return node if isinstance(node, dict) else {}


# ---------------------------------------------------------------------------
# Parameter parsing
# ---------------------------------------------------------------------------

def _parse_parameters(
    raw_params: list,
    spec: dict,
) -> tuple[list[Parameter], Optional[RequestBody]]:
    parameters: list[Parameter] = []
    request_body: RequestBody | None = None

    for p in raw_params:
        if "$ref" in p:
            p = _resolve_ref(p["$ref"], spec)
        if not p:
            continue

        location = p.get("in", "query")

        if location == "body":
            # Swagger 2.x body parameter
            schema = p.get("schema", {})
            if "$ref" in schema:
                schema = _resolve_ref(schema["$ref"], spec)
            request_body = RequestBody(
                required=p.get("required", False),
                content_type="application/json",
                schema_=schema,
            )
            continue

        if location not in ("path", "query", "header", "cookie"):
            continue

        # OAS3 puts type under schema sub-object; Swagger 2 puts it inline
        schema = p.get("schema", p)
        parameters.append(
            Parameter(
                name=p.get("name", ""),
                location=location,
                required=p.get("required", location == "path"),
                type=_resolve_schema_type(schema),
                description=p.get("description", ""),
            )
        )

    return parameters, request_body


def _parse_oas3_request_body(rb_spec: dict, spec: dict) -> Optional[RequestBody]:
    if not rb_spec:
        return None
    content = rb_spec.get("content", {})
    content_type = "application/json"
    schema: dict = {}

    if "application/json" in content:
        schema = content["application/json"].get("schema", {})
    elif content:
        content_type = next(iter(content))
        schema = content[content_type].get("schema", {})

    if "$ref" in schema:
        schema = _resolve_ref(schema["$ref"], spec)

    return RequestBody(
        required=rb_spec.get("required", False),
        content_type=content_type,
        schema_=schema,
    )


# ---------------------------------------------------------------------------
# Auth parsing
# ---------------------------------------------------------------------------

def _get_security_schemes(spec: dict, is_swagger2: bool) -> dict:
    if is_swagger2:
        return spec.get("securityDefinitions", {})
    return spec.get("components", {}).get("securitySchemes", {})


def _parse_auth(
    operation: dict,
    global_security: list,
    security_schemes: dict,
) -> Optional[AuthScheme]:
    security = operation.get("security", global_security)
    for sec_req in (security or []):
        for scheme_name in sec_req:
            scheme = security_schemes.get(scheme_name, {})
            scheme_type = scheme.get("type", "")

            if scheme_type == "apiKey":
                return AuthScheme(
                    type="apiKey",
                    location=scheme.get("in", "header"),
                    name=scheme.get("name", "X-API-Key"),
                )
            if scheme_type == "http":
                http_scheme = scheme.get("scheme", "").lower()
                if http_scheme == "bearer":
                    return AuthScheme(type="bearer", location="header", name="Authorization")
                if http_scheme == "basic":
                    return AuthScheme(type="basic", location="header", name="Authorization")
            # oauth2 / openIdConnect — not handled in MVP
    return None


# ---------------------------------------------------------------------------
# LLM preview
# ---------------------------------------------------------------------------

def _build_llm_preview(
    tool_name: str,
    description: str,
    parameters: list[Parameter],
    request_body: Optional[RequestBody],
) -> str:
    parts = []
    for p in parameters:
        suffix = "" if p.required else "?"
        parts.append(f"{p.name}{suffix}: {p.type}")
    if request_body:
        suffix = "" if request_body.required else "?"
        parts.append(f"body{suffix}: object")

    sig = f"{tool_name}({', '.join(parts)})"
    return f"{sig} — {description}" if description else sig


# ---------------------------------------------------------------------------
# Base URL
# ---------------------------------------------------------------------------

def _get_base_url(spec: dict, is_swagger2: bool) -> str:
    if is_swagger2:
        host = spec.get("host", "localhost")
        base_path = spec.get("basePath", "/").rstrip("/")
        schemes = spec.get("schemes", ["https"])
        scheme = "https" if "https" in schemes else (schemes[0] if schemes else "https")
        return f"{scheme}://{host}{base_path}"

    servers = spec.get("servers", [])
    if servers:
        return servers[0].get("url", "").rstrip("/")
    return ""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def fetch_spec(spec_url: str) -> tuple[str, str]:
    """Fetch spec from URL. Returns (content, format)."""
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        response = await client.get(spec_url)
        response.raise_for_status()

    content_type = response.headers.get("content-type", "")
    fmt = (
        "yaml"
        if "yaml" in content_type or spec_url.endswith((".yaml", ".yml"))
        else "json"
    )
    return response.text, fmt


def load_spec(content: str, fmt: str) -> dict:
    """Parse raw spec text into a dict. Raises ValueError on bad input."""
    try:
        if fmt == "yaml":
            result = yaml.safe_load(content)
        else:
            result = json.loads(content)
    except Exception as exc:
        raise ValueError(f"Could not parse spec as {fmt}: {exc}") from exc

    if not isinstance(result, dict):
        raise ValueError("Spec must be a JSON/YAML object at the root level")
    return result


def parse_spec(spec: dict) -> tuple[SpecMetadata, list[ToolCard]]:
    """
    Parse a spec dict into (SpecMetadata, [ToolCard]).
    Supports OpenAPI 3.x and Swagger 2.x.
    """
    is_swagger2 = str(spec.get("swagger", "")).startswith("2")

    if "paths" not in spec:
        raise ValueError("Spec has no 'paths' object — is this a valid OpenAPI/Swagger spec?")

    metadata = SpecMetadata(
        title=spec.get("info", {}).get("title", "Untitled API"),
        version=spec.get("info", {}).get("version", "unknown"),
        base_url=_get_base_url(spec, is_swagger2),
    )

    security_schemes = _get_security_schemes(spec, is_swagger2)
    global_security = spec.get("security", [])

    tool_cards: list[ToolCard] = []

    for path, path_item in spec.get("paths", {}).items():
        if not isinstance(path_item, dict):
            continue

        # Path-level parameters are shared across all methods on this path
        path_level_params = path_item.get("parameters", [])

        for method in HTTP_METHODS:
            operation = path_item.get(method)
            if not operation or not isinstance(operation, dict):
                continue

            # Merge path-level and operation-level params (operation takes precedence by name)
            op_params = operation.get("parameters", [])
            op_param_names = {p.get("name") for p in op_params if isinstance(p, dict) and "name" in p}
            merged_params = [p for p in path_level_params if p.get("name") not in op_param_names] + op_params

            parameters, request_body = _parse_parameters(merged_params, spec)

            # OAS3 requestBody (overrides Swagger 2 body param if both somehow present)
            if not is_swagger2 and "requestBody" in operation:
                request_body = _parse_oas3_request_body(operation["requestBody"], spec)

            tool_name = _derive_tool_name(operation, method, path)
            description = operation.get("summary") or operation.get("description") or ""
            auth = _parse_auth(operation, global_security, security_schemes)
            llm_preview = _build_llm_preview(tool_name, description, parameters, request_body)

            tool_cards.append(
                ToolCard(
                    id=str(uuid.uuid4()),
                    tool_name=tool_name,
                    description=description,
                    method=method.upper(),
                    path=path,
                    parameters=parameters,
                    request_body=request_body,
                    auth=auth,
                    llm_preview=llm_preview,
                )
            )

    return metadata, tool_cards
