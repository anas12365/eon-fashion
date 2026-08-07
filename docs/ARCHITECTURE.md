# EON Architecture

## Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Admin UI

## Backend
- Django
- Django REST Framework
- Simple JWT

## Flow

```
Customer/Admin UI
        |
        v
React Services Layer
        |
        v
Django REST API
        |
        v
Database
```

## Authentication

Admin Login
-> Django JWT
-> Protected API Routes

## Inventory Architecture

```
Product
 |
 stock field
 |
 Inventory System
 |
 Inventory API
 |
 Admin Inventory UI
```

Confirmed:
- No duplicate stock source exists. `InventoryHistory` only logs changes;
  it does not hold its own stock value.
- `Product.stock` remains the source of truth. The Inventory app
  (`inventory/`) reads and writes `stock` and `low_stock_threshold`
  directly on `Product` via `InventoryViewSet`.

## Product Image Storage (Phase 6.2)

```
ProductForm.jsx
        |
        v
imageProcessing.js  (client-side resize + WebP encode — unchanged)
        |
        v
djangoStorage.js  ->  POST /api/products/<id>/images/  (Django JWT admin-only)
        |
        v
MEDIA_ROOT/products/<id>/large|thumb/<file>.webp
        |
        v
Product.images JSONField  [{large: "<absolute url>", thumb: "<absolute url>"}, ...]
        |
        v
src/lib/images.js  ->  storefront / admin rendering (host-agnostic)
```

- Django now owns product image **files**; it always owned the `images` JSON field itself
  (`ProductSerializer` field, unchanged). Only where the file bytes live changed.
- `src/lib/images.js`'s URL resolvers (`getImageUrl`/`getThumbUrl`/`getLargeUrl`) don't
  distinguish a Django media URL from a Firebase Storage URL — both are just strings — so
  products created before this migration (Firebase-hosted) and after (Django-hosted) render
  identically everywhere with no per-product flag or special-casing.
- Firebase Storage remains reachable via the original `src/lib/storage.js`, untouched — this is
  additive, not a removal. See `MIGRATION.md` for the full before/after and known limitations.
- Delete (`DELETE /api/products/<id>/images/`) only ever removes files under that product's own
  `MEDIA_ROOT/products/<id>/` path; it does not and cannot reach into Firebase Storage.

## Firebase
Used only for fallback and compatibility.

## Order Status Lifecycle

```
Pending -> Confirmed -> Preparing -> Shipped -> Delivered
   |           |            |
   v           v            v
Cancelled  Cancelled    Cancelled
```

Single source of truth: `Order.ALLOWED_TRANSITIONS` in `orders/models.py`.
Enforced by `PATCH /api/orders/<id>/status/` and `POST /api/orders/<id>/cancel/`;
exposed to the frontend as `available_transitions` on each order so the
admin Orders page only ever offers a valid next status.

Known gap: the Django admin's `list_editable` status field does not go
through this validation. Not addressed yet — out of scope for the React
admin dashboard work this covered.

## Customers Architecture

```
Order (customer_name, phone, address)
        |
        v
GROUP BY phone  (customers/views.py — no model)
        |
        v
Customers API  ->  Admin Customers UI
```

There is no Customer / user-account model. A "customer" is every distinct
phone number seen across `Order`, aggregated on read. This is a deliberate
choice: adding a stored Customer model would create a second place that
holds the same identity Order already carries, with no way to guarantee
it stays in sync. If real customer accounts are ever introduced, this is
the layer that gets replaced.

## Analytics Architecture

```
Order + OrderItem + Product
        |
        v
Aggregation only (analytics/views.py — no model, no stored metrics)
        |
        v
Analytics API  ->  Admin Dashboard widgets
```

Same principle as Customers: nothing here is stored, so nothing here can
drift from the real Order/Product data.

## Security & Production Hardening (Phase 6.1)

```
Environment (.env)
        |
        v
Django settings.py  -- fail-closed defaults, HTTPS/cookie hardening
        |
        v
DEFAULT_THROTTLE_RATES['admin-login']  -> AdminLoginThrottle (users/throttles.py)
        |                                  attached ONLY to AdminLoginView
        v
Every other endpoint: unthrottled, unchanged
```

- `DEBUG` defaults to `False`; `SECRET_KEY` has no insecure fallback and raises
  `ImproperlyConfigured` at startup if unset. Both are still fully env-driven — local dev sets
  them via `.env` (see `backend/.env.example`, `backend/README.md`).
- `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `SECURE_HSTS_*`, and
  `SECURE_PROXY_SSL_HEADER` are all environment-controlled and default to their permissive
  (HTTP-friendly) state — they must be explicitly turned on once the app is deployed behind
  real HTTPS.
- Rate limiting is scoped to a single endpoint on purpose: `AdminLoginThrottle` only applies to
  `POST /api/auth/login/`. `REST_FRAMEWORK` has no `DEFAULT_THROTTLE_CLASSES`, so this cannot
  accidentally throttle Products/Orders/Inventory/Customers/Analytics/Reports or any other view.
- A root `.gitignore` now exists (previously absent) covering `.env`, caches, and build output.
- Frontend: a single `ErrorBoundary` wraps `<App />` in `main.jsx`. It does not participate in
  routing or business logic — it only catches what would otherwise be an uncaught render crash.
- Known gap carried forward from the Phase 6.1 audit (not addressed here — deployment/infra,
  not application code): DB connection pooling (`CONN_MAX_AGE`), a static/media serving story
  for `DEBUG=False` (nginx/whitenoise/S3), and external log aggregation are still open.

## Release Readiness (Phase 6.3)

Deployment steps (required env vars, `migrate` including the `token_blacklist` tables,
`collectstatic`, frontend build, and a pre-go-live checklist) are documented in
`docs/RELEASE_CHECKLIST.md` rather than duplicated here. `SIMPLE_JWT` now blacklists a refresh
token the moment it's rotated (`BLACKLIST_AFTER_ROTATION`) — see the Admin JWT Auth section
above and `MIGRATION.md`/`CHANGELOG.md` for why this closes a real gap in `ROTATE_REFRESH_TOKENS`
on its own.
