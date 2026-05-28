from django.contrib.auth import get_user_model
from rest_framework import serializers

from comments.models import Comment
from outfits.models import OutfitPost
from reels.models import Reel

from .models import Follow

User = get_user_model()


class UserMeSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "avatar_url", "bio", "location", "website"]

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if not getattr(obj, "avatar", None) or not obj.avatar:
            return None
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password2"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class PublicUserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "avatar_url"]

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if not getattr(obj, "avatar", None) or not obj.avatar:
            return None
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url


class ProfileSummarySerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    posts_count = serializers.IntegerField(read_only=True)
    followers_count = serializers.IntegerField(read_only=True)
    following_count = serializers.IntegerField(read_only=True)
    is_own_profile = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "avatar_url",
            "bio",
            "location",
            "website",
            "posts_count",
            "followers_count",
            "following_count",
            "is_own_profile",
            "is_following",
        ]

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if not getattr(obj, "avatar", None) or not obj.avatar:
            return None
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url

    def get_is_own_profile(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and request.user.id == obj.id)

    def get_is_following(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated or request.user.id == obj.id:
            return False
        return Follow.objects.filter(follower=request.user, following=obj).exists()


class FollowerListItemSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "avatar_url", "is_following"]

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if not getattr(obj, "avatar", None) or not obj.avatar:
            return None
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url

    def get_is_following(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return Follow.objects.filter(follower=request.user, following=obj).exists()


class ProfileOutfitSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = OutfitPost
        fields = ["id", "image_url", "caption", "created_at", "like_count", "comment_count"]

    def get_image_url(self, obj):
        request = self.context.get("request")
        if not obj.image:
            return None
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url

    def get_comment_count(self, obj):
        return Comment.objects.filter(outfit_post=obj).count()


class ProfileReelSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Reel
        fields = ["id", "video_url", "caption", "created_at", "like_count", "comment_count"]

    def get_video_url(self, obj):
        request = self.context.get("request")
        if not obj.video:
            return None
        url = obj.video.url
        return request.build_absolute_uri(url) if request else url

    def get_comment_count(self, obj):
        return Comment.objects.filter(reel=obj).count()


class EditProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ["avatar", "username", "bio", "location", "website"]

    def update(self, instance, validated_data):
        # If avatar is explicitly set to null, remove file and clear the field.
        if "avatar" in validated_data and validated_data["avatar"] is None and instance.avatar:
            instance.avatar.delete(save=False)

        # If a new avatar is uploaded, clean up old file first.
        if "avatar" in validated_data and validated_data["avatar"] is not None and instance.avatar:
            instance.avatar.delete(save=False)

        return super().update(instance, validated_data)


class UserSearchSerializer(serializers.ModelSerializer):
    """Serializer for user search results."""
    avatar_url = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "avatar_url", "full_name", "is_following"]

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if not getattr(obj, "avatar", None) or not obj.avatar:
            return None
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_is_following(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return Follow.objects.filter(follower=request.user, following=obj).exists()

