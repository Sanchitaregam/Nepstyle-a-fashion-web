import base64
import hashlib
import hmac
import json
import uuid
from decimal import Decimal
from urllib.parse import urlencode

import requests
from django.conf import settings


def generate_transaction_uuid() -> str:
    return f"FW-{uuid.uuid4().hex[:20]}"


def sign_payload(total_amount: str, transaction_uuid: str, product_code: str) -> str:
    message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
    secret = settings.ESEWA_SECRET_KEY.encode("utf-8")
    digest = hmac.new(secret, message.encode("utf-8"), hashlib.sha256).digest()
    return base64.b64encode(digest).decode("utf-8")


def build_payment_form_data(
    *,
    amount: Decimal,
    transaction_uuid: str,
    success_url: str,
    failure_url: str,
) -> dict:
    total_amount = f"{amount:.2f}"
    product_code = settings.ESEWA_MERCHANT_CODE
    signature = sign_payload(total_amount, transaction_uuid, product_code)
    return {
        "amount": total_amount,
        "tax_amount": "0",
        "total_amount": total_amount,
        "transaction_uuid": transaction_uuid,
        "product_code": product_code,
        "product_service_charge": "0",
        "product_delivery_charge": "0",
        "success_url": success_url,
        "failure_url": failure_url,
        "signed_field_names": "total_amount,transaction_uuid,product_code",
        "signature": signature,
    }


def verify_callback_signature(data: dict) -> bool:
    signed_fields = data.get("signed_field_names", "")
    if not signed_fields:
        return False
    parts = []
    for field in signed_fields.split(","):
        field = field.strip()
        if field:
            parts.append(f"{field}={data.get(field, '')}")
    message = ",".join(parts)
    secret = settings.ESEWA_SECRET_KEY.encode("utf-8")
    expected = base64.b64encode(
        hmac.new(secret, message.encode("utf-8"), hashlib.sha256).digest()
    ).decode("utf-8")
    return hmac.compare_digest(expected, data.get("signature", ""))


def decode_callback_data(encoded: str) -> dict:
    padded = encoded + "=" * (-len(encoded) % 4)
    raw = base64.b64decode(padded)
    return json.loads(raw.decode("utf-8"))


def verify_transaction_status(*, transaction_uuid: str, total_amount: str) -> dict:
    params = {
        "product_code": settings.ESEWA_MERCHANT_CODE,
        "total_amount": total_amount,
        "transaction_uuid": transaction_uuid,
    }
    url = f"{settings.ESEWA_STATUS_URL}?{urlencode(params)}"
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    return response.json()
