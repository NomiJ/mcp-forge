"""
AI Rewrite Service

Calls Anthropic Claude (claude-haiku-4-5) to improve tool names and descriptions.

- Sends tool name, description, method, and path in a structured prompt
- Asks for: improved snake_case verb-noun name + 1-2 sentence plain-English description
- Rate limit: max 10 calls per session token (enforced by caller in router)
"""

import os
import json
import anthropic

_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _client


async def rewrite(
    tool_name: str,
    description: str,
    method: str,
    path: str,
) -> tuple[str, str]:
    """Returns (improved_tool_name, improved_description)."""

    prompt = f"""You are improving the metadata for an MCP tool that wraps a REST API endpoint.

Endpoint: {method} {path}
Current tool name: {tool_name}
Current description: {description}

Return ONLY a JSON object with two keys:
- "toolName": a concise snake_case verb-noun name (e.g. "list_users", "create_order")
- "description": 1-2 sentences in plain English describing what the tool does and when to use it

Rules:
- toolName must be snake_case, start with a verb, be 2-4 words
- description must be clear enough for an LLM to know when to call this tool
- Do not wrap in markdown or add any other text

JSON:"""

    client = _get_client()
    message = await client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=256,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    data = json.loads(raw)
    return data["toolName"], data["description"]
