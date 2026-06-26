from datetime import timedelta
from decimal import Decimal

# Subscription tiers (NPR / month)
SUBSCRIPTION_PLANS = {
    "free": {
        "label": "Free (Basic)",
        "price": Decimal("0.00"),
        "tier": "free",
        "features": [
            "Core social features",
            "Post outfits and reels",
            "Follow creators",
        ],
    },
    "silver": {
        "label": "Silver (Premium)",
        "price": Decimal("299.00"),
        "tier": "silver",
        "duration_days": 30,
        "features": [
            "Ad-free experience",
            "Verification badge",
            "Basic analytics",
            "Priority support",
        ],
    },
    "gold": {
        "label": "Gold (Pro)",
        "price": Decimal("599.00"),
        "tier": "gold",
        "duration_days": 30,
        "features": [
            "Everything in Silver",
            "Advanced analytics",
            "Who viewed your profile",
            "Detailed post reach",
        ],
    },
    "business": {
        "label": "Business / Brand",
        "price": Decimal("1299.00"),
        "tier": "business",
        "duration_days": 30,
        "features": [
            "Everything in Gold",
            "Shop Now button on posts",
            "Featured in suggested users",
            "Audience insights",
        ],
    },
}

# Pay-per-post boost packages (NPR)
BOOST_PACKAGES = {
    "24h": {
        "label": "24 hours",
        "price": Decimal("99.00"),
        "duration": timedelta(hours=24),
    },
    "3d": {
        "label": "3 days",
        "price": Decimal("249.00"),
        "duration": timedelta(days=3),
    },
    "1w": {
        "label": "1 week",
        "price": Decimal("499.00"),
        "duration": timedelta(days=7),
    },
}

PAID_SUBSCRIPTION_KEYS = ("silver", "gold", "business")
