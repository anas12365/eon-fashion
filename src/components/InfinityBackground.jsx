import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// A large, low-opacity infinity glyph that drifts slowly behind page
// content. Purely decorative — pointer-events disabled, aria-hidden.
export default function InfinityBackground({ className = '' }) {
  const markRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(markRef.current, {
        rotate: 6,
        scale: 1.05,
        duration: 14,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
      gsap.to(markRef.current, {
        x: 20,
        duration: 18,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 0.5,
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <svg
        ref={markRef}
        viewBox="0 0 100 100"
        className="absolute left-1/2 top-1/2 w-[140%] max-w-none -translate-x-1/2 -translate-y-1/2 text-electric opacity-[0.05] md:w-[90%]"
        fill="none"
      >
        <path
          d="M20,50 C20,30 40,30 50,50 C60,70 80,70 80,50 C80,30 60,30 50,50 C40,70 20,70 20,50 Z"
          stroke="currentColor"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}
