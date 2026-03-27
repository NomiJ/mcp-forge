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


async def _probe(client: httpx.AsyncClient, url: str) -> str | None:
    """Returns url if it responds 200 with an accepted content type, else None."""
    try:
        r = await client.head(url, follow_redirects=True, timeout=TIMEOUT_SECONDS)
        if r.status_code == 200:
            ct = r.headers.get("content-type", "").split(";")[0].strip()
            if ct in ACCEPTED_CONTENT_TYPES:
                return url
        # Some servers don't support HEAD — fall back to GET with stream
        if r.status_code in (405, 404):
            r = await client.get(url, follow_redirects=True, timeout=TIMEOUT_SECONDS)
            if r.status_code == 200:
                ct = r.headers.get("content-type", "").split(";")[0].strip()
                if ct in ACCEPTED_CONTENT_TYPES:
                    return url
    except (httpx.RequestError, httpx.TimeoutException):
        pass
    return None


async def discover(base_url: str) -> str | None:
    """Returns the first discovered spec URL, or None if not found."""
    base = base_url.rstrip("/")
    urls = [base + path for path in WELL_KNOWN_PATHS]

    async with httpx.AsyncClient() as client:
        tasks = [_probe(client, url) for url in urls]
        results = await asyncio.gather(*tasks)

    # Return first non-None result in original path order
    for result in results:
        if result is not None:
            return result
    return None
