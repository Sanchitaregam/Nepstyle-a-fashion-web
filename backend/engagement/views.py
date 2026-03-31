from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from engagement.models import Like, View
from outfits.models import OutfitPost
from reels.models import Reel


class OutfitLikeToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, outfit_id: int):
        outfit = get_object_or_404(OutfitPost, id=outfit_id)

        with transaction.atomic():
            like = Like.objects.filter(user=request.user, outfit_post=outfit).first()
            if like:
                like.delete()
                OutfitPost.objects.filter(id=outfit.id).update(like_count=F("like_count") - 1)
                liked = False
            else:
                Like.objects.create(user=request.user, outfit_post=outfit)
                OutfitPost.objects.filter(id=outfit.id).update(like_count=F("like_count") + 1)
                liked = True

        outfit.refresh_from_db(fields=["like_count"])
        return Response({"liked": liked, "like_count": outfit.like_count}, status=status.HTTP_200_OK)


class OutfitLikeStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, outfit_id: int):
        outfit = get_object_or_404(OutfitPost, id=outfit_id)
        liked = Like.objects.filter(user=request.user, outfit_post=outfit).exists()
        return Response({"liked": liked, "like_count": outfit.like_count}, status=status.HTTP_200_OK)


class OutfitViewIncrementView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, outfit_id: int):
        outfit = get_object_or_404(OutfitPost, id=outfit_id)

        with transaction.atomic():
            if request.user.is_authenticated:
                existing = View.objects.filter(user=request.user, outfit_post=outfit).first()
                if not existing:
                    View.objects.create(user=request.user, outfit_post=outfit)
                    OutfitPost.objects.filter(id=outfit.id).update(view_count=F("view_count") + 1)
            else:
                View.objects.create(user=None, outfit_post=outfit)
                OutfitPost.objects.filter(id=outfit.id).update(view_count=F("view_count") + 1)

        outfit.refresh_from_db(fields=["view_count"])
        return Response({"view_count": outfit.view_count}, status=status.HTTP_200_OK)


class ReelLikeToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, reel_id: int):
        reel = get_object_or_404(Reel, id=reel_id)

        with transaction.atomic():
            like = Like.objects.filter(user=request.user, reel=reel).first()
            if like:
                like.delete()
                Reel.objects.filter(id=reel.id).update(like_count=F("like_count") - 1)
                liked = False
            else:
                Like.objects.create(user=request.user, reel=reel)
                Reel.objects.filter(id=reel.id).update(like_count=F("like_count") + 1)
                liked = True

        reel.refresh_from_db(fields=["like_count"])
        return Response({"liked": liked, "like_count": reel.like_count}, status=status.HTTP_200_OK)


class ReelLikeStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, reel_id: int):
        reel = get_object_or_404(Reel, id=reel_id)
        liked = Like.objects.filter(user=request.user, reel=reel).exists()
        return Response({"liked": liked, "like_count": reel.like_count}, status=status.HTTP_200_OK)


class ReelViewIncrementView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, reel_id: int):
        reel = get_object_or_404(Reel, id=reel_id)

        with transaction.atomic():
            if request.user.is_authenticated:
                existing = View.objects.filter(user=request.user, reel=reel).first()
                if not existing:
                    View.objects.create(user=request.user, reel=reel)
                    Reel.objects.filter(id=reel.id).update(view_count=F("view_count") + 1)
            else:
                View.objects.create(user=None, reel=reel)
                Reel.objects.filter(id=reel.id).update(view_count=F("view_count") + 1)

        reel.refresh_from_db(fields=["view_count"])
        return Response({"view_count": reel.view_count}, status=status.HTTP_200_OK)
