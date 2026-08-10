import { useState, useMemo, useEffect } from 'react';
import PageTransition from '../components/PageTransition';
import ProductEditorial from '../components/ProductEditorial';
import { useProducts } from '../hooks/useProducts';
import { subscribeCategories } from '../lib/db/categories';

const formatPrice = (n, c) => `${n.toLocaleString()} ${c}`;

export default function Collection() {
  const [filter, setFilter] = useState('All');
  const [categories, setCategories] = useState([]);
  const { products, loading } = useProducts();

  useEffect(() => subscribeCategories(setCategories), []);

  const filters = useMemo(
    () => ['All', ...categories.map((c) => c.name)],
    [categories]
  );

  const filtered = useMemo(() => {
    if (filter === 'All') return products;
    return products.filter((p) => p.category === filter);
  }, [filter, products]);

  return (
    <PageTransition>
      <section className="mx-auto max-w-[1600px] px-6 pt-36 pb-10 md:px-10">
        <p className="eyebrow text-electric">Full Range</p>
        <h1 className="font-display mt-4 max-w-3xl text-5xl font-medium leading-[1.02] md:text-7xl">
          The Collection
        </h1>
        <p className="mt-6 max-w-lg text-ink-soft">
          Every EON piece currently in rotation.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`eyebrow border px-5 py-2.5 transition-colors ${
                filter === f
                  ? 'border-ink bg-ink text-bg'
                  : 'border-line text-ink-soft hover:border-ink hover:text-ink'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 md:px-10">
        {filtered.map((product, i) => (
          <ProductEditorial
            key={product.id}
            product={product}
            index={i}
            formatPrice={formatPrice}
          />
        ))}
        {filtered.length === 0 && !loading && (
          <p className="border-t border-line py-24 text-center text-ink-soft">
            No pieces match that colorway yet.
          </p>
        )}
      </section>
    </PageTransition>
  );
}
