from django.conf import settings
from django.db import models


class Payment(models.Model):
    STATUS_PENDING = "pending"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"

    TYPE_SUBSCRIPTION = "subscription"
    TYPE_BOOST = "boost"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payments",
    )
    transaction_uuid = models.CharField(max_length=64, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    product_type = models.CharField(max_length=20)
    plan_key = models.CharField(max_length=20)
    outfit = models.ForeignKey(
        "outfits.OutfitPost",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="boost_payments",
    )
    status = models.CharField(max_length=20, default=STATUS_PENDING)
    esewa_ref = models.CharField(max_length=120, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.transaction_uuid} ({self.product_type}/{self.plan_key})"
