from django.urls import path

from .views import (
    BoostInitiateView,
    EsewaFailureView,
    EsewaSuccessView,
    PaymentHistoryView,
    PlansListView,
    PremiumAnalyticsView,
    SubscriptionInitiateView,
    SubscriptionStatusView,
)

urlpatterns = [
    path("plans/", PlansListView.as_view(), name="payment-plans"),
    path("subscription/status/", SubscriptionStatusView.as_view(), name="subscription-status"),
    path("subscription/initiate/", SubscriptionInitiateView.as_view(), name="subscription-initiate"),
    path("boost/initiate/", BoostInitiateView.as_view(), name="boost-initiate"),
    path("history/", PaymentHistoryView.as_view(), name="payment-history"),
    path("analytics/", PremiumAnalyticsView.as_view(), name="premium-analytics"),
    path("esewa/success/", EsewaSuccessView.as_view(), name="esewa-success"),
    path("esewa/failure/", EsewaFailureView.as_view(), name="esewa-failure"),
]
