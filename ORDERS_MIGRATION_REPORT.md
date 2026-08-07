# Phase 3 — Orders Migration Report

Status: **complete and end-to-end, feature-flagged, off by default.** Unlike
Phase 2 (which was code-traced but couldn't be run live), this phase was
**actually installed and tested against a real local PostgreSQL instance**
in this session — every endpoint below was hit with real HTTP requests,
not just reasoned about.

```
VITE_USE_DJANGO=false   # default — orders stay on Firebase, unchanged
VITE_USE_DJANGO=true    # orders read/write through Django (backend/orders)
```

Same single flag as Products — flip it, restart `npm run dev`, done.

## Files Modified

| File | What changed |
|---|---|
| `backend/orders/models.py` | `OrderItem` gained snapshot fields (`product_name`, `product_image`, `unit_price`) so a historical order stays correct even if the product is later edited or deleted. `Order` gained `notes`, `currency`, `shipping_cost`, `total`, `payment_method` (defaults to `cod`, with `stripe`/`paymob` already as choices for later). `product` FK stays nullable + `SET_NULL`. |
| `backend/orders/serializers.py` | Rewritten. `OrderCreateSerializer` is the important one: price and stock are computed **server-side from the live `Product` row inside a DB transaction**, never trusted from the client; client-supplied name/image/price are only used as a fallback if the product was deleted between add-to-cart and checkout. |
| `backend/orders/views.py` | Added `status` (existing), `read`, `cancel` (restocks), and `my-orders` (public, filtered by phone) actions. Added search (`customer_name`/`phone`/`display_id`) + filtering (`status`, `date_from`, `date_to`, `customer`) + ordering. |
| `backend/orders/filters.py` | **New.** `OrderFilter` backing the filtering above. |
| `backend/orders/notifications.py` | **New.** `notify_new_order` / `notify_status_change` / `notify_order_cancelled` — logging-only stubs called at the right lifecycle moments, per your instruction to prepare the architecture without wiring a real channel yet. |
| `backend/orders/admin.py` | Updated list/readonly fields for the new columns. |
| `backend/eon_backend/settings.py` | Added `django_filters` to `INSTALLED_APPS`. |
| `backend/requirements.txt` | Added `django-filter`. |
| `src/services/api.js` | Added `markOrderRead`, `cancelOrder`, `fetchMyOrders`; fixed the error parser (`extractErrorMessage`) to pull a real message out of any DRF error shape, not just `{detail: ...}` — this is what makes "only 3 left in stock" actually reach the UI. |
| `src/lib/db/orders.js` | Rewritten as the same flag-aware router pattern Phase 2 used for `products.js`. See "Why this shape" below. |
| `src/pages/Cart.jsx` | **One line.** The checkout `catch` block now shows `err.message` instead of a hardcoded generic string — same `<p>` element, same position, just real text when the backend has something specific to say (e.g. a stock error). |
| `.gitignore` | **New — was missing entirely.** This is unrelated to orders, but it's why `npm run lint` was scanning `node_modules` (52k warnings) instead of your ~40 source files. Pure tooling hygiene, no app code touched. |

## Files intentionally NOT changed

- **`src/pages/OrderSuccess.jsx`** — only reads the `:orderId` URL param and displays it. Works identically regardless of which backend produced that `displayId`. Zero changes.
- **`src/admin/Orders.jsx`** — only imports `subscribeOrders`/`updateOrderStatus`/`markOrderRead`/`ORDER_STATUSES` from `lib/db/orders.js`. The router preserves the exact function signatures and (critically) the exact data shape — see the Timestamp shim below — so this file needed **no changes at all**.
- **`src/context/CartContext.jsx`** — cart state is local `localStorage`, unrelated to which order backend is active. Untouched.
- Every animation, layout, color, and component structure — untouched.

## Why this shape (same reasoning as Phase 2, applied to Orders)

`lib/db/orders.js` was already the only place anything talked to the
`orders` Firestore collection. Making it a backend-agnostic router (like
`lib/db/products.js`) is what delivers "zero component changes" — the
alternative would have meant editing `Cart.jsx` and `admin/Orders.jsx`
directly, which is exactly what you asked not to do.

Two things needed real engineering to make that router transparent:

1. **The "live subscription" gap.** Firestore's `onSnapshot` pushes
   updates; a REST API doesn't. `subscribeOrders()` on the Django side
   polls every 5s and calls the same `callback(list)` — the function
   signature (`callback in, unsubscribe fn out`) is identical either way,
   so `admin/Orders.jsx`'s `useEffect(() => subscribeOrders(setOrders), [])`
   doesn't know or care which backend it's talking to. This is a
   deliberate tradeoff, not an oversight — a truly "live" version would
   need Django Channels/websockets or SSE, which is a real architecture
   change and out of scope for "don't redesign, just migrate the data
   layer." Flagging it here as the one place this migration is
   *functionally* not 1:1 with Firestore, even though the UI never
   notices.

2. **The Timestamp shim.** `admin/Orders.jsx` calls
   `order.createdAt.toDate()` because that's how Firestore's `Timestamp`
   works. Django's JSON response gives back an ISO string instead. Rather
   than touch the component, `lib/db/orders.js` wraps Django's
   `created_at` in `{ toDate: () => date, toMillis: () => date.getTime() }`
   — a two-line object that makes an ISO string quack like a Firestore
   Timestamp. This is the same trick as `normalizeApiProduct()` matching
   Firestore's product shape in Phase 2, applied to dates.

## Django Endpoints Added

```
POST   /api/orders/                    create (public — checkout)
GET    /api/orders/                    list (admin) — ?status=&date_from=&date_to=&customer=&search=&ordering=
GET    /api/orders/<id>/               retrieve (admin)
PATCH  /api/orders/<id>/status/        update status (admin) — auto restocks on Cancelled
PATCH  /api/orders/<id>/read/          mark read (admin)
POST   /api/orders/<id>/cancel/        cancel + restock (admin)
GET    /api/orders/my-orders/?phone=   public, filtered by phone (no accounts exist)
```

**`GET /api/orders/my-orders/`** exists on the backend per your spec, but
**no frontend page calls it** — there was no "My Orders" page in the
Firebase version to migrate (checked: no such route/component exists in
`src/pages/` or `src/App.jsx`), and building a new customer-facing page
would be new UI, which was explicitly out of scope this round. Same
precedent Phase 2 set for the search bar / sort control. Ready to wire up
whenever you want that page built.

**Admin search/filter/date UI**: same situation — `admin/Orders.jsx` has
no search box or filter dropdowns today, so I didn't add any (would be a
UI change). The API fully supports it (`?search=`, `?status=`,
`?date_from=`, `?date_to=`, `?customer=`) for whenever that UI is added.

