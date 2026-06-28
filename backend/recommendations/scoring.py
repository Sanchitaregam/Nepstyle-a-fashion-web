"""
Rule-based scoring for trending and recommendations (initial phase).

Slide 13 — Trending score (no time decay in base formula):
    Trending Score = (Likes × 3) + (Comments × 5) + (Views × 1)

Optional period filters (daily / weekly / monthly) limit which posts are eligible.
"""

from datetime import timedelta
from typing import Optional

from django.utils import timezone

# Trending formula weights (Slide 13)
TRENDING_LIKES_WEIGHT = 3
TRENDING_COMMENTS_WEIGHT = 5
TRENDING_VIEWS_WEIGHT = 1

# Rule-based recommendation weights (initial phase)
WEIGHT_TRENDING = 1.0
WEIGHT_SIMILAR_TAG = 5.0
WEIGHT_PREFERRED_CATEGORY = 4.0
WEIGHT_USER_LIKED_TAG = 6.0
WEIGHT_USER_VIEWED_TAG = 2.0


def compute_feed_score(
    *,
    created_at,
    like_count: int,
    comment_count: int,
    view_count: int,
    is_boosted: bool,
) -> float:
    """
    Home feed ranking:
    Final Score = (Recency × 0.4) + (Engagement × 0.3) + (Boost × 0.3)
    """
    now = timezone.now()
    age_hours = max(0.0, (now - created_at).total_seconds() / 3600)
    recency = max(0.0, 1.0 - age_hours / (24 * 7))
    engagement = min(
        1.0,
        (like_count * 3 + comment_count * 5 + view_count) / 100.0,
    )
    boost = 1.0 if is_boosted else 0.0
    return recency * 0.4 + engagement * 0.3 + boost * 0.3


def compute_trending_score(*, likes: int, comments: int, views: int) -> float:
    """Popular outfit score used for trending lists."""
    return (
        likes * TRENDING_LIKES_WEIGHT
        + comments * TRENDING_COMMENTS_WEIGHT
        + views * TRENDING_VIEWS_WEIGHT
    )


def period_start(period: Optional[str]):
    """
    Return earliest created_at for trending window, or None for all-time.
    period: daily | weekly | monthly
    """
    if not period:
        return None
    now = timezone.now()
    key = period.strip().lower()
    if key == "daily":
        return now - timedelta(days=1)
    if key == "weekly":
        return now - timedelta(days=7)
    if key == "monthly":
        return now - timedelta(days=30)
    return None


def compute_recommendation_score(
    *,
    trending_score: float,
    similar_tag_matches: int,
    preferred_category_matches: int,
    liked_tag_matches: int,
    viewed_tag_matches: int,
) -> float:
    """
    Combine rule-based signals for "For you" ranking.

    Saves are not modeled yet; likes and views represent user preference.
    Tags act as style categories (e.g. casual, streetwear).
    """
    return (
        trending_score * WEIGHT_TRENDING
        + similar_tag_matches * WEIGHT_SIMILAR_TAG
        + preferred_category_matches * WEIGHT_PREFERRED_CATEGORY
        + liked_tag_matches * WEIGHT_USER_LIKED_TAG
        + viewed_tag_matches * WEIGHT_USER_VIEWED_TAG
    )
