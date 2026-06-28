from datetime import timedelta

from django.utils import timezone

from accounts.models import User
from outfits.models import OutfitPost
from payments.constants import BOOST_PACKAGES, SUBSCRIPTION_PLANS
from payments.models import Payment


def activate_subscription(user: User, plan_key: str) -> None:
    plan = SUBSCRIPTION_PLANS[plan_key]
    user.subscription_tier = plan["tier"]
    user.subscription_expires_at = timezone.now() + timedelta(days=plan["duration_days"])
    user.is_verified = plan["tier"] in ("silver", "gold", "business")
    user.is_featured = plan["tier"] == "business"
    user.save(
        update_fields=[
            "subscription_tier",
            "subscription_expires_at",
            "is_verified",
            "is_featured",
        ]
    )


def activate_boost(outfit: OutfitPost, duration_key: str) -> None:
    package = BOOST_PACKAGES[duration_key]
    now = timezone.now()
    base = outfit.boost_expires_at if outfit.boost_active else now
    outfit.is_boosted = True
    outfit.boost_expires_at = base + package["duration"]
    outfit.save(update_fields=["is_boosted", "boost_expires_at"])


def complete_payment(payment: Payment, esewa_ref: str = "") -> None:
    if payment.status == Payment.STATUS_COMPLETED:
        return
    payment.status = Payment.STATUS_COMPLETED
    payment.esewa_ref = esewa_ref
    payment.completed_at = timezone.now()
    payment.save(update_fields=["status", "esewa_ref", "completed_at"])

    if payment.product_type == Payment.TYPE_SUBSCRIPTION:
        activate_subscription(payment.user, payment.plan_key)
    elif payment.product_type == Payment.TYPE_BOOST and payment.outfit_id:
        activate_boost(payment.outfit, payment.plan_key)


def expire_stale_boosts() -> int:
    now = timezone.now()
    return OutfitPost.objects.filter(
        is_boosted=True, boost_expires_at__lte=now
    ).update(is_boosted=False)
