from io import BytesIO

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from PIL import Image
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.files.uploadedfile import SimpleUploadedFile

from comments.models import Comment
from engagement.models import Like, View
from outfits.models import OutfitPost


def make_test_image_bytes(color=(255, 0, 0)) -> bytes:
    img = Image.new("RGB", (64, 64), color=color)
    buf = BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf.read()


class EngagementAPITests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user1 = User.objects.create_user(username="user1", email="u1@example.com", password="pass12345")
        self.user2 = User.objects.create_user(username="user2", email="u2@example.com", password="pass12345")

        image = SimpleUploadedFile("test.jpg", make_test_image_bytes(), content_type="image/jpeg")
        self.outfit = OutfitPost.objects.create(image=image, caption="my outfit", author=self.user1)

        self.client = APIClient()

    def auth_client(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_like_toggle(self):
        self.auth_client(self.user1)

        res1 = self.client.post(f"/api/outfits/{self.outfit.id}/like/")
        self.assertEqual(res1.status_code, 200)
        self.assertTrue(res1.data["liked"])
        self.outfit.refresh_from_db()
        self.assertEqual(self.outfit.like_count, 1)
        self.assertTrue(Like.objects.filter(user=self.user1, outfit_post=self.outfit).exists())

        res2 = self.client.post(f"/api/outfits/{self.outfit.id}/like/")
        self.assertEqual(res2.status_code, 200)
        self.assertFalse(res2.data["liked"])
        self.outfit.refresh_from_db()
        self.assertEqual(self.outfit.like_count, 0)
        self.assertFalse(Like.objects.filter(user=self.user1, outfit_post=self.outfit).exists())

    def test_view_dedup_per_user(self):
        # First user views once.
        self.auth_client(self.user1)
        res1 = self.client.post(f"/api/outfits/{self.outfit.id}/view/")
        self.assertEqual(res1.status_code, 200)
        self.outfit.refresh_from_db()
        self.assertEqual(self.outfit.view_count, 1)

        # Same user views again -> should not increment.
        res2 = self.client.post(f"/api/outfits/{self.outfit.id}/view/")
        self.assertEqual(res2.status_code, 200)
        self.outfit.refresh_from_db()
        self.assertEqual(self.outfit.view_count, 1)
        self.assertEqual(View.objects.filter(user=self.user1, outfit_post=self.outfit).count(), 1)

        # Another user viewing should increment.
        self.auth_client(self.user2)
        res3 = self.client.post(f"/api/outfits/{self.outfit.id}/view/")
        self.assertEqual(res3.status_code, 200)
        self.outfit.refresh_from_db()
        self.assertEqual(self.outfit.view_count, 2)
        self.assertEqual(View.objects.filter(outfit_post=self.outfit).count(), 2)
