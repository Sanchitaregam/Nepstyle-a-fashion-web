from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from comments.models import Comment

from .serializers import CommentSerializer
from outfits.models import OutfitPost
from reels.models import Reel

User = get_user_model()


class OutfitCommentsView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, outfit_id: int):
        outfit = get_object_or_404(OutfitPost, id=outfit_id)
        qs = Comment.objects.filter(outfit_post=outfit).select_related("user")
        serializer = CommentSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request, outfit_id: int):
        outfit = get_object_or_404(OutfitPost, id=outfit_id)
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        text = request.data.get("text", "").strip()
        if not text:
            return Response(
                {"text": "This field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        comment = Comment.objects.create(user=request.user, outfit_post=outfit, text=text)
        serializer = CommentSerializer(comment, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReelCommentsView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, reel_id: int):
        reel = get_object_or_404(Reel, id=reel_id)
        qs = Comment.objects.filter(reel=reel).select_related("user")
        serializer = CommentSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request, reel_id: int):
        reel = get_object_or_404(Reel, id=reel_id)
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        text = request.data.get("text", "").strip()
        if not text:
            return Response(
                {"text": "This field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        comment = Comment.objects.create(user=request.user, reel=reel, text=text)
        serializer = CommentSerializer(comment, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
