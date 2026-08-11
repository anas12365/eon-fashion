import { useEffect, useState } from 'react';
import { deleteProduct, setProductVisibility } from '../lib/db/products';
import { fetchProducts, normalizeApiProduct } from '../services/api';
import { getThumbUrl } from '../lib/images';
import ProductForm from './ProductForm';

// Matches the backend's PAGE_SIZE (see backend/eon_backend/settings.py) so
// "Page X of Y" math lines up with what the API actually paginates by.
const PAGE_SIZE = 24;

export default function AdminProducts() {
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  // This table has its own pager (like Orders/Inventory), so it talks to
  // the API directly for one page at a time rather than going through
  // useProducts() (which — correctly, for Home/Collection/the dashboard —
  // walks and returns every page).
  const [pagedProducts, setPagedProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [pagedLoading, setPagedLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setPagedLoading(true);
    setError('');
    fetchProducts({ all: true, page })
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : res?.results ?? [];
        setPagedProducts(list.map(normalizeApiProduct));
        setCount(Array.isArray(res) ? list.length : res?.count ?? list.length);
        setHasNext(Boolean(!Array.isArray(res) && res?.next));
        setPagedLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Couldn't load products.");
        setPagedLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, reloadKey]);

  const products = pagedProducts;
  const loading = pagedLoading;
  const totalCount = count;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const canPrev = page > 1;
  const canNext = hasNext;

  const refresh = () => setReloadKey((k) => k + 1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setFormOpen(true);
  };
  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    refresh();
  };

  const handleDelete = (p) => {
    if (confirm(`Delete "${p.name}"? This can't be undone.`)) {
      deleteProduct(p.id).then(refresh);
    }
  };

  const handleVisibilityToggle = (p) => {
    setProductVisibility(p.id, p.visible === false).then(refresh);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium">Products</h1>
          <p className="mt-1 text-sm text-black/50">{totalCount} total</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-md bg-black px-5 py-2.5 text-sm text-white hover:opacity-90"
        >
          + Add Product
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-black/10 bg-black/[0.02] text-xs uppercase tracking-wide text-black/40">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Visible</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-black/40">
                  Loading products…
                </td>
              </tr>
            )}
            {!loading &&
              products.map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-10 flex-shrink-0 overflow-hidden rounded bg-black/5">
                        {getThumbUrl(p.images?.[0]) && (
                          <img
                            src={getThumbUrl(p.images[0])}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                      </div>
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-black/60">{p.category || '—'}</td>
                  <td className="px-4 py-3 font-mono">
                    {p.originalPrice ? (
                      <>
                        <span className="mr-2 text-black/40 line-through">
                          {p.originalPrice.toLocaleString()}
                        </span>
                        {p.price.toLocaleString()}
                      </>
                    ) : (
                      p.price.toLocaleString()
                    )}{' '}
                    {p.currency}
                  </td>
                  <td className="px-4 py-3">{p.stock ?? 0}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleVisibilityToggle(p)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        p.visible === false
                          ? 'bg-black/10 text-black/50'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {p.visible === false ? 'Hidden' : 'Visible'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(p)}
                      className="mr-3 text-black/50 hover:text-black"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="text-red-500/70 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-black/40">
                  No products yet. Click "+ Add Product" to create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalCount > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-black/40">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-black/15 px-3 py-1.5 disabled:opacity-30"
            >
              Previous
            </button>
            <button
              disabled={!canNext}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-black/15 px-3 py-1.5 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {formOpen && <ProductForm product={editing} onClose={closeForm} />}
    </div>
  );
}
