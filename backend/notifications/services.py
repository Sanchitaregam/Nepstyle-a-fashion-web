from accounts.models import Follow
from .models import Notification


def notify_follow(*, follower, following_user):
    """Notify a user when someone starts following them."""
    Notification.objects.create(
        recipient=following_user,
        actor=follower,
        notification_type=Notification.TYPE_FOLLOW,
        message=f"{follower.username} started following you",
    )


def notify_outfit_post(outfit):
    """Notify followers when a user posts a new outfit."""
    follower_ids = Follow.objects.filter(following=outfit.author).values_list(
        "follower_id", flat=True
    )
    if not follower_ids:
        return

    Notification.objects.bulk_create(
        [
            Notification(
                recipient_id=follower_id,
                actor=outfit.author,
                notification_type=Notification.TYPE_OUTFIT,
                outfit=outfit,
                message=f"{outfit.author.username} posted",
            )
            for follower_id in follower_ids
        ]
    )


def notify_reel_post(reel):
    """Notify followers when a user posts a new reel."""
    follower_ids = Follow.objects.filter(following=reel.author).values_list(
        "follower_id", flat=True
    )
    if not follower_ids:
        return

    Notification.objects.bulk_create(
        [
            Notification(
                recipient_id=follower_id,
                actor=reel.author,
                notification_type=Notification.TYPE_REEL,
                reel=reel,
                message=f"{reel.author.username} posted a video",
            )
            for follower_id in follower_ids
        ]
    )
