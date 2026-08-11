import { Fragment, useEffect, useState } from 'react';
import { fetchCustomers, fetchCustomerDetail } from '../services/api';

const STATUS_COLORS = {
  Pending: 'bg-amber-100 text-amber-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Preparing: 'bg-purple-100 text-purple-700',
  Shipped: 'bg-indigo-100 text-indigo-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const ORDERING_OPTIONS = [
  ['-last_order_at', 'Most recent order'],
  ['-total_spent', 'Highest spend'],
  ['-orders_count', 'Most orders'],
  ['name', 'Name (A–Z)'],
];

function CustomerDetailRow({ phone }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchCustomerDetail(phone)
      .then((data) => !cancelled && setDetail(data))
      .catch(() => !cancelled && setError("Couldn't load order history."));
    return () => {
      cancelled = true;
    };
  }, [phone]);

  return (
    <tr className="border-b border-black/5 bg-black/[0.015]">
      <td colSpan={6} className="px-4 py-4">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!error && !detail && <p className="text-sm text-black/40">Loading order history…</p>}
        {detail && detail.orders.length === 0 && (
          <p className="text-sm text-black/40">No orders found.</p>
        )}
        {detail && detail.orders.length > 0 && (
          <>
            <p className="text-xs uppercase tracking-wide text-black/40">
              Order history — {detail.orders.length} order{detail.orders.length === 1 ? '' : 's'}
            </p>
            <ul className="mt-2 space-y-2">
              {detail.orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-mono text-xs text-black/50">{o.display_id}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[o.status] || 'bg-black/5'
                    }`}
                  >
                    {o.status}
                  </span>
                  <span className="font-mono">
                    {Number(o.total).toLocaleString()} {o.currency}
                  </span>
                  <span className="text-black/40">
                    {new Date(o.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </td>
    </tr>
  );
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('-last_order_at');
  const [expandedPhone, setExpandedPhone] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    const t = setTimeout(() => {
      fetchCustomers({ search: search || undefined, ordering })
        .then((data) => {
          setCustomers(data.results ?? data);
          setCount(data.count ?? (data.results ?? data).length);
        })
        .catch(() => setError("Couldn't load customers."))
        .finally(() => setLoading(false));
    }, 250); // debounce search typing
    return () => clearTimeout(t);
  }, [search, ordering]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-medium">Customers</h1>
      <p className="mt-1 text-sm text-black/50">{count} customers</p>
      <p className="mt-1 text-xs text-black/30">
        Grouped by phone number — there are no customer accounts, so this reflects everyone who
        has placed an order.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or phone…"
          className="w-64 rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30"
        />
        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30"
        >
          {ORDERING_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-black/10 bg-black/[0.02] text-xs uppercase tracking-wide text-black/40">
            <tr>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Address</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Total spent</th>
              <th className="px-4 py-3 font-medium">Last order</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-black/40">
                  Loading customers…
                </td>
              </tr>
            )}
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-black/40">
                  {search ? 'No customers match this search.' : 'No customers yet.'}
                </td>
              </tr>
            )}
            {!loading &&
              customers.map((c) => (
                <Fragment key={c.phone}>
                  <tr
                    onClick={() => setExpandedPhone(expandedPhone === c.phone ? null : c.phone)}
                    className="cursor-pointer border-b border-black/5 last:border-0 hover:bg-black/[0.02]"
                  >
                    <td className="px-4 py-3">{c.name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{c.phone}</td>
                    <td className="px-4 py-3 text-black/60">{c.address || '—'}</td>
                    <td className="px-4 py-3">{c.orders_count}</td>
                    <td className="px-4 py-3 font-mono">
                      {Number(c.total_spent).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-black/50">
                      {c.last_order_at
                        ? new Date(c.last_order_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                  {expandedPhone === c.phone && <CustomerDetailRow phone={c.phone} />}
                </Fragment>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
