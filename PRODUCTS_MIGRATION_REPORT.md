# Phase 2 — Products Migration Report

Status: **complete and end-to-end for Products.** Feature-flagged, off by
default. No UI, animation, layout, or component changed.

## The flag

```
VITE_USE_DJANGO=false   # default — everything below stays on Firebase
VITE_USE_DJANGO=true    # products read/write through Django (backend/)
```

Set in `.env`. Flip it, restart `npm run dev`, done — no code change, no
redeploy of anything else, instant rollback either direction.

## Files changed

| File | What changed |
|---|---|
| `src/lib/featureFlags.js` | **New.** Exports `USE_DJANGO`, the single flag every branch below reads. |
| `src/services/api.js` | Added `normalizeApiProduct()` — maps a Django product response onto the exact shape Firestore's `normalize()`/`withEffectivePrice()` already produce (same field names, same discount-applied `price`, same `originalPrice` convention). Updated the file header comment (it's no longer unused). |
| `src/hooks/useProducts.js` | `useProducts()` and `useProduct()` each branch on `USE_DJANGO`: Django path calls `fetchProducts`/`fetchProduct` from `services/api.js` and normalizes; Firebase path is **byte-for-byte unchanged**. |
| `src/lib/db/products.js` | `createProduct`, `updateProduct`, `deleteProduct` branch on `USE_DJANGO` the same way, calling the aliased `apiCreateProduct`/`apiUpdateProduct`/`apiDeleteProduct`. `setProductVisibility` needed no change — it already just calls `updateProduct` internally, so it's flag-aware for free. |
| `.env`, `.env.example` | Added `VITE_USE_DJANGO=false`. Firebase values untouched. |

## Files intentionally NOT changed

- **`src/pages/Collection.jsx`** — only calls `useProducts()`. Client-side
  color filtering runs on whatever array comes back, from either backend.
  Zero changes needed.
- **`src/pages/ProductDetail.jsx`** — only calls `useProduct(id)` and
  `useProducts()`. Same reasoning. Zero changes needed.
- **`src/admin/Products.jsx`**, **`src/admin/ProductForm.jsx`** — both
  import `createProduct`/`updateProduct`/`deleteProduct`/
  `setProductVisibility` from `lib/db/products.js`, which is now the
  router. Admin UI code is untouched.
- **`src/context/CartContext.jsx`** — cart state is local
  (`localStorage`), never touched Firestore, unaffected either way.
- Every component, animation, Tailwind class, and the intro/nav/footer:
  untouched.

## Why this shape (single router file, not a rewrite of call sites)

`lib/db/products.js` and `hooks/useProducts.js` were already the *only*
places anything in the app talked to Firestore — nothing in `pages/`,
`components/`, or `admin/` imported Firebase directly. That meant the
correct move was to make those two files backend-agnostic routers rather
than touch every call site, which is what actually delivers "keep every
UI component unchanged, only replace the data source."

## Verified (code-level — see caveat below)

- **Products load**: `fetchProducts()` → unwrapped (handles DRF's
  paginated `{results: [...]}` shape) → `normalizeApiProduct()` → same
  shape as before.
- **Product Details**: `fetchProduct(id)` → normalized → renders through
  the same `ProductDetail.jsx` with no changes. 404/missing product
  still triggers the existing `<Navigate to="/collection" />` fallback.
- **Category filtering**: unchanged — it's client-side in `Collection.jsx`
  over `product.colors`, works on data from either source. (The Django
  API also accepts `?category=` server-side for future use, but nothing
  calls it yet since the UI doesn't have a category selector, only the
  color filter buttons that already existed.)
- **Search**: the search input in `Navbar.jsx` is UI-only in the current
  app — it has no `onChange`/state wiring to product data on either
  backend. Not a regression; I didn't add search filtering behavior
  since that would be a UI/behavior change, which was explicitly out of
  scope. The Django API does support `?search=` whenever that gets built.
- **Sorting**: same situation — no sort control exists in the current UI
  on either backend. `?ordering=` is available on the API for when one's
  added.
- **Cart**: confirmed untouched (local state only, no data-source
  dependency).
- **Images**: `lib/images.js` needed zero changes — Django's `images`
  field is the same `[{large, thumb}]` / legacy-string shape already
  handled by `getThumbUrl`/`getLargeUrl`/`getProductImage`.
- Syntax-checked every changed `.js` file (`node --check`) and the
  touched Django modules (`python -m py_compile`) — all clean.

**Caveat, stated plainly:** this sandbox has no network access, so I
could not `npm run dev` with `VITE_USE_DJANGO=true` against a live
Django server to watch it render. The above is verified by tracing every
code path and matching data shapes exactly, not by a live click-through.
Before you rely on this, run it once locally with the flag on against a
seeded Django DB.

## Known gap: Admin CRUD needs a Django session

`admin/Products.jsx` and `admin/ProductForm.jsx` now call through to the
Django API when the flag is on — but Django's `IsAdminOrReadOnly`
permission requires a staff JWT on write requests, and **admin login is
still Firebase Auth** (`AdminAuthContext.jsx` wasn't touched — Phase 7
auth cutover wasn't part of this task). Concretely, with the flag on:

- Product **reads** (list/detail) work with no login, same as today.
- Product **writes** (create/update/delete/visibility toggle) will get a
  401 from Django until something puts a valid Django access token under
  the `eon_admin_tokens` key `services/api.js` reads — there's no UI path
  to that yet, since building an admin login screen wasn't requested and
  would be a UI change.

This is expected at this stage, not a bug: Products (data) and Auth are
separate migration phases by design, and you asked me not to start Orders/
Auth yet. Flagged here so it isn't a surprise.

## Remaining Firebase dependencies (after this phase)

- Admin authentication (`AdminAuthContext.jsx`) — Firebase Auth.
- Orders (`lib/db/orders.js`, `Cart.jsx` checkout, `admin/Orders.jsx`).
- Categories (`lib/db/categories.js`) — used by the category `<select>`
  in `ProductForm.jsx`; not part of "Products" per the spec's Product
  model (categories aren't a separate model in `backend/products`).
- Image **uploads** (`lib/storage.js`, Firebase Storage) — product
  *records* now can live in Django, but image files still upload to
  Firebase Storage and the resulting URLs get stored in the product's
  `images` field either way. No image-upload endpoint exists on the
  Django side yet; building one wasn't in this phase's scope.

## Remaining migration work (not started, per your instruction)

1. **Orders** — `backend/orders` API already exists (built in Phase 1).
   Next step would be the same pattern: a flag-aware router in
   `lib/db/orders.js`, touching `Cart.jsx` checkout call and
   `admin/Orders.jsx` — not started.
2. **Admin auth** — swap `AdminAuthContext.jsx` to `adminLogin`/
   `getCurrentAdmin` from `services/api.js`. Do this only after Orders,
   since it's the highest-blast-radius change (can lock you out of
   admin).
3. Once nothing reads Firestore/Storage: remove `firebase` dependency,
   `src/lib/firebase.js`, `src/lib/db/*.js`.

Ready for the go-ahead on Orders whenever you want it — not started yet,
as instructed.
