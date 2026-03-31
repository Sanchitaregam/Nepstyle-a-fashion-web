from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import OutfitPost
from .serializers import (
    OutfitPostCreateSerializer,
    OutfitPostSerializer,
    OutfitPostUpdateSerializer,
)


class OutfitPostViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for outfit posts.
    """

    queryset = OutfitPost.objects.all().select_related("author")
    serializer_class = OutfitPostSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == "create":
            return OutfitPostCreateSerializer
        if self.action in ["update", "partial_update"]:
            return OutfitPostUpdateSerializer
        return OutfitPostSerializer
