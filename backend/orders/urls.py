from rest_framework.routers import DefaultRouter

from .views import OrderViewSet

router = DefaultRouter(trailing_slash=True)
router.register('', OrderViewSet, basename='order')

urlpatterns = router.urls
