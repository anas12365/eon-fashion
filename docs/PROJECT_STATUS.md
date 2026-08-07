# EON Fashion Project Status

Current Master:
eon-fashion-final-master-phase5-ready (+ Phase 4 Part 3: Inventory, + Phase 5.2/5.3/5.4)

## Current Status

Frontend:
Stable

Backend:
Stable with inventory, order workflow, customers, and analytics integration

Authentication:
Completed

Products:
Completed

Orders:
Completed — full status lifecycle with transition validation

Inventory:
Completed and integrated

Customers:
Completed (derived from Order data — no separate customer-account model exists)

Analytics:
Completed

Note: this sandbox has no network/DB access for a real Postgres server, so
verification for every phase (5.1 through 5.4) was done against a local
SQLite database (`eon_backend/settings_test.py`, used for testing only —
not part of the shipped project) with `python manage.py migrate` actually
run and the real endpoints exercised end-to-end via curl. Migration files
are correct and were confirmed to apply cleanly; they have not been run
against the production Postgres database. See MIGRATION.md.

## Completed Phases

Phase 2:
- Products migration

Phase 3:
- Orders migration

Phase 4.5:
- Admin JWT Authentication

Phase 5.1:
- Inventory Management Integration
  - `low_stock_threshold` added to the Product model
  - `InventoryHistory` model records every stock change (old/new quantity, changed_by, timestamp)
  - `GET/PATCH /api/inventory/`, `GET /api/inventory/<id>/history/`, `GET /api/inventory/history/`
  - Admin Inventory page: stock table, search, low-stock/out-of-stock filters, inline stock edit, per-product history

