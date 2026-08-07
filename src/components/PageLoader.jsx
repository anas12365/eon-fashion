import { motion } from 'framer-motion';

// Suspense fallback for lazy-loaded route chunks (see App.jsx,
// admin/AdminLayout.jsx). A lazy chunk that's already cached by the
// browser can resolve in a handful of milliseconds, so this fades in on
// a short delay rather than appearing instantly — a chunk that loads
// before the delay elapses is swapped for the real page before the
// loader ever became visible, avoiding a flash of "Loading…" on fast
// navigations while still giving a slower load something to show.
//
// `variant="admin"` matches the dark sidebar shell's loading style
// (see admin/ProtectedRoute.jsx); the default matches the storefront's
// light theme and `eyebrow`/`font-mono` type treatment used throughout
// (see components/Navbar.jsx, pages/Home.jsx).
export default function PageLoader({ variant = 'public' }) {
  if (variant === 'admin') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F5F5F4]">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.25 }}
          className="font-mono text-xs tracking-[0.2em] text-black/40"
        >
          LOADING…
        </motion.p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60svh] items-center justify-center bg-bg">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.25 }}
        className="eyebrow text-gray-mid"
      >
        Loading…
      </motion.p>
    </div>
  );
}
