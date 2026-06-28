from decimal import Decimal

from django.conf import settings
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from outfits.models import OutfitPost
from payments.constants import BOOST_PACKAGES, SUBSCRIPTION_PLANS
from payments.esewa import (
    build_payment_form_data,
    decode_callback_data,
    generate_transaction_uuid,
    verify_callback_signature,
    verify_transaction_status,
)
from payments.models import Payment
from payments.serializers import (
    BoostInitiateSerializer,
    PaymentSerializer,
    SubscriptionInitiateSerializer,
)
from payments.services import complete_payment, expire_stale_boosts
from payments.analytics import build_creator_analytics


def _frontend_url(path: str) -> str:
    base = settings.FRONTEND_URL.rstrip("/")
    return f"{base}{path}"


def _create_payment(*, user, product_type: str, plan_key: str, amount: Decimal, outfit=None):
    transaction_uuid = generate_transaction_uuid()
    return Payment.objects.create(
        user=user,
        transaction_uuid=transaction_uuid,
        amount=amount,
        product_type=product_type,
        plan_key=plan_key,
        outfit=outfit,
    )


class PlansListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        subscriptions = [
            {
                "key": key,
                "label": plan["label"],
                "price": str(plan["price"]),
                "tier": plan["tier"],
                "features": plan["features"],
            }
            for key, plan in SUBSCRIPTION_PLANS.items()
        ]
        boosts = [
            {
                "key": key,
                "label": pkg["label"],
                "price": str(pkg["price"]),
            }
            for key, pkg in BOOST_PACKAGES.items()
        ]
        return Response({"subscriptions": subscriptions, "boost_packages": boosts})


class SubscriptionStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        active = bool(
            user.is_premium
            and user.subscription_expires_at
            and user.subscription_expires_at > timezone.now()
        )
        return Response(
            {
                "subscription_tier": user.subscription_tier,
                "subscription_expires_at": user.subscription_expires_at,
                "is_premium": active,
                "is_verified": user.is_verified,
                "is_featured": user.is_featured,
                "is_ad_free": active,
                "shop_url": user.shop_url,
            }
        )


class SubscriptionInitiateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = SubscriptionInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan_key = serializer.validated_data["plan"]
        plan = SUBSCRIPTION_PLANS[plan_key]
        payment = _create_payment(
            user=request.user,
            product_type=Payment.TYPE_SUBSCRIPTION,
            plan_key=plan_key,
            amount=plan["price"],
        )
        success_url = request.build_absolute_uri("/api/payments/esewa/success/")
        failure_url = request.build_absolute_uri("/api/payments/esewa/failure/")
        form_fields = build_payment_form_data(
            amount=payment.amount,
            transaction_uuid=payment.transaction_uuid,
            success_url=success_url,
            failure_url=failure_url,
        )
        return Response(
            {
                "payment": PaymentSerializer(payment).data,
                "action_url": settings.ESEWA_PAYMENT_URL,
                "form_fields": form_fields,
            },
            status=status.HTTP_201_CREATED,
        )


class BoostInitiateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = BoostInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        outfit = get_object_or_404(OutfitPost, pk=serializer.validated_data["outfit_id"])
        if outfit.author_id != request.user.id:
            return Response(
                {"detail": "You can only boost your own posts."},
                status=status.HTTP_403_FORBIDDEN,
            )
        duration_key = serializer.validated_data["duration"]
        package = BOOST_PACKAGES[duration_key]
        payment = _create_payment(
            user=request.user,
            product_type=Payment.TYPE_BOOST,
            plan_key=duration_key,
            amount=package["price"],
            outfit=outfit,
        )
        success_url = request.build_absolute_uri("/api/payments/esewa/success/")
        failure_url = request.build_absolute_uri("/api/payments/esewa/failure/")
        form_fields = build_payment_form_data(
            amount=payment.amount,
            transaction_uuid=payment.transaction_uuid,
            success_url=success_url,
            failure_url=failure_url,
        )
        return Response(
            {
                "payment": PaymentSerializer(payment).data,
                "action_url": settings.ESEWA_PAYMENT_URL,
                "form_fields": form_fields,
            },
            status=status.HTTP_201_CREATED,
        )


class PaymentHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        payments = Payment.objects.filter(user=request.user)[:20]
        return Response(PaymentSerializer(payments, many=True).data)


class PremiumAnalyticsView(APIView):
    """Premium subscribers get creator analytics dashboard data."""

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        if user.subscription_tier not in ("silver", "gold", "business"):
            return Response(
                {"detail": "Upgrade to a premium plan to access analytics."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(build_creator_analytics(user, request))


class EsewaSuccessView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        encoded = request.query_params.get("data", "")
        if not encoded:
            return HttpResponseRedirect(_frontend_url("/payment/failure?reason=missing_data"))

        try:
            payload = decode_callback_data(encoded)
        except Exception:
            return HttpResponseRedirect(_frontend_url("/payment/failure?reason=invalid_data"))

        if not verify_callback_signature(payload):
            return HttpResponseRedirect(_frontend_url("/payment/failure?reason=invalid_signature"))

        transaction_uuid = payload.get("transaction_uuid", "")
        payment = Payment.objects.filter(transaction_uuid=transaction_uuid).first()
        if not payment:
            return HttpResponseRedirect(_frontend_url("/payment/failure?reason=unknown_payment"))

        total_amount = payload.get("total_amount", f"{payment.amount:.2f}")
        try:
            status_data = verify_transaction_status(
                transaction_uuid=transaction_uuid,
                total_amount=total_amount,
            )
            if status_data.get("status") != "COMPLETE":
                payment.status = Payment.STATUS_FAILED
                payment.save(update_fields=["status"])
                return HttpResponseRedirect(_frontend_url("/payment/failure?reason=not_complete"))
        except Exception:
            if payload.get("status") != "COMPLETE":
                payment.status = Payment.STATUS_FAILED
                payment.save(update_fields=["status"])
                return HttpResponseRedirect(_frontend_url("/payment/failure?reason=verification_failed"))

        complete_payment(payment, esewa_ref=payload.get("transaction_code", ""))
        return HttpResponseRedirect(
            _frontend_url(f"/payment/success?type={payment.product_type}&plan={payment.plan_key}")
        )


class EsewaFailureView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        transaction_uuid = request.query_params.get("transaction_uuid", "")
        if transaction_uuid:
            Payment.objects.filter(
                transaction_uuid=transaction_uuid, status=Payment.STATUS_PENDING
            ).update(status=Payment.STATUS_FAILED)
        return HttpResponseRedirect(_frontend_url("/payment/failure"))
