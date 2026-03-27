"""
Quality Scorer

Scores each ToolCard as green, yellow, or red.

Rules (from architecture.md):
  Red    — no description, description < 5 words, or tool name is a raw path string
  Yellow — description < 15 words, or tool name is generic
  Green  — meaningful verb-noun name AND description >= 15 words
"""

import re
from typing import Literal

from app.models import ToolCard

# Verbs and generic nouns whose combination produces a low-signal name
_GENERIC_PATTERN = re.compile(
    r"^(create|update|delete|get|list|fetch|add|remove|set|put|post)_"
    r"(object|item|resource|entity|record|data|info|thing|result|response)s?$"
)


def _word_count(text: str) -> int:
    return len(text.split()) if text.strip() else 0


def _is_raw_path_name(name: str) -> bool:
    """
    Detect names that are mechanical path derivations, e.g. get_v2_usr_upd.

    Two signals:
    1. Name contains a version segment like v1, v2, v3.
    2. All non-method segments are very short abbreviations (<= 3 chars).
    """
    parts = name.split("_")
    if len(parts) < 3:
        return False

    non_method = parts[1:]

    # Version segment anywhere after the method word
    if any(re.fullmatch(r"v\d+", p) for p in non_method):
        return True

    # All non-method segments are short abbreviations
    if all(len(p) <= 3 for p in non_method):
        return True

    return False


def _is_generic_name(name: str) -> bool:
    return bool(_GENERIC_PATTERN.match(name.lower()))


def score(card: ToolCard) -> Literal["green", "yellow", "red"]:
    desc = card.description.strip()
    words = _word_count(desc)
    name = card.tool_name

    # --- Red ---
    if not desc or words < 5:
        return "red"
    if _is_raw_path_name(name):
        return "red"

    # --- Yellow ---
    if words < 15:
        return "yellow"
    if _is_generic_name(name):
        return "yellow"

    # --- Green ---
    return "green"


def score_all(cards: list[ToolCard]) -> list[ToolCard]:
    return [card.model_copy(update={"quality_score": score(card)}) for card in cards]
