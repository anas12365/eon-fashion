import { useEffect, useState } from 'react';
import { getLargeUrl, getThumbUrl } from '../lib/images';
import { fetchProducts, fetchProduct, normalizeApiProduct } from '../services/api';

// --- TEMP DEBUG: remove once the image pipeline is confirmed end-to-end ---
// Logs what the API sent us and what the resolver produced from it, so a
// broken/empty images array is obvious in the console instead of just "no
// image showed up".
function debugLogImages(source, products) {
  if (!import.meta.env.DEV) return;
  products.forEach((p) => {
    // eslint-disable-next-line no-console
    console.debug(`[image-debug:${source}]`, {
      productId: p.id,
      name: p.name,
      images: p.images,
      resolvedThumb: getThumbUrl(p.images?.[0]),
      resolvedLarge: getLargeUrl(p.images?.[0]),
    });
  });
}
// --- end TEMP DEBUG ---

// DRF paginates list responses ({count, next, previous, results: [...]})
// once a products collection grows past PAGE_SIZE (24) — see
// backend/eon_backend/settings.py. This unwraps a single page's `results`
// array (or, defensively, a plain array if pagination were ever disabled
// server-side).
function unwrapList(response) {
  return Array.isArray(response) ? response : response?.results ?? [];
}

// Safety cap on how many pages a single "fetch everything" call will walk.
// 200 pages * PAGE_SIZE(24) = 4,800 products — comfortably above any real
// catalog size, and guards against ever spinning forever if a backend
// response were to keep returning a `next` link.
const MAX_PAGES = 200;

// Walks every page of a DRF-paginated /products/ response and returns the
// combined, normalized product list. This is what makes Home/Collection/
// the admin dashboard see the *entire* catalog instead of silently only
// ever seeing page 1 (the original bug: PAGE_SIZE=24 on the backend, but
// the frontend only ever read `results` from the first page).
async function fetchAllProductPages(params) {
  let page = 1;
  let all = [];
  for (let i = 0; i < MAX_PAGES; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await fetchProducts({ ...params, page });
    if (Array.isArray(res)) {
      // Pagination disabled server-side for some reason — this is already
      // the full list, nothing more to walk.
      all = all.concat(res);
      break;
    }
    all = all.concat(res?.results ?? []);
    if (!res?.next) break;
    page += 1;
  }
  return all;
}

// Product list for the storefront (or, with admin:true, the dashboard —
// which also sees hidden products). There's no push channel yet, so this
// is a one-shot fetch on mount — see MIGRATION.md for the plan to add
// polling/websockets later if needed.
//
// This always resolves the *complete* product list (walking every DRF
// page), because none of its consumers (Home, Collection, the admin
// dashboard) have their own pager UI — they render whatever this hook
// gives them, so silently truncating to one page would silently hide
// products past #24. The admin Products *table* is the one place that
// does have its own pager, and it talks to the API directly instead of
// through this hook — see admin/Products.jsx.
export function useProducts({ admin = false } = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchAllProductPages({ all: admin })
      .then((raw) => {
        if (!active) return;
        const data = raw.map(normalizeApiProduct);
        debugLogImages('useProducts', data);
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[useProducts] failed to load products', err);
        if (active) {
          setProducts([]);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [admin]);

  return { products, loading };
}

export function useProduct(id) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchProduct(id)
      .then((raw) => {
        if (!active) return;
        const p = normalizeApiProduct(raw);
        debugLogImages('useProduct', [p]);
        setProduct(p);
        setLoading(false);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[useProduct] failed to load product', err);
        if (active) {
          setProduct(null);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  return { product, loading };
}

// "You may also like" on ProductDetail. This used to be powered by
// useProducts() (the *entire* catalog, paged or not) just to exclude one
// id — that meant fetching every page of /products/ only to throw almost
// all of it away. This fetches a single, targeted page instead: plenty
// for a "more from EON" grid.
export function useRelatedProducts(product) {
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const productId = product?.id;

  useEffect(() => {
    if (!productId) {
      setRelated([]);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);

    fetchProducts({})
      .then((res) => {
        if (!active) return;
        const list = unwrapList(res)
          .map(normalizeApiProduct)
          .filter((p) => p.id !== productId);
        setRelated(list);
        setLoading(false);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[useRelatedProducts] failed to load related products', err);
        if (active) {
          setRelated([]);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [productId]);

  return { related, loading };
}
