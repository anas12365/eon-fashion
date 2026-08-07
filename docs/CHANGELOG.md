# EON Changelog

## Phase 6.3 - Production Fixes & Release Readiness
Fixed:
- Inventory serializer crash on legacy image format
- Reports endpoint crash on negative `limit` query parameter
- SimpleJWT refresh-token rotation without blacklisting (security gap)

Added:
- Root `.env.example` (frontend `VITE_*` variables)
- `docs/RELEASE_CHECKLIST.md`

Details:
- `backend/inventory/serializers.py`: `InventoryProductSerializer.get_image()` called
  `obj.images[0].get('thumb')` unconditionally, which raised `AttributeError` for any product
  still carrying a legacy plain-string image URL (pre-Phase-6.2 Firebase products). Now checks
  the shape first, matching the same two-shape handling already used in
  `orders/serializers.py`'s `_first_thumb()`. `Product.images` itself is unchanged — same
  JSONField, same two shapes it always allowed; no model or contract change.
- `backend/reports/views.py`: `ProductPerformanceReportView` parsed `?limit=-5` as a valid int
  (`-5`) and then sliced `qs[:-5]` — Django `QuerySet` slicing rejects negative indices with an
  uncaught `AssertionError` (500). A parsed limit `<= 0` now falls back to the existing default
  of 50, the same as an unparseable value.
