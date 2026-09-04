import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { useCart } from '../context/CartContext';
import { createOrder } from '../lib/db/orders';

const fmt = (n) => `${n.toLocaleString()} EGP`;

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCart();
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', notes: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setCustomer((c) => ({ ...c, [e.target.name]: e.target.value }));

  const handleCheckout = async () => {
    if (submitting) return;
    if (items.length === 0) {
      setError('Your bag is empty.');
      return;
    }
    if (!customer.name || !customer.phone || !customer.address) {
      setError('Fill in your name, phone, and address to continue.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { displayId } = await createOrder({
        customer,
        items,
        subtotal,
        currency: 'EGP',
      });
      clearCart();
      navigate(`/order-success/${displayId}`, { state: { total: subtotal } });
    } catch (err) {
      // Surface real validation messages (e.g. "only 3 left in stock")
      // when the backend provides one, instead of only a generic
      // message — same error element, just more useful text in it.
      setError(err?.message || 'Something went wrong placing your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <PageTransition>
        <section className="mx-auto flex min-h-[70vh] max-w-[1600px] flex-col items-center justify-center px-6 text-center md:px-10">
          <p className="eyebrow text-electric">Your Bag</p>
          <h1 className="font-display mt-4 text-4xl font-medium md:text-5xl">
            It's empty in here.
          </h1>
          <Link
            to="/collection"
            className="eyebrow mt-8 border border-ink px-8 py-4 hover:bg-ink hover:text-bg"
          >
            Explore Collection
          </Link>
        </section>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <section className="mx-auto max-w-[1600px] px-6 pt-36 pb-24 md:px-10">
        <p className="eyebrow text-electric">Checkout</p>
        <h1 className="font-display mt-4 text-5xl font-medium md:text-6xl">Your Bag</h1>

        <div className="mt-14 grid gap-16 md:grid-cols-[1.3fr_1fr]">
          {/* Items */}
          <div>
            <ul className="divide-y divide-line border-y border-line">
              {items.map((item) => (
                <li key={item.lineId} className="flex gap-5 py-6">
                  <div className="h-32 w-24 flex-shrink-0 overflow-hidden bg-gray">
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
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-display text-lg">{item.name}</p>
                        <p className="mt-1 text-sm text-gray-mid">
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-line">
                        <button
                          className="px-3 py-1.5 text-ink-soft hover:text-electric"
                          onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="font-mono px-3 text-sm">{item.quantity}</span>
                        <button
                          className="px-3 py-1.5 text-ink-soft hover:text-electric"
                          onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <p className="font-mono text-base">{fmt(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <button
              onClick={clearCart}
              className="mt-6 text-xs text-gray-mid underline hover:text-electric"
            >
              Clear bag
            </button>
          </div>

          {/* Checkout form */}
          <div>
            <div className="border border-line p-8">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">Subtotal</span>
                <span className="font-mono text-lg">{fmt(subtotal)}</span>
              </div>
              <p className="mt-2 text-xs text-gray-mid">
                Shipping calculated at delivery. Cash on Delivery only.
              </p>

              <div className="mt-8 space-y-5">
                <Field label="Full name" name="name" value={customer.name} onChange={handleChange} />
                <Field label="Phone number" name="phone" value={customer.phone} onChange={handleChange} type="tel" />
                <Field label="Delivery address" name="address" value={customer.address} onChange={handleChange} textarea />
                <Field label="Order notes (optional)" name="notes" value={customer.notes} onChange={handleChange} textarea />
              </div>

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              <button
                onClick={handleCheckout}
                disabled={submitting}
                aria-busy={submitting}
                className="eyebrow mt-8 flex w-full items-center justify-center gap-3 bg-electric py-4 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Placing Order…' : 'Place Order'}
              </button>
              <p className="mt-4 text-center text-xs text-gray-mid">
                We'll contact you to confirm — nothing is charged automatically.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}

function Field({ label, name, value, onChange, type = 'text', textarea = false }) {
  return (
    <div>
      <label className="eyebrow text-gray-mid" htmlFor={name}>
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          rows={2}
          className="mt-2 w-full resize-none border-b border-line bg-transparent py-3 outline-none focus:border-electric"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className="mt-2 w-full border-b border-line bg-transparent py-3 outline-none focus:border-electric"
        />
      )}
    </div>
  );
}
