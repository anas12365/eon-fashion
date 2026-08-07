import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { subscribeOrders } from '../lib/db/orders';
import { fetchAnalyticsSummary } from '../services/api';

const STATUS_COLORS = {
  Pending: 'bg-amber-400',
  Confirmed: 'bg-blue-400',
  Preparing: 'bg-purple-400',
  Shipped: 'bg-indigo-400',
  Delivered: 'bg-green-500',
  Cancelled: 'bg-red-400',
};

export default function AdminDashboard() {
  const { products } = useProducts({ admin: true });
  const [orders, setOrders] = useState([]);

  useEffect(() => subscribeOrders(setOrders), []);

  const pending = orders.filter((o) => o.status === 'Pending').length;
  const unread = orders.filter((o) => !o.read).length;
  const visibleProducts = products.filter((p) => p.visible !== false).length;

  // Revenue, best sellers, and the status breakdown are computed
  // server-side from Order/OrderItem/Product (see
  // backend/analytics/views.py).
  const [analytics, setAnalytics] = useState(null);
  const [analyticsError, setAnalyticsError] = useState('');

  useEffect(() => {
    fetchAnalyticsSummary()
      .then(setAnalytics)
      .catch(() => setAnalyticsError("Couldn't load analytics."));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-medium">Dashboard</h1>
      <p className="mt-1 text-sm text-black/50">Live overview of your store.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Products" value={products.length} sub={`${visibleProducts} visible`} />
        <Stat label="Orders" value={orders.length} />
        <Stat label="Pending" value={pending} accent />
        <Stat label="Unread" value={unread} accent />
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          to="/admin/products"
          className="rounded-md bg-black px-5 py-3 text-sm text-white hover:opacity-90"
        >
          Manage Products
        </Link>
        <Link
          to="/admin/orders"
          className="rounded-md border border-black/15 px-5 py-3 text-sm hover:bg-black/5"
        >
          View Orders
        </Link>
        <Link
          to="/admin/customers"
          className="rounded-md border border-black/15 px-5 py-3 text-sm hover:bg-black/5"
        >
          View Customers
        </Link>
      </div>

      <div className="mt-10">
          <h2 className="text-lg font-medium">Analytics</h2>

          {analyticsError && <p className="mt-3 text-sm text-red-500">{analyticsError}</p>}

          {!analytics && !analyticsError && (
            <p className="mt-3 text-sm text-black/40">Loading analytics…</p>
          )}

          {analytics && (
            <>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <Stat
                  label="Revenue"
                  value={`${Number(analytics.revenue).toLocaleString()} EGP`}
                  sub="Excludes cancelled orders"
                />
                <Stat label="Customers" value={analytics.customers_count} />
                <Stat
                  label="Products"
                  value={analytics.products_count}
                  sub={`${analytics.visible_products_count} visible`}
                />
                <Stat label="Orders (all time)" value={analytics.orders_count} />
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-black/10 bg-white p-5">
                  <p className="text-xs uppercase tracking-wider text-black/40">
                    Orders by status
                  </p>
                  <div className="mt-4 space-y-3">
                    {Object.entries(analytics.orders_by_status).map(([label, value]) => {
                      const max = Math.max(1, ...Object.values(analytics.orders_by_status));
                      return (
                        <div key={label}>
                          <div className="flex items-center justify-between text-xs text-black/60">
                            <span>{label}</span>
                            <span className="font-mono">{value}</span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/5">
                            <div
                              className={`h-full rounded-full ${STATUS_COLORS[label] || 'bg-black/30'}`}
                              style={{ width: `${(value / max) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg border border-black/10 bg-white p-5">
                  <p className="text-xs uppercase tracking-wider text-black/40">Best sellers</p>
                  {analytics.best_sellers.length === 0 && (
                    <p className="mt-4 text-sm text-black/40">No sales yet.</p>
                  )}
                  <div className="mt-4 space-y-3">
                    {analytics.best_sellers.map((p, i) => {
                      const max = Math.max(1, ...analytics.best_sellers.map((x) => x.quantity_sold));
                      return (
                        <div key={p.product_id ?? i}>
                          <div className="flex items-center justify-between text-xs text-black/60">
                            <span className="truncate pr-2">{p.product_name}</span>
                            <span className="font-mono whitespace-nowrap">
                              {p.quantity_sold} sold
                            </span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/5">
                            <div
                              className="h-full rounded-full bg-black/70"
                              style={{ width: `${(p.quantity_sold / max) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-5">
      <p className="text-xs uppercase tracking-wider text-black/40">{label}</p>
      <p className={`mt-2 text-3xl font-medium ${accent && value > 0 ? 'text-blue-600' : ''}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-black/40">{sub}</p>}
    </div>
  );
}
