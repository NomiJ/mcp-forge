"""
Code Generator

Produces a complete, runnable Python file using FastMCP via Jinja2 templates.

Template handles:
- FastMCP imports and server instantiation
- Authentication setup (API key header, Bearer token, Basic auth)
- One @mcp.tool() decorated function per enabled ToolCard
- Function signature from card's parameter list
- Docstring from card's (possibly customized) description
- HTTP call to original API endpoint using httpx

After rendering, runs a syntax check before returning.
"""

import ast
import re
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from app.models import ToolCard, SpecMetadata

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

_PYTHON_TYPE_MAP = {
    "string":  "str",
    "integer": "int",
    "number":  "float",
    "boolean": "bool",
    "array":   "list",
    "object":  "dict",
}


def _python_type(openapi_type: str) -> str:
    return _PYTHON_TYPE_MAP.get(openapi_type.lower(), "str")


def _join_format_args(params: list) -> str:
    """['userId', 'orgId'] -> 'userId=userId, orgId=orgId' for .format() calls."""
    return ", ".join(f"{p.name}={p.name}" for p in params)


def _safe_title(title: str) -> str:
    """Convert API title to a safe filename prefix."""
    return re.sub(r"[^a-z0-9]+", "_", title.lower()).strip("_")


def generate(tool_cards: list[ToolCard], metadata: SpecMetadata) -> str:
    """Returns rendered Python source code as a string."""
    enabled = [c for c in tool_cards if c.enabled]
    if not enabled:
        raise ValueError("No enabled tool cards to generate.")

    # Use the first auth scheme found across enabled cards
    auth = next((c.auth for c in enabled if c.auth), None)

    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        trim_blocks=True,
        lstrip_blocks=True,
        keep_trailing_newline=True,
    )
    env.filters["python_type"] = _python_type
    env.filters["join_format_args"] = _join_format_args

    template = env.get_template("mcp_server.py.j2")
    source = template.render(
        tool_cards=enabled,
        metadata=metadata,
        auth=auth,
        safe_title=_safe_title(metadata.title),
    )

    # Syntax check
    try:
        ast.parse(source)
    except SyntaxError as exc:
        raise ValueError(f"Generated code has a syntax error: {exc}") from exc

    return source
