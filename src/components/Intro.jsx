import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import eonScript from '../assets/logo/eon-script-white.png';
import infinityMark from '../assets/logo/infinity-jagged-white.png';

const SEEN_KEY = 'eon_intro_seen';

// The Intro is a fixed, permanent EON identity moment — pure black,
// the infinity mark as the interactive opening portal — independent of
// the site's light/dark theme toggle (which only applies once inside).
const GLOW = '255,255,255'; // the handwritten "eon" wordmark's own light
const SILVER = '168,173,181'; // smoked glass gray — the infinity only

// The infinity's material: a diagonal metallic sweep with two bright bands
// (one per loop) fading to near-black at the valleys — masked to the mark's
// silhouette so it reads as brushed chrome / smoked glass, not a flat tint.
const METAL_GRADIENT =
  'linear-gradient(118deg, #050506 0%, #26282c 14%, #9b9ea4 24%, #e9ebee 30%, #9b9ea4 36%, #1c1d20 48%, #0a0a0b 56%, #2a2c30 66%, #c4c7cb 74%, #eef0f2 79%, #c4c7cb 84%, #26282c 92%, #050506 100%)';

export default function Intro({ onDone }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [hovering, setHovering] = useState(false);

  const infinityGroupRef = useRef(null);
  const infinityLeftRef = useRef(null);
  const infinityRightRef = useRef(null);
  const infinityGlowRef = useRef(null);
  const logoRef = useRef(null);
  const logoGlowRef = useRef(null);
  const captionRef = useRef(null);

  const breatheLoopRef = useRef(null);
  const glowLoopRef = useRef(null);

  useEffect(() => {
    const alreadySeen = localStorage.getItem(SEEN_KEY);
    if (alreadySeen) {
      onDone(false);
      return;
    }
    setVisible(true);
    document.body.style.overflow = 'hidden';
  }, [onDone]);

  useEffect(() => {
    if (!visible) return;

    // the infinity portal — slow breathing, premium floating. Idle motion
    // lives on the group wrapper only, so the click "split apart" can
    // later animate each half independently without any tween conflict.
    breatheLoopRef.current = gsap
      .timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } })
      .to(infinityGroupRef.current, { scale: 1.035, duration: 6 }, 0)
      .to(infinityGroupRef.current, { y: -7, duration: 8 }, 0)
      .to(infinityGroupRef.current, { rotate: 1.5, duration: 10 }, 0);

    glowLoopRef.current = gsap.to(infinityGlowRef.current, {
      opacity: 0.55,
      scale: 1.08,
      duration: 5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    // signature entrance
    const tl = gsap.timeline({ delay: 0.2 });

    tl.fromTo(
      infinityGlowRef.current,
      { opacity: 0 },
      { opacity: 0.4, duration: 1.8, ease: 'power2.out' },
      0
    )
      .fromTo(
        infinityGroupRef.current,
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, duration: 1.6, ease: 'power2.out' },
        0.1
      )
      .fromTo(
        logoRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' },
        0.55
      )
      .fromTo(
        captionRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out' },
        '-=0.6'
      );

    return () => {
      tl.kill();
      breatheLoopRef.current?.kill();
      glowLoopRef.current?.kill();
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    // hovering the infinity: slight scale increase, glow increases slightly
    gsap.to(infinityGroupRef.current, {
      scale: hovering ? 1.06 : 1,
      duration: 0.8,
      ease: 'power2.out',
    });
    gsap.to(infinityGlowRef.current, {
      opacity: hovering ? 0.65 : 0.4,
      duration: 0.8,
      ease: 'power2.out',
    });
  }, [hovering, visible]);

  const handleEnter = () => {
    localStorage.setItem(SEEN_KEY, '1');
    breatheLoopRef.current?.kill();
    glowLoopRef.current?.kill();

    // cinematic opening: the infinity splits — left half slides left, right
    // half slides right, like opening doors — while the wordmark becomes
    // the focus (bloom + glow), then the screen resolves into the site.
    const exitTl = gsap.timeline();

    exitTl
      .to(infinityLeftRef.current, {
        x: '-70%',
        opacity: 0,
        duration: 0.8,
        ease: 'power2.inOut',
      }, 0)
      .to(infinityRightRef.current, {
        x: '70%',
        opacity: 0,
        duration: 0.8,
        ease: 'power2.inOut',
      }, 0)
      .to(infinityGlowRef.current, { opacity: 0, duration: 0.6, ease: 'power2.in' }, 0.1)
      .to(
        logoGlowRef.current,
        { opacity: 0.8, scale: 1.1, duration: 0.5, ease: 'power2.out' },
        0.2
      )
      .to(
        logoRef.current,
        {
          scale: 1.12,
          filter: `drop-shadow(0 0 50px rgba(${GLOW},0.5))`,
          duration: 0.6,
          ease: 'power3.out',
        },
        0.25
      )
      .to(captionRef.current, { opacity: 0, duration: 0.3 }, 0.3)
      .to(logoRef.current, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 0.75)
      .to(logoGlowRef.current, { opacity: 0, duration: 0.4, ease: 'power2.in' }, '<')
      .add(() => setExiting(true), '-=0.1');
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden cursor-pointer"
        style={{ backgroundColor: '#070708' }}
        initial={{ opacity: 1 }}
        animate={{ opacity: exiting ? 0 : 1, scale: exiting ? 1.05 : 1 }}
        transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
        
        onAnimationComplete={() => {
          if (exiting) {
            document.body.style.overflow = '';
            setVisible(false);
            onDone(true);
          }
        }}
      >
        {/* layout: infinity portal (interactive) above, eon wordmark below, tagline last */}
        <div className="flex flex-col items-center -translate-y-[3%]">
          <button
            type="button"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            aria-label="Open EON"
            className="relative flex items-center justify-center bg-transparent p-6 focus:outline-none"
          >
            {/* soft ambient bloom behind the portal — low intensity,
                smoked-silver, never a bright glow */}
            <div
              ref={infinityGlowRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[76vw] w-[76vw] max-h-[560px] max-w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 blur-3xl"
              style={{
                background: `radial-gradient(circle, rgba(${SILVER},0.14) 0%, rgba(${SILVER},0.04) 55%, transparent 75%)`,
              }}
            />

            {/* the infinity portal — two overlapping halves of the same
                mark, clipped down the middle, so a click can split them
                apart like opening doors without any path morphing. Each
                half uses the mark as a MASK for an actual metallic gradient
                sweep (dark valleys, bright rim bands) rather than a flat
                low-opacity fill — that gradation is what reads as chrome/
                smoked glass instead of a uniform gray silhouette. */}
            <div
              ref={infinityGroupRef}
              className="relative w-[84vw] max-w-[660px] opacity-0"
              style={{ aspectRatio: '1017 / 558' }}
            >
              <div
                ref={infinityLeftRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 select-none"
                style={{
                  clipPath: 'inset(0 50% 0 0)',
                  filter: `drop-shadow(0 0 22px rgba(${SILVER},0.22)) blur(0.7px)`,
                }}
              >
                <div
                  className="h-full w-full"
                  style={{
                    WebkitMaskImage: `url(${infinityMark})`,
                    maskImage: `url(${infinityMark})`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    background: METAL_GRADIENT,
                  }}
                />
              </div>
              <div
                ref={infinityRightRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 select-none"
                style={{
                  clipPath: 'inset(0 0 0 50%)',
                  filter: `drop-shadow(0 0 22px rgba(${SILVER},0.22)) blur(0.7px)`,
                }}
              >
                <div
                  className="h-full w-full"
                  style={{
                    WebkitMaskImage: `url(${infinityMark})`,
                    maskImage: `url(${infinityMark})`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    background: METAL_GRADIENT,
                  }}
                />
              </div>
            </div>
          </button>

          {/* handwritten "eon" wordmark — clean, unchanged, becomes the
              focus once the portal opens */}
          <div className="relative mt-1 flex items-center justify-center sm:mt-2">
            <div
              ref={logoGlowRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[46vw] w-[46vw] max-h-[380px] max-w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 blur-3xl"
              style={{
                background: `radial-gradient(circle, rgba(${GLOW},0.22) 0%, rgba(${GLOW},0.07) 55%, transparent 75%)`,
              }}
            />
            <img
              ref={logoRef}
              src={eonScript}
              alt="eon"
              draggable="false"
              className="relative w-[46vw] max-w-[360px] select-none opacity-0"
              style={{ filter: `drop-shadow(0 0 14px rgba(${GLOW},0.15))` }}
            />
          </div>

          <p
            ref={captionRef}
            className="eyebrow relative mt-8 max-w-[85vw] px-4 text-center"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Beyond The Ordinary — Tap to Enter
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
