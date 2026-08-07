import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const fmt = (n, c) => `${n.toLocaleString()} ${c}`;

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeItem, subtotal } =
    useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 z-[70] bg-ink/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
            className="fixed right-0 top-0 z-[80] flex h-full w-full max-w-md flex-col bg-surface"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-6">
              <h2 className="font-display text-xl font-medium">Your Bag</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                aria-label="Close cart"
                className="text-2xl leading-none text-ink-soft hover:text-electric"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="text-ink-soft">Your bag is empty.</p>
                  <Link
                    to="/collection"
                    onClick={() => setIsCartOpen(false)}
                    className="eyebrow mt-6 border border-ink px-6 py-3 hover:bg-ink hover:text-bg"
                  >
                    Explore Collection
                  </Link>
                </div>
              ) : (
                <ul className="space-y-6">
                  {items.map((item) => (
                    <li key={item.lineId} className="flex gap-4">
                      <div className="h-28 w-24 flex-shrink-0 overflow-hidden bg-gray">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-display text-sm font-medium">{item.name}</p>
                            <p className="mt-1 text-xs text-gray-mid">
                              {item.color} / {item.size}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.lineId)}
                            className="text-xs text-gray-mid hover:text-electric"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center border border-line">
                            <button
                              className="px-3 py-1 text-ink-soft hover:text-electric"
                              onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                            >
                              −
                            </button>
                            <span className="font-mono px-2 text-sm">{item.quantity}</span>
                            <button
                              className="px-3 py-1 text-ink-soft hover:text-electric"
                              onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                          <p className="font-mono text-sm">
                            {fmt(item.price * item.quantity, 'EGP')}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-line px-6 py-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">Subtotal</span>
                  <span className="font-mono text-base">{fmt(subtotal, 'EGP')}</span>
                </div>
                <Link
                  to="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="eyebrow mt-5 flex w-full items-center justify-center bg-ink py-4 text-bg transition-opacity hover:opacity-85"
                >
                  Checkout
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
