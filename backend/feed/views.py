from typing import Any, Dict, List

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from outfits.models import OutfitPost
from reels.models import Reel
from recommendations.models import Tag

ALPHA = 1.0  # likes weight
BETA = 2.0  # comments weight
GAMMA = 1.0  # views weight
DELTA = 1.5  # time decay


def compute_score(*, likes: int, comments: int, views: int, created_at) -> float:
    hours_since = (timezone.now() - created_at).total_seconds() / 3600.0
    return (likes * ALPHA + comments * BETA + views * GAMMA) / ((hours_since + 2.0) ** DELTA)


class HomeFeedView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        limit = int(request.query_params.get("limit", 10))
        trending_limit = int(request.query_params.get("trending_limit", 10))

        outfits_qs = (
            OutfitPost.objects.all()
            .select_related("author")
            .annotate(comment_count=Count("comments_outfit"))
            .order_by("-created_at")[:200]
        )
        outfit_items: List[Dict[str, Any]] = []
        for obj in outfits_qs:
            score = compute_score(
                likes=obj.like_count,
                comments=getattr(obj, "comment_count", 0),
                views=obj.view_count,
                created_at=obj.created_at,
            )
            outfit_items.append(
                {
                    "id": obj.id,
                    "image_url": request.build_absolute_uri(obj.image.url) if obj.image else None,
                    "caption": obj.caption,
                    "author": {"id": obj.author_id, "username": obj.author.username},
                    "created_at": obj.created_at,
                    "view_count": obj.view_count,
                    "like_count": obj.like_count,
                    "comment_count": getattr(obj, "comment_count", 0),
                    "score": score,
                }
            )

        trending_outfits = sorted(outfit_items, key=lambda x: x["score"], reverse=True)[:trending_limit]

        latest_outfits_qs = (
            OutfitPost.objects.all()
            .select_related("author")
            .annotate(comment_count=Count("comments_outfit"))
            .order_by("-created_at")[:limit]
        )
        latest_outfits = [
            {
                "id": obj.id,
                "image_url": request.build_absolute_uri(obj.image.url) if obj.image else None,
                "caption": obj.caption,
                "author": {"id": obj.author_id, "username": obj.author.username},
                "created_at": obj.created_at,
                "view_count": obj.view_count,
                "like_count": obj.like_count,
                "comment_count": getattr(obj, "comment_count", 0),
            }
            for obj in latest_outfits_qs
        ]

        reels_qs = (
            Reel.objects.all()
            .select_related("author")
            .annotate(comment_count=Count("comments_reel"))
            .order_by("-created_at")[:200]
        )
        reel_items: List[Dict[str, Any]] = []
        for obj in reels_qs:
            score = compute_score(
                likes=obj.like_count,
                comments=getattr(obj, "comment_count", 0),
                views=obj.view_count,
                created_at=obj.created_at,
            )
            reel_items.append(
                {
                    "id": obj.id,
                    "video_url": request.build_absolute_uri(obj.video.url) if obj.video else None,
                    "caption": obj.caption,
                    "author": {"id": obj.author_id, "username": obj.author.username},
                    "created_at": obj.created_at,
                    "view_count": obj.view_count,
                    "like_count": obj.like_count,
                    "comment_count": getattr(obj, "comment_count", 0),
                    "score": score,
                }
            )

        trending_reels = sorted(reel_items, key=lambda x: x["score"], reverse=True)[:trending_limit]

        return Response(
            {
                "trending_outfits": trending_outfits,
                "latest_outfits": latest_outfits,
                "trending_reels": trending_reels,
            }
        )


class TrendingTagsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        limit = int(request.query_params.get("limit", 5))
        tags_qs = (
            Tag.objects.annotate(post_count=Count("outfit_posts"))
            .order_by("-post_count", "name")[:limit]
        )
        tags = [{"name": t.name, "post_count": t.post_count} for t in tags_qs]
        return Response({"tags": tags})


class TopCreatorsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        limit = int(request.query_params.get("limit", 5))
        User = get_user_model()
        users = (
            User.objects.annotate(
                total_likes=Coalesce(Sum("outfit_posts__like_count"), Value(0))
            )
            .order_by("-total_likes", "username")[:limit]
        )
        creators = [
            {
                "id": u.id,
                "username": u.username,
                "total_likes": int(u.total_likes or 0),
            }
            for u in users
        ]
        return Response({"creators": creators})
