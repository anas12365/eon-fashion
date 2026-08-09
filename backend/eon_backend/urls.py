from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve as serve_media

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

# Serve user-uploaded media (product images) unconditionally.
#
# IMPORTANT: django.conf.urls.static.static() looks like the standard
# way to do this, but it has its own *internal* `if not settings.DEBUG:
# return []` check baked into Django itself — wrapping it in our own
# `if settings.DEBUG` (or removing that wrapper, as a previous fix here
# tried) makes no difference, because static() silently no-ops in
# production regardless. That's why images kept 404ing even after
# "fixing" this the first time: the URL pattern was never actually
# being registered at all.
#
# The fix is to call the underlying view (django.views.static.serve)
# directly via re_path, bypassing static()'s DEBUG check entirely.
# Static assets are unaffected by any of this — those are handled
# separately by whitenoise (see STATICFILES_STORAGE in settings.py),
# which only serves STATIC_ROOT and never touches MEDIA_ROOT.
#
# django.views.static.serve isn't the fastest media server for heavy
# traffic, but it's correct and more than adequate for this project's
# scale — swap for S3/Cloud Storage + a CDN if that ever changes.
urlpatterns += [
    re_path(
        r'^media/(?P<path>.*)$',
        serve_media,
        {'document_root': settings.MEDIA_ROOT},
    ),
]
