from rest_framework.routers import DefaultRouter

from .views import InventoryViewSet

router = DefaultRouter(trailing_slash=True)
router.register('', InventoryViewSet, basename='inventory')

urlpatterns = router.urls
