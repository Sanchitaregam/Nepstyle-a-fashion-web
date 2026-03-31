from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers
from typing import Optional

from .models import OutfitPost
from recommendations.models import Tag


User = get_user_model()


class OutfitPostSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    author = serializers.SerializerMethodField()

    class Meta:
        model = OutfitPost
        fields = [
            "id",
            "image_url",
            "caption",
            "author",
            "created_at",
            "view_count",
            "like_count",
        ]

    def get_image_url(self, obj: OutfitPost) -> Optional[str]:
        request = self.context.get("request")
        if not obj.image:
            return None
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url

    def get_author(self, obj: OutfitPost):
        return {"id": obj.author_id, "username": obj.author.username}


class OutfitPostCreateSerializer(serializers.ModelSerializer):
    # Comma-separated tag names (e.g., "streetwear, casual")
    tags = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = OutfitPost
        fields = ["id", "image", "caption", "tags"]

    def create(self, validated_data):
        tags_raw = validated_data.pop("tags", None)
        request = self.context["request"]
        validated_data["author"] = request.user
        post = super().create(validated_data)
        if tags_raw is not None:
            self._set_tags(post, tags_raw)
        return post

    def _set_tags(self, post: OutfitPost, tags_raw: str):
        tag_names = [t.strip().lower() for t in (tags_raw or "").split(",") if t.strip()]
        tags = []
        for name in tag_names:
            tag, _ = Tag.objects.get_or_create(name=name)
            tags.append(tag)
        post.tags.set(tags)


class OutfitPostUpdateSerializer(serializers.ModelSerializer):
    tags = serializers.CharField(required=False, allow_blank=True, write_only=True)
    image = serializers.ImageField(required=False)

    class Meta:
        model = OutfitPost
        fields = ["id", "image", "caption", "tags"]

    def update(self, instance: OutfitPost, validated_data):
        tags_raw = validated_data.pop("tags", None)
        post = super().update(instance, validated_data)
        if tags_raw is not None:
            self._set_tags(post, tags_raw)
        return post

    def _set_tags(self, post: OutfitPost, tags_raw: str):
        tag_names = [t.strip().lower() for t in (tags_raw or "").split(",") if t.strip()]
        tags = []
        for name in tag_names:
            tag, _ = Tag.objects.get_or_create(name=name)
            tags.append(tag)
        post.tags.set(tags)

