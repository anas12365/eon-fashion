# Django/PostgreSQL Backend Migration

## Firebase Storage → Django Media (Product Images) — Phase 6.2

### 1. Previous architecture
- `ProductForm.jsx` uploaded product images directly to **Firebase
  Storage** (`src/lib/storage.js`, `uploadBytesResumable`), independent
  of whether `VITE_USE_DJANGO` was on or off for product *data*.
- `Product.images` stored the resulting **Firebase download URLs**, as
  `{large, thumb}` pairs.
- **Firebase Auth** rules (`storage.rules`) protected Storage writes —
  a rule set that assumed Firebase Auth sessions, which stopped being
  how admins authenticate once Admin JWT (Django) shipped in Phase 4.5.
  Storage access control had been out of step with the rest of the app's
  auth since then.

### 2. New architecture
- `ProductForm.jsx` uploads through a **Django JWT–protected endpoint**:
  `POST /api/products/<id>/images/` (admin-only, same `IsAdminOrReadOnly`
  permission the rest of the Products API uses).
- Django stores the files under `MEDIA_ROOT/products/<id>/large/` and
  `MEDIA_ROOT/products/<id>/thumb/`, and returns absolute URLs via
  `request.build_absolute_uri()`.
- `Product.images` **JSON structure is unchanged**: still
  `[{large: "<url>", thumb: "<url>"}, ...]`. Only where the URLs point
  changed — Django never gained a new model or field for this; no
  migration was needed.
- New frontend adapter `src/lib/djangoStorage.js` exports the same
  function signatures as `src/lib/storage.js`
  (`uploadProductImageSets`, `deleteProductImageSet`,
  `validateImageFile`), so `ProductForm.jsx` only changed one import
  line. Client-side resize/WebP-encode (`src/lib/imageProcessing.js`)
  is unchanged — Django only ever receives already-optimized blobs.

### 3. Compatibility
- **Existing Firebase image URLs remain valid** and continue to render
  everywhere (`ProductDetail`, `Collection`, admin `Products`,
  `Inventory`) — `src/lib/images.js`'s `getImageUrl`/`getThumbUrl`/
  `getLargeUrl` resolve any URL string identically regardless of host,
  so old and new images render side by side with zero special-casing.
- **No database migration required.** `Product.images` was already a
  schema-less `JSONField`; nothing about its shape or the
  `ProductSerializer` contract changed.
- **Old images are not deleted automatically.** Migrating a product to a
  newly-uploaded Django image does not touch any previously-saved
  Firebase URLs already sitting in that product's `images` array — they
  stay exactly as they were until an admin removes them from the form.

### 4. Known limitations
- The Django delete endpoint (`DELETE /api/products/<id>/images/`) only
  ever deletes files it recognizes as its own (`MEDIA_ROOT/products/<id>/…`).
  **It does not and cannot remove legacy Firebase Storage files** — those
  still require Firebase Auth/Storage rules and are outside Django's
  reach entirely.
- **Firebase Storage cleanup is a future, manual migration task**: once
  all products have been re-uploaded through Django (or a decision is
  made to leave old images as-is), a one-off script against the Firebase
  Admin SDK would be needed to remove the now-orphaned Storage objects.
  Not attempted here — deleting from a system this migration doesn't
  write to is a separate, explicitly-approved step, not a side effect of
  this one.
- `src/lib/storage.js` (Firebase) and `firebase.js`/`storage.rules` were
  left fully in place and functional — nothing about the Firestore data
  fallback path described below was touched by this change.

---

# Django/PostgreSQL Backend Migration (original — Products/Orders/Auth)

Status: **backend built, frontend still runs on Firebase**. Nothing about
the live app changed tonight — this is the foundation, not the cutover.

## What changed

**New files only — no existing file was rewritten except the two `.env`
files (values appended, nothing removed) and `src/lib/images.js` (one
function added, nothing removed/edited):**

```
backend/                        # new — full Django REST Framework project
  eon_backend/                  # settings, urls, wsgi/asgi
  products/                     # model, serializer, viewset, admin
  orders/                       # Order + OrderItem, viewset, admin
  users/                        # admin-only JWT auth (no customer accounts)
  requirements.txt
  .env.example
  README.md                     # full API reference + setup steps

src/services/api.js             # new — fetch wrapper for the Django API
                                 # NOT imported anywhere yet
src/lib/images.js                # +getProductImage(product, type) wrapper
                                 # around the existing getThumbUrl/getLargeUrl
.env / .env.example              # +VITE_API_BASE_URL (Firebase vars untouched)
```

**Confirmed untouched:** every component, page, admin screen, context,
hook (besides nothing), animation, Tailwind config, and all existing
Firebase code paths (`src/lib/firebase.js`, `src/lib/db/*.js`,
`src/hooks/useProducts.js`). The site runs exactly as it did before this
session.

## Why the frontend still uses Firebase

Phase 5 said "prepare the frontend to consume the Django API... but do
not remove Firebase immediately — keep compatibility during migration."
`src/services/api.js` exists and is ready, but wiring it in means editing
`useProducts.js` and the admin pages' Firestore calls — that's the one
place existing behavior could actually break, so it's deliberately not
done automatically. See "Cutover" below for how to do it safely, in
small steps, when you're ready.

## Backend setup (required before any of this is live)

This sandbox has no network access, so the Django code is hand-written
but **not installed or migration-tested here**. Before relying on it:

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in real DB credentials + secret key
createdb eon_db        # or your platform's equivalent
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Full API reference (endpoints, permissions, data shapes) is in
`backend/README.md`.

## Cutover plan (do this in small steps, not all at once)

1. **Run the backend locally**, create a couple of test products via
   `/admin/` or the API, confirm `GET /api/products/` returns them.
2. **Data migration**: write a one-off script that reads every Firestore
   product/order and POSTs it to the Django API. Not built tonight —
   it's a one-time data job, safest to write once the schema above is
   confirmed to match your real data (especially `images`, `sizes`,
   `colors`, which are free-form in Firestore today).
3. **Swap one read path first**: change `useProducts.js` to call
   `fetchProducts()`/`fetchProduct()` from `services/api.js` instead of
   `subscribeProducts()`/`getProduct()` from `lib/db/products.js`, behind
   a feature flag (e.g. `VITE_USE_DJANGO_API=true`) so you can flip back
   instantly if something looks wrong. Because `images.js` already
   normalizes both shapes, the storefront doesn't need any other change.
4. **Swap admin writes** (`admin/ProductForm.jsx`, `admin/Products.jsx`)
   to `createProduct`/`updateProduct`/`deleteProduct` from `services/api.js`
   the same way, once reads look solid.
5. **Orders** — done as of Phase 3 (see `ORDERS_MIGRATION_REPORT.md`). Same
   flag, same router pattern, already live-tested against Postgres.
6. **Swap admin login** (`AdminAuthContext.jsx`) from Firebase Auth to
   `adminLogin()`/`getCurrentAdmin()` in `services/api.js` last, since
   it's the highest-blast-radius change (locks you out of the admin
   panel if misconfigured) — verify everything else first.
7. Once nothing reads from Firestore/Storage anymore, remove the
   `firebase` dependency and `src/lib/firebase.js`, `src/lib/db/*.js`.

Each step above is a small, revertible diff in one file — at no point do
you need a "big bang" cutover.
