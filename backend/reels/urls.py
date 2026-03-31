from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ReelViewSet

router = DefaultRouter()
router.register(r"", ReelViewSet, basename="reel")

urlpatterns = [
    path("", include(router.urls)),
]

