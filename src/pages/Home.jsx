import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import PageTransition from '../components/PageTransition';
import InfinityBackground from '../components/InfinityBackground';
import ProductEditorial from '../components/ProductEditorial';
import { useProducts } from '../hooks/useProducts';

const formatPrice = (n, c) => `${n.toLocaleString()} ${c}`;

export default function Home() {
  const heroRef = useRef(null);
  const { products } = useProducts();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.hero-line',
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.2 }
      );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <PageTransition>
      {/* HERO */}
      <section
        ref={heroRef}
        className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden pt-32"
      >
        <InfinityBackground />

        <div className="relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-center px-6 md:px-10">
          <p className="eyebrow hero-line text-electric">EON — SS26 Drop</p>
          <h1 className="font-display mt-4 break-words text-[clamp(2.25rem,11vw,10rem)] font-bold leading-[0.92] tracking-tight text-ink">
            <span className="hero-line block">EON</span>
            <span className="hero-line block text-electric">ENDLESS</span>
            <span className="hero-line block">COLLECTION</span>
          </h1>

          <div className="hero-line mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <a
              href="#featured"
              className="eyebrow group flex items-center gap-3 bg-ink px-8 py-4 text-bg transition-opacity hover:opacity-85"
            >
              Explore
              <span className="transition-transform duration-300 group-hover:translate-y-0.5">
                ↓
              </span>
            </a>
            <p className="max-w-xs text-sm text-ink-soft">
              Three foundation pieces. Cut for movement, built to outlast the
              season.
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="relative mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 pb-8 md:px-10"
        >
          <p className="font-mono text-xs text-gray-mid">01 / 03</p>
          <p className="eyebrow text-gray-mid hidden sm:block">Scroll to explore</p>
          <p className="font-mono text-xs text-gray-mid">Cairo, EG</p>
        </motion.div>
      </section>

      {/* FEATURED — editorial alternating layout */}
      <section id="featured" className="relative mx-auto max-w-[1600px] px-6 md:px-10">
        <div className="border-b border-line pb-8 pt-20">
          <p className="eyebrow text-electric">The Foundation</p>
          <h2 className="font-display mt-4 max-w-2xl text-4xl font-medium leading-tight md:text-6xl">
            Three pieces. No filler.
          </h2>
        </div>

        {products.map((product, i) => (
          <ProductEditorial
            key={product.id}
            product={product}
            index={i}
            formatPrice={formatPrice}
          />
        ))}
      </section>

      {/* BRAND STATEMENT */}
      <section className="relative overflow-hidden border-t border-line bg-ink py-28 text-bg">
        <InfinityBackground className="opacity-40" />
        <div className="relative mx-auto max-w-3xl px-6 text-center md:px-10">
          <p className="eyebrow text-electric">Manifesto</p>
          <p className="font-display mt-6 text-3xl font-medium leading-snug md:text-5xl">
            EON is not a season. It's a loop — worn, reworked, worn again.
            Infinite by design.
          </p>
          <Link
            to="/about"
            className="eyebrow group mt-10 inline-flex items-center gap-3 border border-bg px-8 py-4 transition-colors hover:bg-bg hover:text-ink"
          >
            About EON
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* SIZE HELPER TEASER */}
      <section className="relative mx-auto max-w-[1600px] px-6 py-24 md:px-10">
        <div className="grid items-center gap-10 border border-line p-10 md:grid-cols-[1fr_auto] md:p-16">
          <div>
            <p className="eyebrow text-electric">Fit Assistant</p>
            <h3 className="font-display mt-4 text-3xl font-medium md:text-4xl">
              Not sure of your size? We'll calculate it in seconds.
            </h3>
          </div>
          <Link
            to="/size-guide"
            className="eyebrow group flex w-fit items-center gap-3 bg-ink px-8 py-4 text-bg transition-opacity hover:opacity-85"
          >
            Find My Size
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