Phase 5.2:
- Order Workflow
  - `Order.ALLOWED_TRANSITIONS` state machine: Pending → Confirmed → Preparing → Shipped → Delivered,
    with an early-stage Cancelled exit (Pending/Confirmed/Preparing only — not after Shipped).
    Delivered and Cancelled are terminal.
  - `PATCH /api/orders/<id>/status/` now validates the transition (400 on an invalid move);
    filtering (`?status=`) and search (`?search=`) already existed and are unchanged.
  - Bug fix: `POST /api/orders/<id>/cancel/` previously allowed cancelling an already-Delivered
    order — it now respects the same transition rules.
  - `OrderSerializer.available_transitions` exposes the valid next statuses so the frontend never
    offers a move the backend would reject.
  - Admin Orders page: status column is now a read-only badge; the expanded row has status action
    buttons built from `available_transitions` instead of a free-choice dropdown.
  - Known limitation: the Django admin's `list_editable` status field on `OrderAdmin` still allows
    an unrestricted status change — it does not go through `validate_status`. Out of scope for this
    phase (it's a separate surface from the admin *React* dashboard this phase targeted); flagged for
    a future pass.

Phase 5.3:
- Customers Management
  - No customer-account model exists (see users/models.py) — Order only stores free-text
    customer_name/phone/address. Rather than adding a new Customer model (a second source of
    truth for identity Order already carries), customers are aggregated live from Order,
    grouped by phone number.
  - New `customers` app (no model, no migration): `GET /api/customers/` (search, ordering,
    paginated) and `GET /api/customers/<phone>/` (aggregate + full order history), admin-only.
  - Admin Customers page: table with search/ordering, expandable row showing order history.

Phase 5.4:
- Analytics Dashboard
  - New `analytics` app (no model, no migration): `GET /api/analytics/summary/` — revenue
    (excludes cancelled orders), orders count + breakdown by status, distinct customer count,
    product count (total + visible), top 5 best sellers by quantity sold.
  - Dashboard: revenue/customers/products/orders stat cards, an orders-by-status bar breakdown,
    and a best-sellers list — all custom CSS bars, no new charting dependency added.

Phase 5.5:
- Reports
  - New `reports` app (no model, no migration — same pure-aggregation pattern as `analytics`/
    `customers`): four admin-only endpoints computed live from `Order`/`OrderItem`/`Product`.
    - `GET /api/reports/sales/?date_from=&date_to=` — total revenue (excludes Cancelled), order
      count, average order value, and a per-day revenue trend.
    - `GET /api/reports/orders/?date_from=&date_to=` — total orders, status breakdown, completed
      (Delivered) and cancelled counts.
    - `GET /api/reports/inventory/` — total products, total stock units, inventory value
      (sum of price × stock), low-stock/out-of-stock counts, and the low-stock product list.
    - `GET /api/reports/products/?date_from=&date_to=&limit=` — best sellers by quantity sold with
      revenue per product, cancelled orders excluded (same convention as Analytics).
  - Admin Reports page (`/admin/reports`): tabbed Sales / Orders / Inventory / Product Performance
    views, date-range filters (Sales/Orders/Products), summary cards, tables, and per-tab CSV
    export (client-side, no new charting/export dependency added).
  - `AdminLayout` nav link. No changes to Products/Orders/Inventory/Customers/Analytics APIs or UI.

Phase 6.1:
- Production Security Hardening
  - Fail-closed Django defaults: `DEBUG` now defaults to `False`; the insecure `SECRET_KEY`
    fallback was removed — the app raises `ImproperlyConfigured` at startup if
    `DJANGO_SECRET_KEY` isn't set, instead of silently signing sessions/JWTs with a public
    placeholder value.
  - HTTPS/cookie hardening added, all environment-controlled and off by default so local HTTP
    dev is unaffected: `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`,
    `SECURE_HSTS_SECONDS` (+ subdomains/preload), `SECURE_PROXY_SSL_HEADER` (opt-in, only for
    behind a TLS-terminating reverse proxy).
  - Admin login rate limiting: `POST /api/auth/login/` only, via a new scoped
    `AdminLoginThrottle` (`users/throttles.py`), default `5/min`, configurable via
    `ADMIN_LOGIN_THROTTLE_RATE`. No `DEFAULT_THROTTLE_CLASSES` was set, so every other endpoint
    remains unthrottled — verified no other view was touched.
  - Root `.gitignore` added (`.env`, `__pycache__/`, `node_modules/`, `dist/`, `media/`,
    `staticfiles/`, `db.sqlite3`, etc.) — previously missing entirely from the repo.
  - Frontend `ErrorBoundary` (`src/components/ErrorBoundary.jsx`) added and wraps `<App />` in
    `main.jsx` — catches unhandled render errors app-wide with a plain fallback UI instead of a
    blank screen. No existing page/component logic touched.
  - Minimal Django `LOGGING` config added: console handler, env-controlled level
    (`DJANGO_LOG_LEVEL`, defaults to `INFO` in debug / `WARNING` otherwise), a dedicated `eon`
    logger namespace for future app-level logging.
  - No models, APIs, authentication flow, or business logic changed in Products, Orders,
    Inventory, Customers, Analytics, or Reports — settings/infra only.

Phase 6.2:
- Django Media Product Image Uploads
  - `ProductForm.jsx` now uploads product images through a Django JWT–protected endpoint
    (`POST/DELETE /api/products/<id>/images/`) instead of Firebase Storage. Django stores files
    under `MEDIA_ROOT/products/<id>/large|thumb/` and returns absolute URLs.
  - `Product.images` keeps its existing `{large, thumb}` JSON shape — no model/migration change.
    Existing Firebase-hosted image URLs remain valid and continue to render everywhere
    (storefront, admin, Inventory) exactly as before.
  - New `src/lib/djangoStorage.js` adapter matches `src/lib/storage.js`'s exact function
    signatures, so only one import line in `ProductForm.jsx` changed — no component logic
    touched. Client-side image resize/WebP-encode is unchanged.
  - Firebase Storage, `storage.rules`, and the Firestore data fallback (`VITE_USE_DJANGO`) are
    untouched and still functional; this phase only moved where image *files* are written.
  - Known limitation (carried forward, not addressed here): the new Django delete endpoint
    cannot remove legacy Firebase Storage files — that cleanup is a future manual task. See
    `MIGRATION.md`.
  - No changes to Orders, Inventory business logic, Customers, Analytics, Reports, or
    Authentication.

Phase 6.3:
- Production Fixes & Release Readiness
  - Fixed three confirmed production issues: (1) `InventoryProductSerializer.get_image()`
    crashed (`AttributeError`) on any product still carrying a legacy plain-string image URL —
    now handles both the legacy string and current `{large, thumb}` shapes, matching
    `orders/serializers.py`'s existing pattern; (2) `ProductPerformanceReportView` crashed
    (`AssertionError`, 500) on `?limit=-5` — Django QuerySet slicing rejects negative indices;
    now falls back to the existing default of 50 for any non-positive limit; (3) SimpleJWT had
    `ROTATE_REFRESH_TOKENS: True` with no blacklist, so a rotated-away refresh token stayed
    valid until its own 7-day expiry — added `rest_framework_simplejwt.token_blacklist` +
    `BLACKLIST_AFTER_ROTATION: True`. No model, serializer field, or API contract changed.
  - Release verification (traced): read all docs, then verified as fully as this sandbox
    allows (no network access for `pip`/`npm install`, so no live `manage.py check` /
    `npm run build`) — `py_compile` across the entire backend, a manual model-vs-migration
    drift check (none found), a full `urls.py` route-table audit, a static cross-check of
    every relative import against actual exports in `src/` (zero problems), and a real
    esbuild-based module-graph bundle from `main.jsx` with npm packages marked external
    (resolved cleanly, confirming Phase 6.2's `djangoStorage.js`/`authFetch` are genuinely
    reachable). All 8 functional flows (admin login, Product CRUD, Django image upload,
    Firebase image rendering, Inventory, Orders, Customers, Analytics, Reports+CSV) traced
    end-to-end frontend-call → endpoint → serializer with no dead references.
  - Found and closed one real gap: no root `.env.example` existed despite `FIREBASE_SETUP.md`
    instructing `cp .env.example .env`. Added `/.env.example` with exactly the 8 `VITE_*`
    variables `src/` reads. Added `DATA_UPLOAD_MAX_MEMORY_SIZE` / `FILE_UPLOAD_MAX_MEMORY_SIZE`
    documentation to `backend/.env.example` (non-blocking — both already had safe defaults).
  - Added `docs/RELEASE_CHECKLIST.md`: required env vars, `migrate` (incl. `token_blacklist`
    table confirmation), `collectstatic`, frontend build, production deployment checklist.
  - Outstanding, deliberately not run here (require a live DB/server/network, unavailable in
    this sandbox — see `docs/RELEASE_CHECKLIST.md`): `python manage.py migrate` (needed to
    actually create the `token_blacklist` tables), `python manage.py collectstatic`, a real
    `npm run build`/`manage.py check` against installed dependencies, and live functional
    testing against a running deployment.
  - No changes to any model, API contract, authentication flow, or
    Products/Orders/Inventory/Customers/Analytics/Reports business logic. Firestore fallback
    untouched.

## Next

After that:
- Run the outstanding live checks listed above (Phase 6.3) against a real environment before
  going live: `migrate`, `collectstatic`, `npm run build`, and live functional testing.
- Continue production hardening beyond that: deployment-environment concerns not fully covered
  yet (DB connection pooling, structured external logging) remain open per the Phase 6.1 audit.
  Legacy Firebase Storage cleanup (see `MIGRATION.md`) remains an open, separate future task —
  not attempted in any phase so far.

## Rules

- Inspect existing code before changes.
- Do not rebuild existing features.
- Preserve Django architecture.
- Keep Firebase fallback until migration is proven stable.
