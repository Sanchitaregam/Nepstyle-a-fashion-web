from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from .models import Reel
from .serializers import ReelManageSerializer, ReelSerializer, ReelUpdateSerializer


class ReelViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for reels.
    """

    queryset = Reel.objects.all().select_related("author")
    serializer_class = ReelSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == "create":
            return ReelManageSerializer
        if self.action in ["update", "partial_update"]:
            return ReelUpdateSerializer
        return ReelSerializer

    def perform_update(self, serializer):
        if serializer.instance.author_id != self.request.user.id:
            raise PermissionDenied("You can only edit your own reels.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author_id != self.request.user.id:
            raise PermissionDenied("You can only delete your own reels.")
        instance.delete()
