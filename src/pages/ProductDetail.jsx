import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { useProduct, useRelatedProducts } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import { getLargeUrl, getThumbUrl } from '../lib/images';

const formatPrice = (n, c) => `${n.toLocaleString()} ${c}`;

export default function ProductDetail() {
  const { id } = useParams();
  const { product, loading } = useProduct(id);
  const { related: otherProducts } = useRelatedProducts(product);
  const { addItem } = useCart();

  const [activeImage, setActiveImage] = useState(0);
  const [color, setColor] = useState(null);
  const [size, setSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (product && !color) setColor(product.colors?.[0] ?? null);
  }, [product, color]);

  if (loading) return null;
  if (!product) return <Navigate to="/collection" replace />;

  const handleAdd = () => {
    if (!size) {
      setError('Select a size before adding to bag.');
      return;
    }
    setError('');
    addItem(product, { size, color, quantity });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <PageTransition>
      <section className="mx-auto max-w-[1600px] px-6 pt-32 pb-24 md:px-10">
        <p className="eyebrow mb-8 text-gray-mid">
          <Link to="/collection" className="hover:text-electric">Collection</Link>
          <span className="mx-2">/</span>
          {product.name}
        </p>

        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          {/* Gallery */}
          <div>
            <div className="relative aspect-[4/5] overflow-hidden bg-gray">
              <AnimatePresence mode="wait">
                {getLargeUrl(product.images[activeImage]) && (
                  <motion.img
                    key={activeImage}
                    src={getLargeUrl(product.images[activeImage])}
                    alt={product.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </AnimatePresence>
            </div>
            <div className="mt-4 flex gap-3">
              {product.images.map((img, i) => {
                const src = getThumbUrl(img);
                if (!src) return null;
                return (
                  <button
                    key={src}
                    onClick={() => setActiveImage(i)}
                    className={`h-20 w-16 overflow-hidden border transition-colors ${
                      activeImage === i ? 'border-ink' : 'border-line'
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info */}
          <div className="max-w-md">
            <p className="eyebrow text-electric">{product.tag}</p>
            <h1 className="font-display mt-3 text-4xl font-medium md:text-5xl">
              {product.name}
            </h1>
            <p className="font-mono mt-4 text-xl">
              {formatPrice(product.price, product.currency)}
            </p>
            <p className="mt-6 text-ink-soft leading-relaxed">{product.description}</p>

            {/* Color */}
            <div className="mt-8">
              <p className="eyebrow text-gray-mid">Color — {color}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`border px-4 py-2 text-sm transition-colors ${
                      color === c
                        ? 'border-ink bg-ink text-bg'
                        : 'border-line text-ink-soft hover:border-ink'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <p className="eyebrow text-gray-mid">Size</p>
                <Link to="/size-guide" className="text-xs text-ink-soft underline hover:text-electric">
                  Size guide
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSize(s);
                      setError('');
                    }}
                    className={`font-mono h-11 w-11 border text-sm transition-colors ${
                      size === s
                        ? 'border-ink bg-ink text-bg'
                        : 'border-line text-ink-soft hover:border-ink'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-8">
              <p className="eyebrow text-gray-mid">Quantity</p>
              <div className="mt-3 flex w-fit items-center border border-line">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 text-ink-soft hover:text-electric"
                >
                  −
                </button>
                <span className="font-mono w-10 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-4 py-2 text-ink-soft hover:text-electric"
                >
                  +
                </button>
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <button
              onClick={handleAdd}
              className="eyebrow mt-8 flex w-full items-center justify-center gap-3 bg-ink py-4 text-bg transition-opacity hover:opacity-85"
            >
              {added ? 'Added to Bag ✓' : 'Add to Cart'}
            </button>

            <ul className="mt-10 space-y-2 border-t border-line pt-6">
              {product.details.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-ink-soft">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 bg-electric" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* You may also like */}
      <section className="border-t border-line bg-surface py-20">
        <div className="mx-auto max-w-[1600px] px-6 md:px-10">
          <p className="eyebrow text-electric">Complete the Look</p>
          <h2 className="font-display mt-3 text-3xl font-medium md:text-4xl">
            More from EON
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
            {otherProducts.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className="group block">
                <div className="aspect-[4/5] overflow-hidden bg-gray">
                  {getThumbUrl(p.images[0]) && (
                    <img
                      src={getThumbUrl(p.images[0])}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>
                <p className="font-display mt-4 text-lg">{p.name}</p>
                <p className="font-mono mt-1 text-sm text-ink-soft">
                  {formatPrice(p.price, p.currency)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
