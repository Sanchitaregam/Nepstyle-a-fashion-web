from django.urls import path

from .views import (
    EditMyProfileView,
    MeView,
    ProfileFollowersView,
    ProfileFollowToggleView,
    ProfileFollowingView,
    ProfileOutfitsView,
    ProfileReelsView,
    ProfileView,
    RegisterView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("me/edit/", EditMyProfileView.as_view(), name="edit-me"),
    path("profiles/<str:username>/", ProfileView.as_view(), name="profile"),
    path("profiles/<str:username>/followers/", ProfileFollowersView.as_view(), name="profile-followers"),
    path("profiles/<str:username>/following/", ProfileFollowingView.as_view(), name="profile-following"),
    path("profiles/<str:username>/follow-toggle/", ProfileFollowToggleView.as_view(), name="profile-follow-toggle"),
    path("profiles/<str:username>/photos/", ProfileOutfitsView.as_view(), name="profile-photos"),
    path("profiles/<str:username>/videos/", ProfileReelsView.as_view(), name="profile-videos"),
]

