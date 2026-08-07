import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { recommendSize, SIZE_CHART } from '../utils/sizeRecommendation';

export default function SizeGuide() {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const rec = recommendSize(height, weight);
    if (!rec) {
      setError('Enter a realistic height (120–220cm) and weight (30–180kg).');
      setResult(null);
      return;
    }
    setError('');
    setResult(rec);
  };

  return (
    <PageTransition>
      <section className="mx-auto max-w-[1600px] px-6 pt-36 pb-16 md:px-10">
        <p className="eyebrow text-electric">Fit Assistant</p>
        <h1 className="font-display mt-4 max-w-2xl text-5xl font-medium leading-[1.02] md:text-6xl">
          Find your size
        </h1>
        <p className="mt-6 max-w-lg text-ink-soft">
          Enter your height and weight and we'll recommend a starting size
          across the EON range. This is a guide, not a guarantee — check the
          full chart below for exact measurements.
        </p>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 pb-24 md:px-10">
        <div className="grid gap-12 md:grid-cols-2">
          <form
            onSubmit={handleSubmit}
            className="border border-line p-8 md:p-10"
          >
            <div>
              <label className="eyebrow text-gray-mid" htmlFor="height">
                Height (cm)
              </label>
              <input
                id="height"
                type="number"
                inputMode="numeric"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 180"
                className="mt-2 w-full border-b border-line bg-transparent py-3 font-mono text-lg outline-none focus:border-electric"
                required
              />
            </div>
            <div className="mt-8">
              <label className="eyebrow text-gray-mid" htmlFor="weight">
                Weight (kg)
              </label>
              <input
                id="weight"
                type="number"
                inputMode="numeric"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 75"
                className="mt-2 w-full border-b border-line bg-transparent py-3 font-mono text-lg outline-none focus:border-electric"
                required
              />
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="eyebrow mt-10 w-full bg-ink py-4 text-bg transition-opacity hover:opacity-85"
            >
              Calculate My Size
            </button>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 border border-electric bg-electric-soft p-6 text-center"
                >
                  <p className="eyebrow text-electric-deep">Recommended Size</p>
                  <p className="font-display mt-2 text-5xl font-bold text-electric-deep">
                    {result.size}
                  </p>
                  <p className="font-mono mt-2 text-xs text-ink-soft">
                    Estimated fit index {result.bmi}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div>
            <p className="eyebrow text-gray-mid">Full Size Chart (cm)</p>
            <table className="mt-4 w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-ink">
                  <th className="font-mono py-3 text-xs text-gray-mid">Size</th>
                  <th className="font-mono py-3 text-xs text-gray-mid">Chest</th>
                  <th className="font-mono py-3 text-xs text-gray-mid">Waist</th>
                  <th className="font-mono py-3 text-xs text-gray-mid">Height</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_CHART.map((row) => (
                  <tr
                    key={row.size}
                    className={`border-b border-line ${
                      result?.size === row.size ? 'bg-electric-soft' : ''
                    }`}
                  >
                    <td className="font-mono py-3 text-sm font-medium">{row.size}</td>
                    <td className="font-mono py-3 text-sm text-ink-soft">{row.chest}</td>
                    <td className="font-mono py-3 text-sm text-ink-soft">{row.waist}</td>
                    <td className="font-mono py-3 text-sm text-ink-soft">{row.height}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-6 text-xs leading-relaxed text-gray-mid">
              Measurements are body measurements, not garment measurements.
              For an oversized fit (Premium Shirt), consider sizing down.
            </p>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
