from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/auth/', include('users.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/customers/', include('customers.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/reports/', include('reports.urls')),
]

# Serve user-uploaded media (product images) unconditionally, not just
# when DEBUG=True. Static assets are handled separately by whitenoise
# (see STATICFILES_STORAGE in settings.py), but whitenoise only serves
# STATIC_ROOT — it does not touch MEDIA_ROOT. Gating this behind DEBUG
# meant every product image 404'd in production (DEBUG=False), even
# though the file was sitting right there on the Railway volume.
# django.views.static.serve isn't the fastest media server for heavy
# traffic, but it's correct and more than adequate for this project's
# scale — swap for S3/Cloud Storage + a CDN if that ever changes.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
