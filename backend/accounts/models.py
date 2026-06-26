from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model so we can safely extend later without migrations surprises.
    """

    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    bio = models.TextField(blank=True, default="")
    location = models.CharField(max_length=120, blank=True, default="")
    website = models.URLField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    # Subscription tiers: free | silver | gold | business
    subscription_tier = models.CharField(max_length=20, default="free")
    subscription_expires_at = models.DateTimeField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    shop_url = models.URLField(blank=True, default="")

    class Meta:
        indexes = [
            models.Index(fields=["subscription_tier"]),
            models.Index(fields=["is_featured"]),
        ]

    @property
    def is_premium(self) -> bool:
        return self.subscription_tier in ("silver", "gold", "business")

    @property
    def is_ad_free(self) -> bool:
        return self.is_premium

    def __str__(self) -> str:
        return self.username


class Follow(models.Model):
    follower = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="following_relations",
    )
    following = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="follower_relations",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["follower", "following"], name="unique_follow_pair"),
            models.CheckConstraint(
                check=~models.Q(follower=models.F("following")),
                name="prevent_self_follow",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.follower_id}->{self.following_id}"


class ProfileViewEvent(models.Model):
    """Tracks profile views for premium analytics (Gold+)."""

    profile = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="profile_view_events",
    )
    viewer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="profiles_viewed",
    )
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["profile", "viewed_at"]),
        ]
