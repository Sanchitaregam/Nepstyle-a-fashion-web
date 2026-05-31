from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)
    actor_avatar_url = serializers.SerializerMethodField()
    link_path = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "message",
            "read",
            "created_at",
            "actor_username",
            "actor_avatar_url",
            "link_path",
        ]

    def get_actor_avatar_url(self, obj):
        request = self.context.get("request")
        avatar = getattr(obj.actor, "avatar", None)
        if not avatar:
            return None
        url = avatar.url
        return request.build_absolute_uri(url) if request else url

    def get_link_path(self, obj):
        if obj.notification_type == Notification.TYPE_FOLLOW:
            return f"/u/{obj.actor.username}"
        if obj.notification_type == Notification.TYPE_OUTFIT and obj.outfit_id:
            return f"/outfits/{obj.outfit_id}"
        if obj.notification_type == Notification.TYPE_REEL:
            return f"/u/{obj.actor.username}"
        return f"/u/{obj.actor.username}"
