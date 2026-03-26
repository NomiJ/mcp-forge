"""
Auto-Discovery Module

Probes well-known spec paths under a base URL in parallel.
Returns the first path that responds 200 with content-type application/json or text/yaml.

Probed paths (from architecture.md):
  /openapi.json, /openapi.yaml, /swagger.json, /swagger.yaml,
  /api-docs, /api-docs.json, /swagger/v1/swagger.json, /docs/openapi.json
"""

import asyncio
import httpx

WELL_KNOWN_PATHS = [
    "/openapi.json",
    "/openapi.yaml",
    "/swagger.json",
    "/swagger.yaml",
    "/api-docs",
    "/api-docs.json",
    "/swagger/v1/swagger.json",
    "/docs/openapi.json",
]

ACCEPTED_CONTENT_TYPES = {"application/json", "text/yaml", "application/yaml"}
TIMEOUT_SECONDS = 2.0


async def discover(base_url: str) -> str | None:
    """Returns the first discovered spec URL, or None if not found."""
    # TODO: implement
    # 1. Strip trailing slash from base_url
    # 2. Send parallel HEAD requests to all WELL_KNOWN_PATHS with TIMEOUT_SECONDS
    # 3. Return first URL with 200 status and accepted content type
    raise NotImplementedError
