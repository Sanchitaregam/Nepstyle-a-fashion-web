from django.urls import path

from .views import OutfitCommentsView, ReelCommentsView

urlpatterns = [
    path("outfits/<int:outfit_id>/comments/", OutfitCommentsView.as_view(), name="outfit-comments"),
    path("reels/<int:reel_id>/comments/", ReelCommentsView.as_view(), name="reel-comments"),
]

