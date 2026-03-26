"""
AI Rewrite Service

Calls Anthropic Claude (claude-haiku-4-5) to improve tool names and descriptions.

- Sends tool name, description, and parameter list in a structured prompt
- Asks for: improved snake_case verb-noun name + 1-2 sentence plain-English description
- Rate limit: max 10 calls per session token (enforced by caller in router)
"""

import os
from app.models import ToolCard


async def rewrite(card: ToolCard) -> tuple[str, str]:
    """Returns (improved_tool_name, improved_description)."""
    # TODO: implement
    # 1. Build prompt from card fields
    # 2. Call anthropic client with claude-haiku-4-5
    # 3. Parse and return structured response
    raise NotImplementedError
