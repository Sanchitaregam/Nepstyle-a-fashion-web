"""Download real photos for seed data (requires internet)."""

import json
import random
import uuid
from io import BytesIO
from urllib.error import URLError
from urllib.request import Request, urlopen

from django.core.files.base import ContentFile
from PIL import Image

USER_AGENT = "NepStyleSeed/1.0 (Django management command)"


def _fetch_bytes(url: str, timeout: int = 25) -> bytes:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=timeout) as response:
        return response.read()


def _pillow_fallback(size=(900, 1100), label: str = "seed") -> ContentFile:
    hue = random.randint(0, 255)
    color = (hue, (hue + 80) % 256, (hue + 140) % 256)
    img = Image.new("RGB", size, color)
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return ContentFile(buf.getvalue(), name=f"{label}_{uuid.uuid4().hex[:8]}.jpg")


def download_avatar(username: str) -> ContentFile:
    """Real portrait from pravatar (deterministic per username)."""
    url = f"https://i.pravatar.cc/400?u={username}"
    try:
        data = _fetch_bytes(url)
        return ContentFile(data, name=f"avatar_{username}.jpg")
    except (URLError, TimeoutError, OSError):
        return _pillow_fallback(size=(400, 400), label=f"avatar_{username}")


def download_outfit_image(url: str, index: int) -> ContentFile:
    """Download a fashion/outfit photo from a direct image URL."""
    try:
        data = _fetch_bytes(url)
        return ContentFile(data, name=f"outfit_{index}_{uuid.uuid4().hex[:6]}.jpg")
    except (URLError, TimeoutError, OSError):
        return _pillow_fallback(size=(900, 1100), label=f"outfit_{index}")


def fetch_randomuser_profiles(count: int) -> list[dict]:
    """
    Fetch real profile photos + names from randomuser.me.
    Returns list of dicts: username, email, first_name, last_name, avatar_url.
    """
    if count <= 0:
        return []
    url = (
        "https://randomuser.me/api/"
        f"?results={count}&inc=name,email,login,picture&noinfo"
    )
    try:
        payload = json.loads(_fetch_bytes(url).decode("utf-8"))
    except (URLError, TimeoutError, OSError, json.JSONDecodeError):
        return []

    profiles = []
    for item in payload.get("results", []):
        name = item.get("name", {})
        login = item.get("login", {})
        picture = item.get("picture", {})
        username = login.get("username") or f"user{uuid.uuid4().hex[:6]}"
        profiles.append(
            {
                "username": username[:30],
                "email": item.get("email") or f"{username}@nepstyle.demo",
                "first_name": name.get("first", "User"),
                "last_name": name.get("last", ""),
                "avatar_url": picture.get("large") or picture.get("medium"),
            }
        )
    return profiles


def download_avatar_from_url(url: str, username: str) -> ContentFile:
    try:
        data = _fetch_bytes(url)
        return ContentFile(data, name=f"avatar_{username}.jpg")
    except (URLError, TimeoutError, OSError):
        return download_avatar(username)
