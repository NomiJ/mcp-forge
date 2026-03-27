"""
In-memory session store for rate-limiting AI rewrite calls.

Each call to /parse issues a session token. The /rewrite endpoint checks
this token and increments a counter. Max 10 rewrites per session.

MVP only — not safe for multi-worker deployments. Replace with Redis
when scaling horizontally.
"""

import uuid
from typing import Optional

MAX_REWRITES = 10

# token -> number of rewrites consumed
_store: dict[str, int] = {}


def create() -> str:
    token = f"sess_{uuid.uuid4().hex[:16]}"
    _store[token] = 0
    return token


def is_valid(token: str) -> bool:
    return token in _store


def consume(token: str) -> bool:
    """
    Attempt to consume one rewrite credit.
    Returns True if allowed, False if token unknown or limit reached.
    """
    if token not in _store:
        return False
    if _store[token] >= MAX_REWRITES:
        return False
    _store[token] += 1
    return True


def remaining(token: str) -> Optional[int]:
    """Returns credits left, or None if the token is unknown."""
    if token not in _store:
        return None
    return MAX_REWRITES - _store[token]
