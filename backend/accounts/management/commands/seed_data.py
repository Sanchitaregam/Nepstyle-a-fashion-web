import random
from typing import Optional

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker

from accounts.models import Follow
from chat.models import Conversation, Message
from comments.models import Comment
from engagement.models import Like, View
from notifications.models import Notification
from notifications.services import notify_follow, notify_outfit_post, notify_reel_post
from outfits.models import OutfitPost
from recommendations.models import Tag
from reels.models import Reel

from .seed_content import (
    CHAT_SNIPPETS,
    DEMO_USERS,
    FASHION_BIOS,
    FASHION_CAPTIONS,
    FASHION_COMMENTS,
    FASHION_OUTFIT_IMAGE_URLS,
    FASHION_TAGS,
    LOCATIONS,
)
from .seed_images import (
    download_avatar,
    download_avatar_from_url,
    download_outfit_image,
    fetch_randomuser_profiles,
)

User = get_user_model()


def _make_video_file(name_prefix: str):
    """Minimal placeholder file for reel uploads in dev seed data."""
    payload = b"SEED_VIDEO_PLACEHOLDER"
    return ContentFile(payload, name=f"{name_prefix}_{uuid.uuid4().hex[:8]}.mp4")


class Command(BaseCommand):
    help = "Seed the database with realistic fashion demo data (real photos, fake engagement)."

    def add_arguments(self, parser):
        parser.add_argument("--users", type=int, default=15, help="Total users to ensure exist (includes demo users).")
        parser.add_argument("--outfits-per-user", type=int, default=3, help="Outfit posts per user.")
        parser.add_argument("--reels-per-user", type=int, default=0, help="Reels per user (0 to skip; videos stay placeholder).")
        parser.add_argument("--password", type=str, default="seedpass123", help="Password for all seeded users.")
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete existing non-superuser data before seeding.",
        )
        parser.add_argument(
            "--offline",
            action="store_true",
            help="Skip downloading photos (uses colored placeholders; no internet needed).",
        )

    def handle(self, *args, **options):
        fake = Faker()
        Faker.seed(42)
        random.seed(42)
        self.offline = options["offline"]

        if options["clear"]:
            self._clear_data()

        if not self.offline:
            self.stdout.write("Downloading real profile and outfit photos (needs internet)...")
        else:
            self.stdout.write(self.style.WARNING("Offline mode: using placeholder images only."))

        with transaction.atomic():
            tags = self._seed_tags()
            users = self._seed_users(fake, options)
            self._seed_follows(users)
            outfits = self._seed_outfits(users, tags, options)
            reels = self._seed_reels(users, options)
            self._seed_engagement(users, outfits, reels, fake)
            self._seed_comments(users, outfits, reels, fake)
            self._seed_chat(users, fake)

        self.stdout.write(self.style.SUCCESS("Seed data created successfully."))
        self.stdout.write(f"Users: {User.objects.count()}")
        self.stdout.write(f"Outfits: {OutfitPost.objects.count()}")
        self.stdout.write(f"Reels: {Reel.objects.count()}")
        self.stdout.write(f"Follows: {Follow.objects.count()}")
        self.stdout.write(f"Comments: {Comment.objects.count()}")
        self.stdout.write(f"Notifications: {Notification.objects.count()}")
        self.stdout.write(self.style.WARNING(f"Demo login password: {options['password']}"))

    def _clear_data(self):
        self.stdout.write("Clearing existing app data (keeping superusers)...")
        Message.objects.all().delete()
        Conversation.objects.all().delete()
        Notification.objects.all().delete()
        Comment.objects.all().delete()
        Like.objects.all().delete()
        View.objects.all().delete()
        Follow.objects.all().delete()
        OutfitPost.objects.all().delete()
        Reel.objects.all().delete()
        Tag.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write(self.style.WARNING("Cleared non-superuser seed-related data."))

    def _seed_tags(self):
        tags = []
        for name in FASHION_TAGS:
            tag, _ = Tag.objects.get_or_create(name=name)
            tags.append(tag)
        return tags

    def _avatar_file(self, username: str, url: Optional[str] = None) -> ContentFile:
        if self.offline:
            from .seed_images import _pillow_fallback

            return _pillow_fallback(size=(400, 400), label=f"avatar_{username}")
        if url:
            return download_avatar_from_url(url, username)
        return download_avatar(username)

    def _outfit_image_file(self, index: int) -> ContentFile:
        if self.offline:
            from .seed_images import _pillow_fallback

            return _pillow_fallback(size=(900, 1100), label=f"outfit_{index}")
        url = FASHION_OUTFIT_IMAGE_URLS[index % len(FASHION_OUTFIT_IMAGE_URLS)]
        return download_outfit_image(url, index)

    def _seed_users(self, fake, options):
        users = []
        password = options["password"]

        for demo in DEMO_USERS:
            user, created = User.objects.get_or_create(
                username=demo["username"],
                defaults={
                    "email": demo["email"],
                    "first_name": demo["first_name"],
                    "last_name": demo["last_name"],
                    "bio": random.choice(FASHION_BIOS),
                    "location": random.choice(LOCATIONS),
                    "website": fake.url() if random.random() > 0.6 else "",
                },
            )
            if created:
                user.set_password(password)
                user.save()
            user.avatar.save(
                f"avatar_{user.username}.jpg",
                self._avatar_file(user.username),
                save=True,
            )
            users.append(user)

        needed = max(0, options["users"] - len(users))
        profiles = [] if self.offline else fetch_randomuser_profiles(needed + 5)

        for profile in profiles:
            if len(users) >= options["users"]:
                break
            username = profile["username"]
            if User.objects.filter(username=username).exists():
                continue
            user = User.objects.create(
                username=username,
                email=profile["email"],
                first_name=profile["first_name"],
                last_name=profile["last_name"],
                bio=random.choice(FASHION_BIOS),
                location=random.choice(LOCATIONS),
                website=fake.url() if random.random() > 0.7 else "",
            )
            user.set_password(password)
            user.save()
            user.avatar.save(
                f"avatar_{user.username}.jpg",
                self._avatar_file(user.username, profile.get("avatar_url")),
                save=True,
            )
            users.append(user)

        while len(users) < options["users"]:
            first = fake.first_name()
            last = fake.last_name()
            base_username = f"{first}{last}".lower().replace(" ", "")[:20]
            username = f"{base_username}{random.randint(10, 99)}"
            if User.objects.filter(username=username).exists():
                continue
            user = User.objects.create(
                username=username,
                email=fake.unique.email(),
                first_name=first,
                last_name=last,
                bio=random.choice(FASHION_BIOS),
                location=random.choice(LOCATIONS),
                website=fake.url() if random.random() > 0.7 else "",
            )
            user.set_password(password)
            user.save()
            user.avatar.save(
                f"avatar_{user.username}.jpg",
                self._avatar_file(user.username),
                save=True,
            )
            users.append(user)

        return users

    def _seed_follows(self, users):
        for follower in users:
            candidates = [u for u in users if u.id != follower.id]
            follow_count = random.randint(5, min(12, len(candidates)))
            targets = random.sample(candidates, k=follow_count)
            for target in targets:
                _, created = Follow.objects.get_or_create(follower=follower, following=target)
                if created:
                    notify_follow(follower=follower, following_user=target)

    def _seed_outfits(self, users, tags, options):
        outfits = []
        per_user = options["outfits_per_user"]
        image_index = 0
        for user in users:
            for _ in range(per_user):
                outfit = OutfitPost.objects.create(
                    author=user,
                    caption=random.choice(FASHION_CAPTIONS),
                    image=self._outfit_image_file(image_index),
                )
                image_index += 1
                outfit_tags = random.sample(tags, k=random.randint(1, 3))
                outfit.tags.set(outfit_tags)
                notify_outfit_post(outfit)
                outfits.append(outfit)
                if image_index % 5 == 0 and not self.offline:
                    self.stdout.write(f"  Downloaded {image_index} outfit photos...")
        return outfits

    def _seed_reels(self, users, options):
        reels = []
        per_user = options["reels_per_user"]
        if per_user <= 0:
            return reels
        for user in users:
            for _ in range(per_user):
                reel = Reel.objects.create(
                    author=user,
                    caption=random.choice(FASHION_CAPTIONS),
                    video=_make_video_file("reel"),
                )
                notify_reel_post(reel)
                reels.append(reel)
        return reels

    def _seed_engagement(self, users, outfits, reels, fake):
        likes = []
        views = []

        for outfit in outfits:
            likers = random.sample(users, k=random.randint(5, min(14, len(users))))
            for user in likers:
                likes.append(Like(user=user, outfit_post=outfit))
            viewers = random.sample(users, k=random.randint(8, min(20, len(users))))
            for user in viewers:
                views.append(View(user=user, outfit_post=outfit))

        for reel in reels:
            likers = random.sample(users, k=random.randint(3, min(10, len(users))))
            for user in likers:
                likes.append(Like(user=user, reel=reel))
            viewers = random.sample(users, k=random.randint(5, min(15, len(users))))
            for user in viewers:
                views.append(View(user=user, reel=reel))

        Like.objects.bulk_create(likes, ignore_conflicts=True)
        View.objects.bulk_create(views, ignore_conflicts=True)

        for outfit in outfits:
            outfit.like_count = outfit.likes_outfit.count()
            outfit.view_count = outfit.views_outfit.count()
            outfit.save(update_fields=["like_count", "view_count"])

        for reel in reels:
            reel.like_count = reel.likes_reel.count()
            reel.view_count = reel.views_reel.count()
            reel.save(update_fields=["like_count", "view_count"])

    def _seed_comments(self, users, outfits, reels, fake):
        comments = []
        for outfit in outfits:
            comment_count = random.randint(2, min(8, len(users)))
            commenters = random.sample(users, k=comment_count)
            for user in commenters:
                comments.append(
                    Comment(
                        user=user,
                        outfit_post=outfit,
                        text=random.choice(FASHION_COMMENTS),
                    )
                )
        for reel in reels:
            comment_count = random.randint(1, min(6, len(users)))
            commenters = random.sample(users, k=comment_count)
            for user in commenters:
                comments.append(
                    Comment(
                        user=user,
                        reel=reel,
                        text=random.choice(FASHION_COMMENTS),
                    )
                )
        Comment.objects.bulk_create(comments)

    def _seed_chat(self, users, fake):
        if len(users) < 2:
            return
        pairs = set()
        for _ in range(min(10, len(users))):
            a, b = random.sample(users, 2)
            key = tuple(sorted((a.id, b.id)))
            if key in pairs:
                continue
            pairs.add(key)
            conv = Conversation.objects.create()
            conv.participants.add(a, b)
            msg_count = random.randint(2, 6)
            for i in range(msg_count):
                sender = a if i % 2 == 0 else b
                Message.objects.create(
                    conversation=conv,
                    sender=sender,
                    content=random.choice(CHAT_SNIPPETS),
                    read=random.random() > 0.4,
                )
