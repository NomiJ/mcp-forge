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

After rendering, imports FastMCP and runs a syntax check before returning.
"""

from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from app.models import ToolCard, SpecMetadata

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"


def generate(tool_cards: list[ToolCard], metadata: SpecMetadata) -> str:
    """Returns rendered Python source code as a string."""
    # TODO: implement
    # 1. Filter to enabled cards only
    # 2. Render mcp_server.py.j2 template
    # 3. Syntax-check the output (compile() or ast.parse())
    # 4. Return source string
    raise NotImplementedError
