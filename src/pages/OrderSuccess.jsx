import { useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const total = Number(searchParams.get('total'));

  // Fires Meta's "Purchase" conversion event — this is the event the
  // ad account actually optimizes/reports against, distinct from the
  // PageView that fires on every page via the pixel snippet in
  // index.html. The order value travels in the URL (?total=...) rather
  // than router navigation state, because state doesn't survive a page
  // refresh or a direct link open — losing it silently sent `value:
  // undefined` to Meta, which is what caused the "Parameter 'currency'
  // is invalid" console warning (Meta rejects the event when value is
  // missing, and reports it against the neighboring currency param).
  // Guarded by orderId in sessionStorage so a refresh (or revisiting
  // this URL later) never double-counts the same order as two purchases.
  useEffect(() => {
    if (!orderId || !total || typeof window === 'undefined' || typeof window.fbq !== 'function') return;
    const key = `eon_purchase_tracked_${orderId}`;
    if (sessionStorage.getItem(key)) return;
    window.fbq('track', 'Purchase', {
      value: total,
      currency: 'EGP',
      content_ids: [orderId],
    });
    sessionStorage.setItem(key, '1');
  }, [orderId, total]);

  return (
    <PageTransition>
      <section className="mx-auto flex min-h-[80vh] max-w-[1600px] flex-col items-center justify-center px-6 text-center md:px-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-electric text-electric"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 12.5l5 5L20 6.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>

        <p className="eyebrow mt-8 text-electric">Order Submitted Successfully</p>
        <h1 className="font-display mt-4 text-4xl font-medium md:text-6xl">
          Thank You
        </h1>
        <p className="mt-6 max-w-md text-ink-soft">
          Your order has been received. We'll contact you shortly to
          confirm the details.
        </p>

        <div className="mt-8 border border-line px-8 py-4">
          <p className="eyebrow text-gray-mid">Order ID</p>
          <p className="font-mono mt-1 text-xl tracking-wider">{orderId}</p>
        </div>

        <Link
          to="/collection"
          className="eyebrow mt-10 border border-ink px-8 py-4 hover:bg-ink hover:text-bg"
        >
          Continue Shopping
        </Link>
      </section>
    </PageTransition>
  );
}
