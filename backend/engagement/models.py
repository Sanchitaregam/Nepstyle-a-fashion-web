from django.conf import settings
from django.db import models
from django.db.models import Q


class Like(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="likes",
    )
    outfit_post = models.ForeignKey(
        "outfits.OutfitPost",
        on_delete=models.CASCADE,
        related_name="likes_outfit",
        null=True,
        blank=True,
    )
    reel = models.ForeignKey(
        "reels.Reel",
        on_delete=models.CASCADE,
        related_name="likes_reel",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            # Enforce exactly one target.
            models.CheckConstraint(
                name="like_exactly_one_target",
                check=(
                    Q(outfit_post__isnull=False, reel__isnull=True)
                    | Q(outfit_post__isnull=True, reel__isnull=False)
                ),
            ),
            models.UniqueConstraint(
                fields=["user", "outfit_post"],
                condition=Q(outfit_post__isnull=False),
                name="uniq_user_outfit_like",
            ),
            models.UniqueConstraint(
                fields=["user", "reel"],
                condition=Q(reel__isnull=False),
                name="uniq_user_reel_like",
            ),
        ]

    def __str__(self) -> str:
        target = self.outfit_post_id or self.reel_id
        return f"Like({self.user_id} -> {target})"


class View(models.Model):
    """
    View tracking with optional dedupe for authenticated users.
    For anonymous users, the API can skip view creation (or allow multiple views).
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="views",
        null=True,
        blank=True,
    )
    outfit_post = models.ForeignKey(
        "outfits.OutfitPost",
        on_delete=models.CASCADE,
        related_name="views_outfit",
        null=True,
        blank=True,
    )
    reel = models.ForeignKey(
        "reels.Reel",
        on_delete=models.CASCADE,
        related_name="views_reel",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                name="view_exactly_one_target",
                check=(
                    Q(outfit_post__isnull=False, reel__isnull=True)
                    | Q(outfit_post__isnull=True, reel__isnull=False)
                ),
            ),
            models.UniqueConstraint(
                fields=["user", "outfit_post"],
                condition=Q(user__isnull=False, outfit_post__isnull=False),
                name="uniq_user_outfit_view",
            ),
            models.UniqueConstraint(
                fields=["user", "reel"],
                condition=Q(user__isnull=False, reel__isnull=False),
                name="uniq_user_reel_view",
            ),
        ]

    def __str__(self) -> str:
        target = self.outfit_post_id or self.reel_id
        return f"View({self.user_id} -> {target})"
