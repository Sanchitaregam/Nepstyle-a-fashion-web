from django.conf import settings
from django.db import models


class Notification(models.Model):
    TYPE_FOLLOW = "follow"
    TYPE_OUTFIT = "outfit"
    TYPE_REEL = "reel"

    TYPE_CHOICES = [
        (TYPE_FOLLOW, "Follow"),
        (TYPE_OUTFIT, "Outfit post"),
        (TYPE_REEL, "Reel post"),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="triggered_notifications",
    )
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    message = models.CharField(max_length=255)
    outfit = models.ForeignKey(
        "outfits.OutfitPost",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    reel = models.ForeignKey(
        "reels.Reel",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.recipient_id}: {self.message}"
