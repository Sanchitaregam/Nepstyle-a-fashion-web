from django.urls import path

from .views import HomeFeedView, OutfitSearchView, TopCreatorsView, TrendingTagsView

urlpatterns = [
    path("home/", HomeFeedView.as_view(), name="home-feed"),
    path("search/", OutfitSearchView.as_view(), name="outfit-search"),
    path("trending-tags/", TrendingTagsView.as_view(), name="trending-tags"),
    path("top-creators/", TopCreatorsView.as_view(), name="top-creators"),
]

