from django.contrib.auth import get_user_model
from rest_framework import serializers
from typing import Optional

from .models import Reel
from recommendations.models import Tag

User = get_user_model()


class ReelSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()
    author = serializers.SerializerMethodField()

    class Meta:
        model = Reel
        fields = [
            "id",
            "video_url",
            "caption",
            "author",
            "created_at",
            "view_count",
            "like_count",
        ]

    def get_video_url(self, obj: Reel) -> Optional[str]:
        request = self.context.get("request")
        if not obj.video:
            return None
        url = obj.video.url
        return request.build_absolute_uri(url) if request else url

    def get_author(self, obj: Reel):
        return {"id": obj.author_id, "username": obj.author.username}


class ReelManageSerializer(serializers.ModelSerializer):
    # For create, require the video upload.
    video = serializers.FileField()
    tags = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Reel
        fields = ["id", "video", "caption", "tags"]

    def create(self, validated_data):
        tags_raw = validated_data.pop("tags", None)
        request = self.context["request"]
        validated_data["author"] = request.user
        reel = super().create(validated_data)
        if tags_raw is not None:
            self._set_tags(reel, tags_raw)
        return reel

    def _set_tags(self, reel: Reel, tags_raw: str):
        tag_names = [t.strip().lower() for t in (tags_raw or "").split(",") if t.strip()]
        tags = []
        for name in tag_names:
            tag, _ = Tag.objects.get_or_create(name=name)
            tags.append(tag)
        reel.tags.set(tags)


class ReelUpdateSerializer(serializers.ModelSerializer):
    # For update, allow changing caption without re-uploading the file.
    video = serializers.FileField(required=False)
    tags = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Reel
        fields = ["id", "video", "caption", "tags"]

    def update(self, instance: Reel, validated_data):
        tags_raw = validated_data.pop("tags", None)
        reel = super().update(instance, validated_data)
        if tags_raw is not None:
            self._set_tags(reel, tags_raw)
        return reel

    def _set_tags(self, reel: Reel, tags_raw: str):
        tag_names = [t.strip().lower() for t in (tags_raw or "").split(",") if t.strip()]
        tags = []
        for name in tag_names:
            tag, _ = Tag.objects.get_or_create(name=name)
            tags.append(tag)
        reel.tags.set(tags)


