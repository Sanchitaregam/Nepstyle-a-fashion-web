from typing import Any, Dict, List

from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum, Value
from django.db.models.functions import Coalesce
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from outfits.models import OutfitPost
from reels.models import Reel
from recommendations.models import Tag
from recommendations.scoring import compute_trending_score, period_start


def serialize_outfit_post(request, obj: OutfitPost) -> Dict[str, Any]:
    return {
        "id": obj.id,
        "image_url": request.build_absolute_uri(obj.image.url) if obj.image else None,
        "caption": obj.caption,
        "author": {"id": obj.author_id, "username": obj.author.username},
        "created_at": obj.created_at,
        "view_count": obj.view_count,
        "like_count": obj.like_count,
        "comment_count": getattr(obj, "comment_count", 0),
    }


class OutfitSearchView(APIView):
    """Search outfit posts by caption, tag names, or author username."""

    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        query = request.query_params.get("q", "").strip()
        limit = min(max(int(request.query_params.get("limit", 20)), 1), 50)

        if not query:
            return Response({"query": "", "count": 0, "results": []})

        filters = Q()
        for word in query.split():
            filters &= (
                Q(caption__icontains=word)
                | Q(author__username__icontains=word)
                | Q(tags__name__icontains=word)
            )

        outfits_qs = (
            OutfitPost.objects.filter(filters)
            .select_related("author")
            .annotate(comment_count=Count("comments_outfit"))
            .distinct()
            .order_by("-created_at")[:limit]
        )
        results = [serialize_outfit_post(request, obj) for obj in outfits_qs]
        return Response({"query": query, "count": len(results), "results": results})


class HomeFeedView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        limit = int(request.query_params.get("limit", 10))
        trending_limit = int(request.query_params.get("trending_limit", 10))
        period = request.query_params.get("period", "weekly")
        window_start = period_start(period)

        outfits_qs = (
            OutfitPost.objects.all()
            .select_related("author")
            .annotate(comment_count=Count("comments_outfit"))
        )
        if window_start:
            outfits_qs = outfits_qs.filter(created_at__gte=window_start)
        outfits_qs = outfits_qs.order_by("-created_at")[:200]

        outfit_items: List[Dict[str, Any]] = []
        for obj in outfits_qs:
            score = compute_trending_score(
                likes=obj.like_count,
                comments=getattr(obj, "comment_count", 0),
                views=obj.view_count,
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
                    "trending_score": score,
                }
            )

        trending_outfits = sorted(outfit_items, key=lambda x: x["trending_score"], reverse=True)[
            :trending_limit
        ]

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
        )
        if window_start:
            reels_qs = reels_qs.filter(created_at__gte=window_start)
        reels_qs = reels_qs.order_by("-created_at")[:200]

        reel_items: List[Dict[str, Any]] = []
        for obj in reels_qs:
            score = compute_trending_score(
                likes=obj.like_count,
                comments=getattr(obj, "comment_count", 0),
                views=obj.view_count,
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
                    "trending_score": score,
                }
            )

        trending_reels = sorted(reel_items, key=lambda x: x["trending_score"], reverse=True)[:trending_limit]

        return Response(
            {
                "trending_outfits": trending_outfits,
                "latest_outfits": latest_outfits,
                "trending_reels": trending_reels,
                "trending_period": period,
                "trending_formula": "(Likes × 3) + (Comments × 5) + (Views × 1)",
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
