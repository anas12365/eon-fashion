import { Fragment, useEffect, useState } from 'react';
import { fetchInventory, updateInventoryStock, fetchInventoryHistory } from '../services/api';

const STATUS_STYLES = {
  in_stock: 'bg-green-100 text-green-700',
  low_stock: 'bg-amber-100 text-amber-700',
  out_of_stock: 'bg-red-100 text-red-600',
};
const STATUS_LABELS = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
};

function HistoryRow({ productId }) {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchInventoryHistory(productId)
      .then((data) => !cancelled && setHistory(data.results ?? data))
      .catch(() => !cancelled && setError("Couldn't load history."));
    return () => {
      cancelled = true;
    };
  }, [productId]);

  return (
    <tr className="border-b border-black/5 bg-black/[0.015]">
      <td colSpan={6} className="px-4 py-3">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!error && !history && <p className="text-sm text-black/40">Loading history…</p>}
        {history && history.length === 0 && (
          <p className="text-sm text-black/40">No stock changes recorded yet.</p>
        )}
        {history && history.length > 0 && (
          <ul className="space-y-1.5 text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-3 text-black/60">
                <span className="font-mono">
                  {h.old_quantity} → {h.new_quantity}
                </span>
                <span className={h.delta >= 0 ? 'text-green-600' : 'text-red-500'}>
                  ({h.delta >= 0 ? '+' : ''}
                  {h.delta})
                </span>
                <span className="text-black/40">
                  {new Date(h.created_at).toLocaleString()}
                  {h.changed_by ? ` · ${h.changed_by}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </td>
    </tr>
  );
}

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | low_stock | out_of_stock
  const [editingId, setEditingId] = useState(null);
  const [draftStock, setDraftStock] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    fetchInventory({
      search: search || undefined,
      lowStock: filter === 'low_stock',
      outOfStock: filter === 'out_of_stock',
    })
      .then((data) => {
        setItems(data.results ?? data);
        setCount(data.count ?? (data.results ?? data).length);
      })
      .catch(() => setError("Couldn't load inventory."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search typing
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter]);

  const startEdit = (item) => {
    setEditingId(item.id);
    setDraftStock(String(item.stock));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftStock('');
  };

  const saveStock = async (item) => {
    const value = Number(draftStock);
    if (Number.isNaN(value) || value < 0) return;
    setSaving(true);
    try {
      const updated = await updateInventoryStock(item.id, { stock: value });
      setItems((list) => list.map((p) => (p.id === item.id ? updated : p)));
      cancelEdit();
    } catch {
      setError("Couldn't update stock — please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium">Inventory</h1>
          <p className="mt-1 text-sm text-black/50">{count} products</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-64 rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30"
        />
        <div className="flex rounded-md border border-black/10 p-0.5 text-sm">
          {[
            ['all', 'All'],
            ['low_stock', 'Low stock'],
            ['out_of_stock', 'Out of stock'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded px-3 py-1.5 ${
                filter === value ? 'bg-black text-white' : 'text-black/60 hover:text-black'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-black/10 bg-black/[0.02] text-xs uppercase tracking-wide text-black/40">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <Fragment key={item.id}>
                <tr className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-10 flex-shrink-0 overflow-hidden rounded bg-black/5">
                        {item.image && (
                          <img
                            src={item.image}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                      </div>
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-black/60">{item.category || '—'}</td>
                  <td className="px-4 py-3">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={draftStock}
                          onChange={(e) => setDraftStock(e.target.value)}
                          className="w-20 rounded border border-black/20 px-2 py-1 font-mono"
                          autoFocus
                        />
                        <button
                          onClick={() => saveStock(item)}
                          disabled={saving}
                          className="text-xs text-green-600 hover:text-green-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button onClick={cancelEdit} className="text-xs text-black/40 hover:text-black">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(item)}
                        className="font-mono hover:underline"
                        title="Click to update stock"
                      >
                        {item.stock}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[item.status]}`}
                    >
                      {STATUS_LABELS[item.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-black/40">
                    {new Date(item.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="text-black/50 hover:text-black"
                    >
                      {expandedId === item.id ? 'Hide history' : 'History'}
                    </button>
                  </td>
                </tr>
                {expandedId === item.id && <HistoryRow productId={item.id} />}
              </Fragment>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-black/40">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
