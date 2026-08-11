import { useEffect, useState } from 'react';
import {
  fetchSalesReport,
  fetchOrdersReport,
  fetchInventoryReport,
  fetchProductsReport,
  exportRowsAsCsv,
} from '../services/api';

const STATUS_COLORS = {
  Pending: 'bg-amber-400',
  Confirmed: 'bg-blue-400',
  Preparing: 'bg-purple-400',
  Shipped: 'bg-indigo-400',
  Delivered: 'bg-green-500',
  Cancelled: 'bg-red-400',
};

const TABS = [
  { id: 'sales', label: 'Sales' },
  { id: 'orders', label: 'Orders' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'products', label: 'Product Performance' },
];

function money(v) {
  return `${Number(v ?? 0).toLocaleString()} EGP`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-5">
      <p className="text-xs uppercase tracking-wider text-black/40">{label}</p>
      <p className="mt-2 text-3xl font-medium">{value}</p>
      {sub && <p className="mt-1 text-xs text-black/40">{sub}</p>}
    </div>
  );
}

function DateFilterBar({ dateFrom, dateTo, setDateFrom, setDateTo, onExport, exportDisabled }) {
  return (
    <div className="mt-6 flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-black/40">From</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-black/40">To</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30"
        />
      </div>
      {(dateFrom || dateTo) && (
        <button
          onClick={() => {
            setDateFrom('');
            setDateTo('');
          }}
          className="rounded-md border border-black/15 px-3 py-2 text-xs text-black/60 hover:bg-black/5"
        >
          Clear
        </button>
      )}
      <button
        onClick={onExport}
        disabled={exportDisabled}
        className="ml-auto rounded-md bg-black px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-30"
      >
        Export CSV
      </button>
    </div>
  );
}

