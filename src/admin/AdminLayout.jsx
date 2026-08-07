import { useEffect, useRef, useState, Suspense } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { subscribeOrders } from '../lib/db/orders';
import { useAdminAuth } from '../context/AdminAuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import PageLoader from '../components/PageLoader';

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/inventory', label: 'Inventory' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/categories', label: 'Categories' },
];

export default function AdminLayout() {
  const { signOut, user } = useAdminAuth();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState(null);
  const knownIds = useRef(null); // null = first snapshot not yet seen

  useEffect(() => {
    const unsub = subscribeOrders((list) => {
      if (knownIds.current) {
        const newOnes = list.filter((o) => !knownIds.current.has(o.id));
        if (newOnes.length > 0) {
          setToast(newOnes[0]);
          setTimeout(() => setToast(null), 5000);
        }
      }
      knownIds.current = new Set(list.map((o) => o.id));
      setOrders(list);
    });
    return unsub;
  }, []);

  const unreadCount = orders.filter((o) => !o.read).length;

  return (
    <div className="flex min-h-screen bg-[#F5F5F4] font-body text-[#0A0A0B]">
      <aside className="flex w-60 flex-shrink-0 flex-col border-r border-black/10 bg-[#0B0B0D] text-white">
        <div className="border-b border-white/10 px-6 py-6">
          <p className="font-display text-xl">EON</p>
          <p className="mt-0.5 text-xs tracking-[0.2em] text-white/40">ADMIN</p>
        </div>
        <nav className="flex-1 px-3 py-6">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `mb-1 flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span>{item.label}</span>
              {item.to === '/admin/orders' && unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-medium text-white">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-4 py-4">
          <p className="truncate text-xs text-white/40">{user?.username}</p>
          <button
            onClick={signOut}
            className="mt-2 w-full rounded-md border border-white/15 px-3 py-2 text-xs text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {/* Section-level boundary: an error in one admin page (Reports,
            Products, etc.) no longer takes the whole dashboard — sidebar,
            nav, sign-out — down with it. Keyed by pathname so switching
            pages clears a tripped boundary automatically. Suspense is
            nested *inside* here (rather than relying only on the outer
            one in App.jsx) so navigating between admin pages only shows
            the loading state in this content area — the sidebar and nav
            stay mounted and interactive the whole time. */}
        <ErrorBoundary variant="section" label="page" resetKey={location.pathname}>
          <Suspense fallback={<PageLoader variant="admin" />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* new-order toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-80 rounded-lg border border-black/10 bg-white p-4 shadow-xl"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-blue-600">
              New Order
            </p>
            <p className="mt-1 text-sm font-medium">{toast.customer?.name}</p>
            <p className="mt-0.5 text-xs text-black/50">
              {toast.displayId} — {toast.subtotal?.toLocaleString()} {toast.currency}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
