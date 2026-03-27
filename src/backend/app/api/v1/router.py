import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app import sessions
from app.models import (
    DiscoverRequest, DiscoverResponse,
    ParseRequest, ParseResponse,
    RewriteRequest, RewriteResponse,
    GenerateRequest,
)
from app.modules import spec_parser, quality_scorer, ai_rewrite, code_generator, auto_discovery

router = APIRouter(prefix="/api/v1")


@router.post("/discover", response_model=DiscoverResponse)
async def discover_spec(request: DiscoverRequest) -> DiscoverResponse:
    spec_url = await auto_discovery.discover(request.base_url)
    if spec_url is None:
        raise HTTPException(
            status_code=404,
            detail="No OpenAPI/Swagger spec found at well-known paths under the provided URL.",
        )
    return DiscoverResponse(spec_url=spec_url)


@router.post("/parse", response_model=ParseResponse)
async def parse_spec_endpoint(request: ParseRequest) -> ParseResponse:
    if not request.spec_url and not request.spec_content:
        raise HTTPException(
            status_code=422,
            detail="Provide either specUrl or specContent + specFormat",
        )

    # --- Fetch or decode raw content ---
    try:
        if request.spec_url:
            content, fmt = await spec_parser.fetch_spec(request.spec_url)
        else:
            content = request.spec_content or ""
            fmt = request.spec_format or "json"
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not fetch spec: HTTP {exc.response.status_code}",
        ) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not reach spec URL: {exc}",
        ) from exc

    # --- Parse ---
    try:
        spec_dict = spec_parser.load_spec(content, fmt)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # --- Extract tool cards ---
    try:
        metadata, tool_cards = spec_parser.parse_spec(spec_dict)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # --- Score quality ---
    tool_cards = quality_scorer.score_all(tool_cards)

    # --- Issue session token ---
    session_token = sessions.create()

    return ParseResponse(
        metadata=metadata,
        tool_cards=tool_cards,
        session_token=session_token,
    )


@router.post("/rewrite", response_model=RewriteResponse)
async def rewrite_card(request: RewriteRequest) -> RewriteResponse:
    if not sessions.consume(request.session_token):
        raise HTTPException(
            status_code=429,
            detail="Rewrite limit reached or invalid session token.",
        )
    try:
        tool_name, description = await ai_rewrite.rewrite(
            tool_name=request.current_tool_name,
            description=request.current_description,
            method=request.method,
            path=request.path,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI rewrite failed: {exc}") from exc

    return RewriteResponse(tool_name=tool_name, description=description)


@router.post("/generate")
async def generate_code(request: GenerateRequest) -> Response:
    try:
        source = code_generator.generate(request.tool_cards, request.metadata)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    safe_title = code_generator._safe_title(request.metadata.title)
    filename = f"{safe_title}_mcp_server.py"

    return Response(
        content=source,
        media_type="text/x-python",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
