from django.conf import settings
from django.db import models
from django.db.models import Q


class Comment(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    outfit_post = models.ForeignKey(
        "outfits.OutfitPost",
        on_delete=models.CASCADE,
        related_name="comments_outfit",
        null=True,
        blank=True,
    )
    reel = models.ForeignKey(
        "reels.Reel",
        on_delete=models.CASCADE,
        related_name="comments_reel",
        null=True,
        blank=True,
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["outfit_post", "created_at"]),
            models.Index(fields=["reel", "created_at"]),
        ]
        constraints = [
            models.CheckConstraint(
                name="comment_exactly_one_target",
                check=(
                    Q(outfit_post__isnull=False, reel__isnull=True)
                    | Q(outfit_post__isnull=True, reel__isnull=False)
                ),
            ),
        ]

    def __str__(self) -> str:
        return f"Comment({self.id})"