## Verified — actually run, not just traced

This session had real network access, so unlike Phase 2 I could install
Django, stand up a real local PostgreSQL 16 instance, migrate, and hit
the live API. All of the following were executed with real HTTP requests
against a real Postgres database, then the DB was reset and re-verified
from a clean slate a second time:

- ✅ `python manage.py migrate` — applies cleanly to real Postgres
- ✅ `python manage.py check` — 0 issues
- ✅ Checkout creates an order → items snapshot the product's name/image
  **and server-computed discounted price** (verified: a product with a
  10% discount charged the discounted price even though the client sent
  no price at all)
- ✅ Stock decrements atomically on order creation
- ✅ Ordering more than available stock → rejected with `400` and the
  message `"X" only has N left in stock.` — and stock is confirmed
  **unchanged** after the rejected attempt (no partial write)
- ✅ Setting status to `Cancelled` → stock is restocked (verified exact
  numbers before/after)
- ✅ `PATCH .../read/` marks an order read
- ✅ `GET .../my-orders/?phone=...` returns only that phone's orders;
  omitting `phone` returns a `400` with a clear message
- ✅ Admin `?status=` filtering and `?search=` both verified
- ✅ Unauthenticated list request → `401`, as expected
- ✅ A product with the **legacy string-array image format**
  (`images: ["url"]`, no `{large,thumb}`) was ordered successfully —
  confirms the snapshot logic (`_first_thumb()`) doesn't crash on old
  data, only on new
