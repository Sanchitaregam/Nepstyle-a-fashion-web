from datetime import timedelta
from typing import Any

from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

from accounts.models import Follow, ProfileViewEvent
from comments.models import Comment
from outfits.models import OutfitPost
from recommendations.models import Tag


def _format_change(current: int, previous: int) -> str:
    if previous <= 0:
        return "+100%" if current > 0 else "0%"
    pct = ((current - previous) / previous) * 100
    sign = "+" if pct >= 0 else ""
    return f"{sign}{pct:.1f}%"


def build_creator_analytics(user, request) -> dict[str, Any]:
    now = timezone.now()
    period_start = now - timedelta(days=30)
    prev_start = now - timedelta(days=60)

    outfits = OutfitPost.objects.filter(author=user)
    outfit_ids = outfits.values_list("id", flat=True)

    profile_views = ProfileViewEvent.objects.filter(profile=user).count()
    profile_views_period = ProfileViewEvent.objects.filter(
        profile=user, viewed_at__gte=period_start
    ).count()
    profile_views_prev = ProfileViewEvent.objects.filter(
        profile=user, viewed_at__gte=prev_start, viewed_at__lt=period_start
    ).count()

    agg = outfits.aggregate(
        total_post_views=Sum("view_count"),
        total_likes=Sum("like_count"),
    )
    total_post_views = int(agg["total_post_views"] or 0)
    total_likes = int(agg["total_likes"] or 0)
    total_comments = Comment.objects.filter(outfit_post_id__in=outfit_ids).count()
    total_posts = outfits.count()

    followers_now = Follow.objects.filter(following=user).count()
    followers_gained = Follow.objects.filter(
        following=user, created_at__gte=period_start
    ).count()
    followers_prev = Follow.objects.filter(
        following=user, created_at__gte=prev_start, created_at__lt=period_start
    ).count()

    profile_views_trend = list(
        ProfileViewEvent.objects.filter(profile=user, viewed_at__gte=period_start)
        .annotate(date=TruncDate("viewed_at"))
        .values("date")
        .annotate(views=Count("id"))
        .order_by("date")
    )
    profile_views_chart = [
        {
            "date": row["date"].strftime("%b %d") if row["date"] else "",
            "views": row["views"],
        }
        for row in profile_views_trend
    ]

    engagement_chart = list(
        outfits.filter(created_at__gte=period_start)
        .annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(
            likes=Sum("like_count"),
            views=Sum("view_count"),
        )
        .order_by("date")
    )
    engagement_by_date: dict = {}
    for row in engagement_chart:
        key = row["date"]
        if not key:
            continue
        engagement_by_date[key] = {
            "date": key.strftime("%b %d"),
            "likes": int(row["likes"] or 0),
            "views": int(row["views"] or 0),
            "comments": 0,
        }

    comment_rows = (
        Comment.objects.filter(outfit_post_id__in=outfit_ids, created_at__gte=period_start)
        .annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(comments=Count("id"))
        .order_by("date")
    )
    for row in comment_rows:
        key = row["date"]
        if not key:
            continue
        if key not in engagement_by_date:
            engagement_by_date[key] = {
                "date": key.strftime("%b %d"),
                "likes": 0,
                "views": 0,
                "comments": 0,
            }
        engagement_by_date[key]["comments"] = row["comments"]

    engagement_chart_data = sorted(engagement_by_date.values(), key=lambda x: x["date"])

    audience_interests = list(
        Tag.objects.filter(outfit_posts__author=user)
        .annotate(post_count=Count("outfit_posts", distinct=True))
        .order_by("-post_count")[:5]
    )
    total_tag_posts = sum(t.post_count for t in audience_interests) or 1
    audience_chart = [
        {
            "name": tag.name.title(),
            "value": round((tag.post_count / total_tag_posts) * 100, 1),
        }
        for tag in audience_interests
    ]
    chart_colors = ["#8b5cf6", "#6366f1", "#a78bfa", "#c4b5fd", "#ddd6fe"]
    for i, item in enumerate(audience_chart):
        item["color"] = chart_colors[i % len(chart_colors)]

    recent_viewers = []
    for event in (
        ProfileViewEvent.objects.filter(profile=user, viewer__isnull=False)
        .select_related("viewer")
        .order_by("-viewed_at")[:8]
    ):
        viewer = event.viewer
        avatar_url = None
        if viewer.avatar:
            avatar_url = request.build_absolute_uri(viewer.avatar.url)
        recent_viewers.append(
            {
                "username": viewer.username,
                "avatar_url": avatar_url,
                "location": viewer.location or "",
                "viewed_at": event.viewed_at,
            }
        )

    top_posts = []
    for post in outfits.select_related("author").order_by("-view_count")[:5]:
        comment_count = Comment.objects.filter(outfit_post=post).count()
        views = post.view_count or 0
        likes = post.like_count or 0
        engagement = ((likes + comment_count) / views * 100) if views > 0 else 0
        image_url = request.build_absolute_uri(post.image.url) if post.image else None
        top_posts.append(
            {
                "id": post.id,
                "title": (post.caption or f"Post #{post.id}")[:80],
                "date": post.created_at.strftime("%b %d, %Y"),
                "image_url": image_url,
                "likes": likes,
                "comments": comment_count,
                "views": views,
                "engagement": f"{engagement:.1f}%",
                "is_boosted": post.boost_active,
            }
        )

    kpis = [
        {
            "id": "profile-views",
            "title": "Profile Views",
            "value": _compact_number(profile_views),
            "change": _format_change(profile_views_period, profile_views_prev),
            "icon": "Eye",
            "iconBg": "bg-violet-50 text-violet-600",
        },
        {
            "id": "post-views",
            "title": "Post Views",
            "value": _compact_number(total_post_views),
            "change": _format_change(total_post_views, max(total_post_views - profile_views_period, 0)),
            "icon": "FileText",
            "iconBg": "bg-blue-50 text-blue-600",
        },
        {
            "id": "likes",
            "title": "Likes Received",
            "value": _compact_number(total_likes),
            "change": _format_change(total_likes, max(total_likes // 2, 0)),
            "icon": "Heart",
            "iconBg": "bg-pink-50 text-pink-600",
        },
        {
            "id": "comments",
            "title": "Comments",
            "value": _compact_number(total_comments),
            "change": _format_change(total_comments, max(total_comments // 2, 0)),
            "icon": "MessageCircle",
            "iconBg": "bg-amber-50 text-amber-600",
        },
        {
            "id": "followers",
            "title": "New Followers",
            "value": f"+{_compact_number(followers_gained)}",
            "change": _format_change(followers_gained, followers_prev),
            "icon": "Users",
            "iconBg": "bg-emerald-50 text-emerald-600",
        },
    ]

    return {
        "kpis": kpis,
        "profile_views_trend": profile_views_chart,
        "engagement_trend": engagement_chart_data,
        "audience_interests": audience_chart,
        "recent_viewers": recent_viewers,
        "top_posts": top_posts,
        "summary": {
            "profile_views": profile_views,
            "total_post_views": total_post_views,
            "total_likes": total_likes,
            "total_comments": total_comments,
            "total_posts": total_posts,
            "followers": followers_now,
            "followers_gained": followers_gained,
        },
        "has_gold_insights": user.subscription_tier in ("gold", "business"),
    }


def _compact_number(n: int) -> str:
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 10_000:
        return f"{n / 1_000:.1f}K"
    if n >= 1_000:
        return f"{n / 1_000:.1f}K"
    return str(n)
