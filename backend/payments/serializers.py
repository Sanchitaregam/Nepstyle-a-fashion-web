from rest_framework import serializers

from payments.constants import BOOST_PACKAGES, SUBSCRIPTION_PLANS
from payments.models import Payment


class SubscriptionInitiateSerializer(serializers.Serializer):
    plan = serializers.ChoiceField(choices=["silver", "gold", "business"])


class BoostInitiateSerializer(serializers.Serializer):
    outfit_id = serializers.IntegerField()
    duration = serializers.ChoiceField(choices=list(BOOST_PACKAGES.keys()))


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "transaction_uuid",
            "amount",
            "product_type",
            "plan_key",
            "status",
            "created_at",
            "completed_at",
        ]
        read_only_fields = fields
