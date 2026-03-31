from django.urls import path

from .views import (
    OutfitLikeStatusView,
    OutfitLikeToggleView,
    OutfitViewIncrementView,
    ReelLikeStatusView,
    ReelLikeToggleView,
    ReelViewIncrementView,
)

urlpatterns = [
    path("outfits/<int:outfit_id>/like/", OutfitLikeToggleView.as_view(), name="outfit-like-toggle"),
    path(
        "outfits/<int:outfit_id>/like-status/",
        OutfitLikeStatusView.as_view(),
        name="outfit-like-status",
    ),
    path("outfits/<int:outfit_id>/view/", OutfitViewIncrementView.as_view(), name="outfit-view"),
    path("reels/<int:reel_id>/like/", ReelLikeToggleView.as_view(), name="reel-like-toggle"),
    path("reels/<int:reel_id>/like-status/", ReelLikeStatusView.as_view(), name="reel-like-status"),
    path("reels/<int:reel_id>/view/", ReelViewIncrementView.as_view(), name="reel-view"),
]