- `backend/eon_backend/settings.py`: added `rest_framework_simplejwt.token_blacklist` to
  `INSTALLED_APPS` and `BLACKLIST_AFTER_ROTATION: True` to `SIMPLE_JWT`. Previously,
  `ROTATE_REFRESH_TOKENS: True` alone meant a rotated-away refresh token stayed fully usable
  until its own 7-day expiry — rotation wasn't actually revoking anything. The blacklist app
  ships its own bundled migrations (nothing added to this repo's migrations); requires
  `python manage.py migrate` before deploy (see `docs/RELEASE_CHECKLIST.md`). Non-breaking:
  every currently-outstanding refresh token keeps working; only a token gets blacklisted once
  it's actually rotated.
- Release verification pass (Phase 6.4, see `PROJECT_STATUS.md`) found one real gap: no root
  `.env.example` existed despite `FIREBASE_SETUP.md` instructing `cp .env.example .env`. Added
  `/.env.example` with exactly the 8 `VITE_*` variables `src/` actually reads
  (`VITE_API_BASE_URL`, `VITE_USE_DJANGO`, and the six `VITE_FIREBASE_*` vars). Added
  `DATA_UPLOAD_MAX_MEMORY_SIZE` / `FILE_UPLOAD_MAX_MEMORY_SIZE` documentation to
  `backend/.env.example` (both already had safe code defaults — non-blocking gap, now closed).
- `docs/RELEASE_CHECKLIST.md` added: required env vars, `migrate` (incl. `token_blacklist`
  table confirmation), `collectstatic`, frontend build, and a production deployment checklist.
- No changes to any model, serializer field, API contract, authentication flow, or
  Products/Orders/Inventory/Customers/Analytics/Reports business logic. Firestore fallback
  (`VITE_USE_DJANGO`) untouched.

## Phase 6.2 - Django Media Product Image Uploads
Added:
- Django-owned product image uploads, replacing Firebase Storage as the write path
- Admin JWT–protected image upload/delete endpoints

Details:
- `backend/products/views.py`: new `images` action on `ProductViewSet` —
  `POST /api/products/<id>/images/` (multipart `large`+`thumb` files, admin-only via the
  existing `IsAdminOrReadOnly`) saves to `MEDIA_ROOT/products/<id>/large|thumb/` and returns
  absolute URLs via `request.build_absolute_uri()`; `DELETE /api/products/<id>/images/` is a
  best-effort, non-fatal delete scoped to files under that product's own media path only.
- `backend/eon_backend/settings.py`: `DATA_UPLOAD_MAX_MEMORY_SIZE` / `FILE_UPLOAD_MAX_MEMORY_SIZE`
  added (both env-overridable, default 10MB) — Django's unconfigured 2.5MB default sat below the
  frontend's existing 5MB per-original-file cap.
- `src/lib/djangoStorage.js` (new): adapter with the same exported signatures as
  `src/lib/storage.js` (`uploadProductImageSets`, `deleteProductImageSet`, `validateImageFile`),
  so `src/admin/ProductForm.jsx` needed only a one-line import change — no component logic
  touched. Client-side resize/WebP-encode (`imageProcessing.js`) is unchanged.
- `src/services/api.js`: added `authFetch()` (new export only) — reuses the existing JWT/401
  refresh logic for multipart bodies, which the JSON-only `request()` couldn't carry.
- `Product.images` JSON shape (`{large, thumb}`) is unchanged; no model or migration added.
  `ProductSerializer`/`ProductViewSet` list/retrieve/create/update/delete behavior is unchanged.
- Existing Firebase Storage image URLs continue to render everywhere unmodified; Firebase Storage
  itself, `src/lib/storage.js`, `firebase.js`, and `storage.rules` are untouched and still
  functional. Firestore fallback for product/order *data* (`VITE_USE_DJANGO`) is unaffected —
  this change only concerns where image *files* are uploaded.
- No changes to Orders, Inventory (business logic), Customers, Analytics, Reports, or
  Authentication. See `MIGRATION.md` for the full before/after and known limitations
  (legacy Firebase files are not deleted by the new endpoint — manual cleanup is a future task).

## Phase 6.1 - Production Security Hardening
Added:
- Fail-closed Django `DEBUG`/`SECRET_KEY` defaults
- Environment-controlled HTTPS/cookie hardening settings
- Rate limiting on admin login only
- Root `.gitignore`
- Frontend `ErrorBoundary`
- Minimal Django logging configuration

Details:
- `backend/eon_backend/settings.py`:
  - `DEBUG` now defaults to `False` (was `True`) — a deployment that forgets to set
    `DJANGO_DEBUG` no longer serves debug error pages by accident.
  - `SECRET_KEY`'s insecure `'dev-insecure-change-me'` fallback removed; the app now raises
    `ImproperlyConfigured` at startup if `DJANGO_SECRET_KEY` is unset/blank. Every documented
    setup path already does `cp .env.example .env` first, so local dev is unaffected.
  - Added `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`,
    `SECURE_HSTS_SECONDS` (+ `SECURE_HSTS_INCLUDE_SUBDOMAINS`, `SECURE_HSTS_PRELOAD`), and an
    opt-in `SECURE_PROXY_SSL_HEADER` — all environment-controlled, all default to the permissive
    HTTP-friendly state so local dev over plain HTTP is unaffected.
  - Added a minimal `LOGGING` config: console handler, env-controlled level
    (`DJANGO_LOG_LEVEL`), a dedicated `eon` logger namespace, `django.request` pinned to `ERROR`.
- `backend/users/throttles.py` (new): `AdminLoginThrottle`, a `ScopedRateThrottle` on the
  `admin-login` scope, rate configurable via `ADMIN_LOGIN_THROTTLE_RATE` (default `5/min`).
- `backend/users/views.py`: attached `AdminLoginThrottle` to `AdminLoginView` only — no other
  view anywhere in the project was touched; `REST_FRAMEWORK` has no `DEFAULT_THROTTLE_CLASSES`.
- `backend/.env.example`: documented all new variables with local-dev-safe defaults.
- `.gitignore` (new, repo root): `.env`, `.env.*` (except `.env.example`), `__pycache__/`,
  `*.pyc`, `node_modules/`, `dist/`, `media/`, `staticfiles/`, `db.sqlite3`, plus editor/OS junk.
- `src/components/ErrorBoundary.jsx` (new): class-based React error boundary with a plain
  fallback UI and a reload button.
- `src/main.jsx`: wraps `<App />` in `<ErrorBoundary>`. No routing or page logic changed.
- Verified (static analysis + a stubbed-module simulation of `settings.py`'s control flow, since
  this sandbox has no network access to install Django): missing `SECRET_KEY` raises as expected;
  `DEBUG`/HTTPS settings default correctly and respond to env overrides; throttle scope is
  isolated to `admin-login` only; `LOGGING` level follows `DEBUG`.
- No changes to any model, API contract, authentication flow, or business logic in
  Products, Orders, Inventory, Order Workflow, Customers, Analytics, or Reports.

## Phase 5.5 - Reports
Added:
- Admin Reports system: Sales, Orders, Inventory, and Product Performance reports
- Date filtering and CSV export on the admin Reports page

Details:
- New `reports` Django app, no model/migration (pure aggregation over Order/OrderItem/Product,
  same pattern as `analytics`/`customers`): `GET /api/reports/sales/`, `GET /api/reports/orders/`,
  `GET /api/reports/inventory/`, `GET /api/reports/products/` — all admin-only (`IsAdminUser`)
- Sales report: total revenue (excludes Cancelled, matching the existing Analytics convention),
  order count, average order value, per-day revenue trend; supports `?date_from=&date_to=`
- Orders report: total orders, status breakdown, completed (Delivered) / cancelled counts;
  supports `?date_from=&date_to=`
- Inventory report: total products, total stock units, inventory value (price × stock), low-stock
  and out-of-stock counts, low-stock product list — point-in-time, no date filter
- Product Performance report: best sellers by quantity sold with revenue per product, cancelled
  orders excluded; supports `?date_from=&date_to=&limit=`
- Admin Reports page (`/admin/reports`), routed inside the existing `ProtectedRoute`: tabbed
  Sales / Orders / Inventory / Product Performance views, summary cards, tables, date-range
  filters, and per-tab CSV export (client-side `Blob`, no new dependency — same "kept to the
  existing stack" choice as the Analytics dashboard's custom CSS bars)
- `AdminLayout` nav link
- No changes to Products/Orders/Inventory/Customers/Analytics APIs, models, or UI; no new
  migrations (verified: no model added, mirrors the model-less `analytics`/`customers` apps)

## Phase 5.4 - Analytics Dashboard
Added:
- Analytics endpoint (revenue, orders count, customers count, products count, best sellers, orders status statistics)
- Dashboard widgets and charts

Details:
- New `analytics` Django app, no model/migration (pure aggregation over Order/OrderItem/Product):
  `GET /api/analytics/summary/`, admin-only (`IsAdminUser`)
- Dashboard: revenue/customers/products/orders stat cards, orders-by-status bar breakdown, best
  sellers list — custom CSS bars, no new charting dependency added (kept to the existing stack)
- Existing Firebase-backed stat cards (Products/Orders/Pending/Unread) unchanged and still work
  on both backends; the new analytics section only renders on the Django path

## Phase 5.3 - Customers Management
Added:
- Admin Customers section (list, details, order history, total spending)

Details:
- No customer-account model exists in this project (see users/models.py) — Order only stores
  free-text customer_name/phone/address. Customers are aggregated live from Order grouped by
  phone number rather than adding a new model that would duplicate that identity.
- New `customers` Django app, no model/migration: `GET /api/customers/` (search, ordering,
  paginated), `GET /api/customers/<phone>/` (aggregate + order history), admin-only
- Admin Customers page (`/admin/customers`), routed inside the existing `ProtectedRoute`
- `AdminLayout` nav link

## Phase 5.2 - Order Workflow
Added:
- Order status lifecycle with transition validation
- Status change / filter / search APIs
- Admin Orders page: status column, filters, search, order details, status action buttons

Details:
- Filtering and search already existed on `GET /api/orders/`; the actual gap was that
  `PATCH /api/orders/<id>/status/` allowed any status to jump to any other status
- Added `Order.ALLOWED_TRANSITIONS` state machine (orders/models.py): Pending → Confirmed →
  Preparing → Shipped → Delivered, with Cancelled reachable only before Shipped; Delivered and
  Cancelled are terminal
- `OrderStatusSerializer.validate_status` enforces it (400 with the allowed next status(es) on
  an invalid move); `OrderSerializer.available_transitions` exposes it for the frontend
- Bug fix: `POST /api/orders/<id>/cancel/` previously cancelled an order regardless of its
  current status (including already-Delivered) — now respects the same rules; already-Cancelled
  stays a safe no-op
- Admin Orders page: status column is now a read-only badge (previously an unrestricted select);
  the expanded row gained status action buttons built from `available_transitions`, plus a
  clearer "Order details" heading
- Known limitation: the Django admin's `list_editable` status field bypasses this validation —
  flagged for a future pass, not in scope for the React admin dashboard this phase targeted
- No new migrations in Phase 5.2/5.3/5.4 — verified with `makemigrations --check --dry-run`
  after each change; every addition here is either pure logic (transition rules) or a read-only
  aggregation over data the existing schema already stores

## Phase 5.1 - Inventory Integration
Added:
- Inventory Django app
- Inventory API
- Admin Inventory page
- Stock management
- Low stock threshold support
- Inventory history

Details:
- `Product.low_stock_threshold` field + migration
- `InventoryHistory` model (old/new quantity, changed_by, timestamp) + migration
- New `inventory` Django app: `GET/PATCH /api/inventory/`, `GET /api/inventory/<id>/history/`,
  `GET /api/inventory/history/` — all admin-only (`IsAdminUser`)
- Admin Inventory page (`/admin/inventory`), routed inside the existing `ProtectedRoute`
- `AdminLayout` nav link
- Merged from `eon-fashion-phase4-part3-inventory` onto the
  `eon-fashion-final-master-phase5-ready` base
- No changes to Products/Orders/Auth APIs, storefront, or customer-facing UI

## Phase 4.5
Added:
- Django JWT Admin Authentication
- Protected Admin Routes

## Phase 3
Added:
- Orders Migration

## Phase 2
Added:
- Products Migration
