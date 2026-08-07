from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, ProductViewSet

router = DefaultRouter(trailing_slash=True)
# 'categories' must be registered before the empty '' prefix below —
# DefaultRouter matches in registration order, and an empty-prefix
# ViewSet registered first would shadow /categories/ as if it were a
# product lookup.
router.register('categories', CategoryViewSet, basename='category')
router.register('', ProductViewSet, basename='product')

urlpatterns = router.urls
