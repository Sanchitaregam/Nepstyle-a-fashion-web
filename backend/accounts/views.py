from django.contrib.auth import get_user_model
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from outfits.models import OutfitPost
from reels.models import Reel

from .models import Follow
from .serializers import (
    EditProfileSerializer,
    FollowerListItemSerializer,
    ProfileOutfitSerializer,
    ProfileReelSerializer,
    ProfileSummarySerializer,
    RegisterSerializer,
    UserMeSerializer,
)

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = UserMeSerializer(request.user, context={"request": request})
        return Response(serializer.data)


class ProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, username: str):
        user = get_object_or_404(
            User.objects.annotate(
                followers_count=Count("follower_relations", distinct=True),
                following_count=Count("following_relations", distinct=True),
                outfits_count=Count("outfit_posts", distinct=True),
                reels_count=Count("reels", distinct=True),
            ),
            username=username,
        )
        user.posts_count = int(getattr(user, "outfits_count", 0) + getattr(user, "reels_count", 0))
        serializer = ProfileSummarySerializer(user, context={"request": request})
        return Response(serializer.data)


class ProfileFollowersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, username: str):
        user = get_object_or_404(User, username=username)
        followers = User.objects.filter(following_relations__following=user).order_by("username")
        serializer = FollowerListItemSerializer(followers, many=True, context={"request": request})
        return Response(serializer.data)


class ProfileFollowingView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, username: str):
        user = get_object_or_404(User, username=username)
        following = User.objects.filter(follower_relations__follower=user).order_by("username")
        serializer = FollowerListItemSerializer(following, many=True, context={"request": request})
        return Response(serializer.data)


class ProfileFollowToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, username: str):
        target = get_object_or_404(User, username=username)
        if target.id == request.user.id:
            return Response({"detail": "You cannot follow yourself."}, status=status.HTTP_400_BAD_REQUEST)
        relation = Follow.objects.filter(follower=request.user, following=target).first()
        if relation:
            relation.delete()
            following = False
        else:
            Follow.objects.create(follower=request.user, following=target)
            following = True
        return Response({"following": following})


class ProfileOutfitsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, username: str):
        user = get_object_or_404(User, username=username)
        outfits = OutfitPost.objects.filter(author=user).order_by("-created_at")
        serializer = ProfileOutfitSerializer(outfits, many=True, context={"request": request})
        return Response(serializer.data)


class ProfileReelsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, username: str):
        user = get_object_or_404(User, username=username)
        reels = Reel.objects.filter(author=user).order_by("-created_at")
        serializer = ProfileReelSerializer(reels, many=True, context={"request": request})
        return Response(serializer.data)


class EditMyProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        serializer = EditProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserMeSerializer(request.user, context={"request": request}).data)
