from django.conf import settings
from django.db import models


class Reel(models.Model):
    video = models.FileField(upload_to="reels/")
    caption = models.TextField(blank=True, default="")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reels",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    # Denormalized counters for fast feed ranking.
    view_count = models.PositiveIntegerField(default=0)
    like_count = models.PositiveIntegerField(default=0)

    tags = models.ManyToManyField(
        "recommendations.Tag",
        related_name="reel_posts",
        blank=True,
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["author", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"Reel({self.id}) by {self.author}"
