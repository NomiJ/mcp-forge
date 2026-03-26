from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from app.models import (
    DiscoverRequest, DiscoverResponse,
    ParseRequest, ParseResponse,
    RewriteRequest, RewriteResponse,
    GenerateRequest,
)

router = APIRouter(prefix="/api/v1")


@router.post("/discover", response_model=DiscoverResponse)
async def discover_spec(request: DiscoverRequest) -> DiscoverResponse:
    # TODO: delegate to auto_discovery module
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post("/parse", response_model=ParseResponse)
async def parse_spec(request: ParseRequest) -> ParseResponse:
    # TODO: delegate to spec_parser module, then quality_scorer
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post("/rewrite", response_model=RewriteResponse)
async def rewrite_card(request: RewriteRequest) -> RewriteResponse:
    # TODO: validate session token rate limit, delegate to ai_rewrite module
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post("/generate")
async def generate_code(request: GenerateRequest) -> Response:
    # TODO: delegate to code_generator module, return .py file download
    raise HTTPException(status_code=501, detail="Not implemented")
