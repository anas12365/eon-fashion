"""
Phase 6.1 — Admin login rate limiting.

A single, narrowly-scoped throttle used only by AdminLoginView. Every
other endpoint in the project (products, orders, inventory, customers,
analytics, reports, token refresh, /me/) is intentionally left
unthrottled — REST_FRAMEWORK has no DEFAULT_THROTTLE_CLASSES, so nothing
except this one view is affected.
"""
from rest_framework.throttling import ScopedRateThrottle


class AdminLoginThrottle(ScopedRateThrottle):
    """Rate-limits POST /api/auth/login/ by client IP (unauthenticated,
    so there's no user to key on yet). Rate is configured via
    REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']['admin-login'] in
    settings.py (env-overridable through ADMIN_LOGIN_THROTTLE_RATE),
    default 5/min — enough for a real admin to retry a typo, not enough
    for a meaningful password-guessing run."""

    scope = 'admin-login'
