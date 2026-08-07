# EON — Endless Collection

A from-scratch fashion brand website for **EON**, built with React, Tailwind CSS v4, Framer Motion, and GSAP.

## Stack

- **React 19** + **Vite**
- **Tailwind CSS v4** (CSS-first `@theme` config, see `src/index.css`)
- **Framer Motion** — page transitions, cart drawer, micro-interactions
- **GSAP** — intro sequence, ambient infinity background motion
- **React Router** — client-side routing across 7 pages

Products, categories, and orders are backed by **Firebase** (Firestore +
Storage + Auth) — there is no local/mock product data. The storefront reads
live from Firestore; the admin dashboard writes to the exact same project
and collection. The cart itself still lives in `localStorage` (it's
per-visitor session state, not product data), and orders are sent via a
pre-filled WhatsApp message after being recorded in Firestore.

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Firebase project config — see FIREBASE_SETUP.md
npm run dev       # start local dev server
npm run build     # production build -> dist/
npm run preview   # preview the production build
```

See `FIREBASE_SETUP.md` for full Firebase project setup (Firestore, Storage,
Auth, security rules, and creating your first admin account).

## Project structure

```
src/
  components/       Navbar, Footer, Logo, InfinityMark, InfinityBackground,
                     Intro (first-visit animation), CartDrawer,
                     ProductEditorial (alternating magazine layout),
                     PageTransition, ScrollToTop
  admin/            Admin dashboard: Login, Products, Categories, Orders,
                     ProductForm (create/edit + image upload)
  lib/
    firebase.js      Firebase app init (auth, db, storage) — shared by the
                     storefront and the admin dashboard, same project
    storage.js       Uploads product images to Firebase Storage
    db/
      products.js    Firestore reads/writes for the `products` collection
                     (this is the single source of truth for product data)
      categories.js, orders.js
  hooks/
    useProducts.js   Live (onSnapshot) subscription to Firestore products,
                     used by both the storefront and the admin dashboard
  context/
    CartContext.jsx  localStorage-backed cart (items, qty, size, color)
    AdminAuthContext.jsx  Firebase Auth session for /admin
  pages/
    Home.jsx, Collection.jsx, ProductDetail.jsx, About.jsx,
    SizeGuide.jsx, Contact.jsx, Cart.jsx
  utils/
    sizeRecommendation.js   Rule-based height/weight -> size logic
    whatsapp.js             Builds & opens the WhatsApp order message
```

## Customizing

### Managing products
There is no products file to edit — all products live in Firestore. Add,
edit, hide, or delete products from `/admin/products` in the admin
dashboard; changes appear on the live storefront immediately (no redeploy)
because the storefront subscribes to the collection in real time. A new
product is created with `visible: true` by default — uncheck "Visible on
storefront" in the product form to hide it without deleting it.

### Change the WhatsApp number
It's set in two places:
- `src/utils/whatsapp.js` -> `WHATSAPP_NUMBER`
- `src/pages/Contact.jsx` (the direct WhatsApp link)

Both currently point to `01022133876` (`+20 102 213 3876` in international
format, `201022133876` for the `wa.me` link).

### Adjust the brand palette / type
All design tokens live in `src/index.css` under `@theme`:
- `--color-bg`, `--color-electric`, `--color-ink`, etc.
- `--font-display` (Unbounded), `--font-body` (Manrope), `--font-mono` (IBM Plex Mono)

Changing a value there updates every Tailwind utility that references it
(`bg-electric`, `text-ink-soft`, `font-display`, ...) across the whole site.

### Re-trigger the intro animation
The intro only plays once per browser, gated by `localStorage` key
`eon_intro_seen`. Clear it (or open dev tools -> Application -> Local Storage)
to see it again.

## Notes

- Product images are uploaded through the admin dashboard and stored in
  Firebase Storage; the resulting download URLs are saved on the product
  document. There are no placeholder/demo image URLs in the app.
- Payment is Cash on Delivery only, matching the brief; the "Confirm via
  WhatsApp" button on the Cart page never charges anything automatically.
- Reduced-motion is respected globally (see the media query at the bottom of
  `src/index.css`).
