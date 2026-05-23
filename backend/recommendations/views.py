from typing import Any, Dict, List, Set

from django.db.models import Count
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from outfits.models import OutfitPost
from recommendations.models import Tag
from recommendations.scoring import (
    compute_recommendation_score,
    compute_trending_score,
    period_start,
)


def _tag_ids_from_outfit_queryset(qs) -> Dict[int, int]:
    """Return tag_id -> weight from a queryset of outfits."""
    weights: Dict[int, int] = {}
    for outfit in qs.prefetch_related("tags"):
        for tag in outfit.tags.all():
            weights[tag.id] = weights.get(tag.id, 0) + 1
    return weights


class ForYouOutfitsView(APIView):
    """
    Rule-based recommendations (initial phase):
    - Similar tags to posts the user liked or viewed
    - Preferred categories (top tags from likes + views)
    - Trending outfits (engagement score)
    - Signals from user likes and views (saves not implemented yet)
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        limit = int(request.query_params.get("limit", 10))
        period = request.query_params.get("period", "weekly")

        user = request.user
        window_start = period_start(period)

        # --- Preferred categories: tags from liked + viewed outfits ---
        liked_outfits = OutfitPost.objects.filter(likes_outfit__user=user).distinct()
        viewed_outfits = OutfitPost.objects.filter(views_outfit__user=user).distinct()

        preferred_tag_weights: Dict[int, int] = {}
        for tag_id, w in _tag_ids_from_outfit_queryset(liked_outfits).items():
            preferred_tag_weights[tag_id] = preferred_tag_weights.get(tag_id, 0) + w * 2
        for tag_id, w in _tag_ids_from_outfit_queryset(viewed_outfits).items():
            preferred_tag_weights[tag_id] = preferred_tag_weights.get(tag_id, 0) + w

        preferred_tag_ids: Set[int] = set(preferred_tag_weights.keys())

        # Top tags from likes only (similar-style signal)
        liked_tag_ids: Set[int] = set(
            Tag.objects.filter(outfit_posts__likes_outfit__user=user)
            .values_list("id", flat=True)
            .distinct()
        )
        viewed_tag_ids: Set[int] = set(
            Tag.objects.filter(outfit_posts__views_outfit__user=user)
            .values_list("id", flat=True)
            .distinct()
        )

        # --- Candidate pool ---
        trending_qs = OutfitPost.objects.all().annotate(comment_count=Count("comments_outfit"))
        if window_start:
            trending_qs = trending_qs.filter(created_at__gte=window_start)

        trending_ids = []
        trending_ranked: List[tuple] = []
        for obj in trending_qs.select_related("author")[:200]:
            t_score = compute_trending_score(
                likes=obj.like_count,
                comments=getattr(obj, "comment_count", 0),
                views=obj.view_count,
            )
            trending_ranked.append((obj.id, t_score))
        trending_ranked.sort(key=lambda x: x[1], reverse=True)
        trending_ids = [pid for pid, _ in trending_ranked[:50]]

        tag_candidate_ids: Set[int] = set(trending_ids)
        if preferred_tag_ids:
            tag_candidate_ids |= set(
                OutfitPost.objects.filter(tags__in=preferred_tag_ids)
                .values_list("id", flat=True)[:50]
            )

        candidates = (
            OutfitPost.objects.filter(id__in=tag_candidate_ids)
            .exclude(author=user)
            .select_related("author")
            .prefetch_related("tags")
            .annotate(comment_count=Count("comments_outfit"))
        )

        items: List[Dict[str, Any]] = []
        for obj in candidates:
            post_tag_ids = {t.id for t in obj.tags.all()}

            similar_tag_matches = len(post_tag_ids & liked_tag_ids)
            preferred_category_matches = sum(
                1 for tid in post_tag_ids if tid in preferred_tag_ids
            )
            liked_tag_matches = len(post_tag_ids & liked_tag_ids)
            viewed_tag_matches = len(post_tag_ids & viewed_tag_ids)

            trending_score = compute_trending_score(
                likes=obj.like_count,
                comments=getattr(obj, "comment_count", 0),
                views=obj.view_count,
            )

            final_score = compute_recommendation_score(
                trending_score=trending_score,
                similar_tag_matches=similar_tag_matches,
                preferred_category_matches=preferred_category_matches,
                liked_tag_matches=liked_tag_matches,
                viewed_tag_matches=viewed_tag_matches,
            )

            items.append(
                {
                    "id": obj.id,
                    "image_url": request.build_absolute_uri(obj.image.url) if obj.image else None,
                    "caption": obj.caption,
                    "author": {"id": obj.author_id, "username": obj.author.username},
                    "created_at": obj.created_at,
                    "view_count": obj.view_count,
                    "like_count": obj.like_count,
                    "comment_count": getattr(obj, "comment_count", 0),
                    "trending_score": trending_score,
                    "recommendation_score": final_score,
                    "tag_match_count": similar_tag_matches,
                }
            )

        items_sorted = sorted(items, key=lambda x: x["recommendation_score"], reverse=True)[:limit]
        return Response(
            {
                "for_you_outfits": items_sorted,
                "period": period,
                "rules": {
                    "similar_tags": "Posts sharing tags with outfits you liked",
                    "preferred_categories": "Posts in your top tags from likes and views",
                    "trending": f"Trending score over {period or 'all-time'} window",
                    "user_likes_views": "Boosts from your like and view history (saves not yet tracked)",
                    "trending_formula": "(Likes × 3) + (Comments × 5) + (Views × 1)",
                },
            }
        )
