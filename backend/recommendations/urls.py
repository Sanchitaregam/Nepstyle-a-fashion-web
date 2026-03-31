from django.urls import path

from .views import ForYouOutfitsView

urlpatterns = [
    path("for-you/", ForYouOutfitsView.as_view(), name="for-you-outfits"),
]