- ✅ `npm run build` — clean
- ✅ `npm run lint` (after fixing the missing `.gitignore`) — 0 errors,
  6 pre-existing warnings unrelated to this work
- ✅ Diffed the entire project against the Phase 2 zip you gave me — the
  file list above is the **complete and exact** set of changes, nothing
  else drifted

**Not verified (no browser in this environment):** an actual click
through the live React UI with `VITE_USE_DJANGO=true`. Everything above
was verified at the API/data-shape level, which is what actually
determines whether the UI breaks — but a real click-through is still
worth doing once before you rely on this.

## Remaining Firebase Dependencies

- **Admin authentication** (`AdminAuthContext.jsx`) — still Firebase Auth.
  This is intentionally last, per the existing cutover plan in
  `MIGRATION.md` (highest blast-radius change — misconfiguring it locks
  you out of `/admin`).
- **Categories** (`lib/db/categories.js`) — used by the category
  `<select>` in `ProductForm.jsx`. Not part of either the Products or
  Orders spec as a separate model.
- **Image uploads** (`lib/storage.js`) — still Firebase Storage regardless
  of `VITE_USE_DJANGO`. Product/order *records* live in Postgres; image
  *files* still upload to Firebase Storage and the resulting URLs get
  stored either way. No image-upload endpoint exists on the Django side.

## Remaining Migration Tasks

1. **Admin auth cutover** — swap `AdminAuthContext.jsx` to
   `adminLogin`/`getCurrentAdmin` from `services/api.js`. This is the
   next planned step per `MIGRATION.md`.
2. **Data migration script** — a one-off job to read every existing
   Firestore product/order and POST it to Django, for when you're ready
   to actually cut over a real store's data. Not built yet (correctly
   sequenced after the schema is proven, which this session did).
3. Once nothing reads Firestore/Storage: remove the `firebase` dependency,
   `src/lib/firebase.js`, `src/lib/db/*.js`.
4. **(Optional, not requested)** If/when a real "My Orders" page or admin
   search/filter UI gets built, the backend is already ready for both.

## Architecture Improvements (this phase, beyond the literal spec)

- **Server-side authoritative pricing.** The Firestore version trusted
  whatever price the client sent at checkout. The Django version
  recomputes price from the live `Product` row (with discount applied)
  inside the same transaction that decrements stock — a tampered or
  stale client price can no longer affect what a customer is charged.
- **Atomic stock handling.** `select_for_update()` inside
  `transaction.atomic()` means two simultaneous checkouts for the last
  unit of a product can't both succeed — one gets a clean "out of stock"
  error instead of silently overselling.
- **Historical integrity.** Order line items snapshot name/image/price at
  time of purchase, independent of the live product — deleting or editing
  a product later can never corrupt or blank out a past order.
- **Cancel = restock**, both directions (cancelling restocks; un-cancelling
  re-reserves), so stock numbers stay trustworthy through status changes
  either way.

## Next phase, prepared but not started

You asked me to prepare for **Admin Dashboard & Analytics** without
starting it. Given what exists now, that phase would sit on top of:
`GET /api/orders/?status=&date_from=&date_to=` (already built, unused by
any UI yet) plus the equivalent on `/api/products/` — i.e. the data this
phase and Phase 2 already expose is enough to build real dashboard
metrics (orders by status, revenue by date range, low-stock products)
without any further backend work, only new frontend screens. Not started,
per your instruction.
