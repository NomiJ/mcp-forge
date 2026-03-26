"""
Spec Parser

Parses OpenAPI 3.x (JSON/YAML) and Swagger 2.x specs into ToolCard objects.

Mapping rules (from architecture.md):
- Tool name: operationId if present, else {method}_{path_segments}
- Description: summary if present, falls back to description, falls back to ""
- Parameters: normalized from path, query, header, cookie locations
- Auth: extracted from securitySchemes, matched to each endpoint's security field
"""

from app.models import ToolCard, SpecMetadata, Parameter, AuthScheme, RequestBody
from typing import List, Tuple


def parse(spec_url: str | None = None, spec_content: str | None = None, spec_format: str | None = None) -> Tuple[SpecMetadata, List[ToolCard]]:
    # TODO: implement
    # 1. Fetch spec from spec_url, or parse spec_content based on spec_format
    # 2. Detect format (OpenAPI 3.x vs Swagger 2.x) and normalize
    # 3. Validate with openapi-spec-validator
    # 4. Map each endpoint to a ToolCard
    raise NotImplementedError
