import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getThumbUrl } from '../lib/images';

// Full-bleed editorial layout: image on one side, copy on the other,
// alternating per index — reads like a fashion magazine spread rather
// than a product grid.
export default function ProductEditorial({ product, index, formatPrice }) {
  const reversed = index % 2 === 1;
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);

  return (
    <div
      ref={ref}
      className="grid items-center gap-10 border-t border-line py-16 md:grid-cols-2 md:gap-16 md:py-28"
    >
      <div className={reversed ? 'md:order-2' : ''}>
        <div className="relative aspect-[4/5] overflow-hidden bg-gray">
          {(() => {
            const src = getThumbUrl(product.images[0]);
            return (
              src && (
                <motion.img
                  style={{ y: imgY }}
                  src={src}
                  alt={product.name}
                  className="h-[115%] w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              )
            );
          })()}
          <span className="eyebrow absolute left-5 top-5 bg-bg/85 px-3 py-1.5 text-ink backdrop-blur-sm">
            {product.tag}
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className={`max-w-md ${reversed ? 'md:order-1 md:ml-auto md:text-right' : ''}`}
      >
        <p className="eyebrow text-electric">
          {String(index + 1).padStart(2, '0')} — {product.category || 'EON'}
        </p>
        <h3 className="font-display mt-4 text-4xl font-medium leading-[1.05] text-ink md:text-5xl">
          {product.name}
        </h3>
        <p className="font-mono mt-4 text-lg text-ink-soft">
          {formatPrice(product.price, product.currency)}
        </p>
        <p className="mt-6 text-base leading-relaxed text-ink-soft">
          {product.description}
        </p>
        <Link
          to={`/product/${product.id}`}
          className={`eyebrow group mt-8 inline-flex items-center gap-3 border border-ink px-7 py-4 text-ink transition-colors duration-300 hover:bg-ink hover:text-bg ${
            reversed ? 'md:flex-row-reverse' : ''
          }`}
        >
          View Product
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </Link>
      </motion.div>
    </div>
  );
}
