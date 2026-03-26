"""
Quality Scorer

Scores each ToolCard as green, yellow, or red.

Rules (from architecture.md):
- Red:    no description, or description < 5 words, or tool name is a raw path string (e.g. get_v2_usr_upd)
- Yellow: description present but < 15 words, or tool name is generic (e.g. createObject, updateItem)
- Green:  tool name is a meaningful verb-noun phrase AND description >= 15 words
"""

from app.models import ToolCard
from typing import Literal


def score(card: ToolCard) -> Literal["green", "yellow", "red"]:
    # TODO: implement scoring rules
    raise NotImplementedError


def score_all(cards: list[ToolCard]) -> list[ToolCard]:
    # TODO: return cards with quality_score populated
    raise NotImplementedError