function SalesReport({ dateFrom, dateTo, setDateFrom, setDateTo }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    setError('');
    fetchSalesReport({ dateFrom, dateTo })
      .then(setData)
      .catch(() => setError("Couldn't load the sales report."));
  }, [dateFrom, dateTo]);

  const handleExport = () => {
    if (!data) return;
    exportRowsAsCsv('sales-report.csv', data.trend);
  };

  return (
    <div>
      <DateFilterBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        setDateFrom={setDateFrom}
        setDateTo={setDateTo}
        onExport={handleExport}
        exportDisabled={!data || data.trend.length === 0}
      />

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      {!data && !error && <p className="mt-6 text-sm text-black/40">Loading…</p>}

      {data && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat label="Total revenue" value={money(data.total_revenue)} sub="Excludes cancelled orders" />
            <Stat label="Orders" value={data.orders_count} />
            <Stat label="Average order value" value={money(data.average_order_value)} />
          </div>

          <div className="mt-6 rounded-lg border border-black/10 bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-black/40">Revenue trend</p>
            {data.trend.length === 0 && (
              <p className="mt-4 text-sm text-black/40">No revenue in this range.</p>
            )}
            {data.trend.length > 0 && (
              <div className="mt-4 space-y-2">
                {data.trend.map((row) => {
                  const max = Math.max(1, ...data.trend.map((r) => Number(r.revenue)));
                  return (
                    <div key={row.date}>
                      <div className="flex items-center justify-between text-xs text-black/60">
                        <span>{fmtDate(row.date)}</span>
                        <span className="font-mono">
                          {money(row.revenue)} · {row.orders_count} order{row.orders_count === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/5">
                        <div
                          className="h-full rounded-full bg-black/70"
                          style={{ width: `${(Number(row.revenue) / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function OrdersReport({ dateFrom, dateTo, setDateFrom, setDateTo }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    setError('');
    fetchOrdersReport({ dateFrom, dateTo })
      .then(setData)
      .catch(() => setError("Couldn't load the orders report."));
  }, [dateFrom, dateTo]);

  const handleExport = () => {
    if (!data) return;
    const rows = Object.entries(data.status_breakdown).map(([status, count]) => ({
      status,
      count,
    }));
    exportRowsAsCsv('orders-report.csv', rows);
  };

  return (
    <div>
      <DateFilterBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        setDateFrom={setDateFrom}
        setDateTo={setDateTo}
        onExport={handleExport}
        exportDisabled={!data}
      />

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      {!data && !error && <p className="mt-6 text-sm text-black/40">Loading…</p>}

      {data && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat label="Total orders" value={data.total_orders} />
            <Stat label="Completed" value={data.completed_orders} />
            <Stat label="Cancelled" value={data.cancelled_orders} />
          </div>

          <div className="mt-6 rounded-lg border border-black/10 bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-black/40">Status breakdown</p>
            <div className="mt-4 space-y-3">
              {Object.entries(data.status_breakdown).map(([label, value]) => {
                const max = Math.max(1, ...Object.values(data.status_breakdown));
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
        </>
      )}
    </div>
  );
}

function InventoryReport() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInventoryReport()
      .then(setData)
      .catch(() => setError("Couldn't load the inventory report."));
  }, []);

  const handleExport = () => {
    if (!data) return;
    exportRowsAsCsv('inventory-report.csv', data.low_stock_products);
  };

  return (
    <div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleExport}
          disabled={!data || data.low_stock_products.length === 0}
          className="rounded-md bg-black px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-30"
        >
          Export CSV
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      {!data && !error && <p className="mt-6 text-sm text-black/40">Loading…</p>}

      {data && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Total products" value={data.total_products} />
            <Stat label="Total stock units" value={data.total_stock_units} />
            <Stat label="Inventory value" value={money(data.inventory_value)} />
            <Stat
              label="Low / out of stock"
              value={`${data.low_stock_count} / ${data.out_of_stock_count}`}
            />
          </div>

          <div className="mt-6 overflow-x-auto rounded-lg border border-black/10 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-black/10 bg-black/[0.02] text-xs uppercase tracking-wide text-black/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {data.low_stock_products.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-black/40">
                      No low-stock products.
                    </td>
                  </tr>
                )}
                {data.low_stock_products.map((p) => (
                  <tr key={p.id} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3 text-black/60">{p.category || '—'}</td>
                    <td className="px-4 py-3 font-mono">{p.stock}</td>
                    <td className="px-4 py-3 font-mono text-black/50">{p.low_stock_threshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ProductsReport({ dateFrom, dateTo, setDateFrom, setDateTo }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    setError('');
    fetchProductsReport({ dateFrom, dateTo, limit: 100 })
      .then(setData)
      .catch(() => setError("Couldn't load the product performance report."));
  }, [dateFrom, dateTo]);

  const handleExport = () => {
    if (!data) return;
    exportRowsAsCsv('product-performance-report.csv', data.products);
  };

  return (
    <div>
      <DateFilterBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        setDateFrom={setDateFrom}
        setDateTo={setDateTo}
        onExport={handleExport}
        exportDisabled={!data || data.products.length === 0}
      />

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      {!data && !error && <p className="mt-6 text-sm text-black/40">Loading…</p>}

      {data && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-black/10 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-black/10 bg-black/[0.02] text-xs uppercase tracking-wide text-black/40">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Quantity sold</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.products.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-black/40">
                    No sales in this range.
                  </td>
                </tr>
              )}
              {data.products.map((p, i) => (
                <tr key={p.product_id ?? i} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 text-black/40">{i + 1}</td>
                  <td className="px-4 py-3">{p.product_name}</td>
                  <td className="px-4 py-3 font-mono">{p.quantity_sold}</td>
                  <td className="px-4 py-3 font-mono">{money(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminReports() {
  const [tab, setTab] = useState('sales');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-medium">Reports</h1>
      <p className="mt-1 text-sm text-black/50">
        Sales, orders, inventory, and product performance — computed live from your store data.
      </p>

      <div className="mt-6 flex gap-1 border-b border-black/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-4 py-2.5 text-sm transition-colors ${
              tab === t.id
                ? 'border-black text-black'
                : 'border-transparent text-black/40 hover:text-black/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sales' && (
        <SalesReport dateFrom={dateFrom} dateTo={dateTo} setDateFrom={setDateFrom} setDateTo={setDateTo} />
      )}
      {tab === 'orders' && (
        <OrdersReport dateFrom={dateFrom} dateTo={dateTo} setDateFrom={setDateFrom} setDateTo={setDateTo} />
      )}
      {tab === 'inventory' && <InventoryReport />}
      {tab === 'products' && (
        <ProductsReport dateFrom={dateFrom} dateTo={dateTo} setDateFrom={setDateFrom} setDateTo={setDateTo} />
      )}
    </div>
  );
}
