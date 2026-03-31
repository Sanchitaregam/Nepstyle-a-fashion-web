from typing import Any, Dict, List, Set

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from outfits.models import OutfitPost
from recommendations.models import Tag

ALPHA = 1.0
BETA = 2.0
GAMMA = 1.0
DELTA = 1.5
TAG_MATCH_BONUS = 5.0


def compute_score(*, likes: int, comments: int, views: int, created_at) -> float:
    hours_since = (timezone.now() - created_at).total_seconds() / 3600.0
    return (likes * ALPHA + comments * BETA + views * GAMMA) / ((hours_since + 2.0) ** DELTA)


class ForYouOutfitsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        limit = int(request.query_params.get("limit", 10))

        user = request.user

        top_tags_qs = (
            Tag.objects.annotate(
                weight=Count(
                    "outfit_posts",
                    filter=Q(outfit_posts__likes_outfit__user=user),
                    distinct=True,
                )
            )
            .filter(weight__gt=0)
            .order_by("-weight")[:5]
        )
        top_tag_ids: Set[int] = {t.id for t in top_tags_qs}

        # Recent popular + matching-tag candidates.
        popular_qs = (
            OutfitPost.objects.all()
            .annotate(comment_count=Count("comments_outfit"))
            .order_by("-like_count", "-view_count")[:50]
            .values_list("id", flat=True)
        )
        if top_tag_ids:
            tagged_qs = (
                OutfitPost.objects.filter(tags__in=top_tags_qs)
                .annotate(comment_count=Count("comments_outfit"))
                .order_by("-created_at")[:50]
                .values_list("id", flat=True)
            )
            candidate_ids = set(popular_qs) | set(tagged_qs)
        else:
            candidate_ids = set(popular_qs)

        candidates = (
            OutfitPost.objects.filter(id__in=candidate_ids)
            .select_related("author")
            .prefetch_related("tags")
            .annotate(comment_count=Count("comments_outfit"))
        )

        items: List[Dict[str, Any]] = []
        for obj in candidates:
            tag_match_count = sum(1 for t in obj.tags.all() if t.id in top_tag_ids)
            engagement_score = compute_score(
                likes=obj.like_count,
                comments=getattr(obj, "comment_count", 0),
                views=obj.view_count,
                created_at=obj.created_at,
            )
            final_score = engagement_score + (tag_match_count * TAG_MATCH_BONUS)
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
                    "score": final_score,
                    "tag_match_count": tag_match_count,
                }
            )

        items_sorted = sorted(items, key=lambda x: x["score"], reverse=True)[:limit]
        return Response({"for_you_outfits": items_sorted})
