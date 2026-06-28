from django.conf import settings
from django.db import models


class OutfitPost(models.Model):
    image = models.ImageField(upload_to="outfits/")
    caption = models.TextField(blank=True, default="")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="outfit_posts",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    # Denormalized counters for fast feed ranking.
    view_count = models.PositiveIntegerField(default=0)
    like_count = models.PositiveIntegerField(default=0)

    tags = models.ManyToManyField(
        "recommendations.Tag",
        related_name="outfit_posts",
        blank=True,
    )

    is_boosted = models.BooleanField(default=False)
    boost_expires_at = models.DateTimeField(null=True, blank=True)
    shop_url = models.URLField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["author", "created_at"]),
            models.Index(fields=["is_boosted", "boost_expires_at"]),
        ]

    @property
    def boost_active(self) -> bool:
        if not self.is_boosted or not self.boost_expires_at:
            return False
        from django.utils import timezone

        return self.boost_expires_at > timezone.now()

    def __str__(self) -> str:
        return f"OutfitPost({self.id}) by {self.author}"
