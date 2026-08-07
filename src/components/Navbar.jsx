import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import eonBadgeInk from '../assets/logo/eon-badge-ink.png';
import eonBadgeWhite from '../assets/logo/eon-badge-white.png';
import eonBadgeElectric from '../assets/logo/eon-badge-electric.png';

const LINKS = [
  { to: '/collection', label: 'Collection' },
  { to: '/about', label: 'About' },
  { to: '/size-guide', label: 'Size Guide' },
  { to: '/contact', label: 'Contact' },
];

const LEFT_LINKS = LINKS.slice(0, 2);
const RIGHT_LINKS = LINKS.slice(2);

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { count, setIsCartOpen } = useCart();
  const { theme } = useTheme();
  const eonBadge = theme === 'dark' ? eonBadgeWhite : eonBadgeInk;
  const badgeRef = useRef(null);
  const projectionRef = useRef(null);
  const signatureRef = useRef(null);
  const signatureSpinRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // ambient projection behind the logo — a very slow, barely-there
    // breathing pulse, entirely independent of hover
    const breathing = gsap.to(projectionRef.current, {
      opacity: 0.085,
      scale: 1.08,
      duration: 7,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
    return () => breathing.kill();
  }, []);

  useEffect(() => {
    // center signature — slow, luxury-watch rotation; speeds up smoothly on hover
    const spin = gsap.to(signatureRef.current, {
      rotate: 360,
      duration: 40,
      ease: 'none',
      repeat: -1,
      force3D: true,
    });
    signatureSpinRef.current = spin;
    return () => spin.kill();
  }, []);

  const handleSignatureEnter = () => {
    gsap.to(signatureSpinRef.current, { timeScale: 5, duration: 0.8, ease: 'power2.out' });
  };

  const handleSignatureLeave = () => {
    gsap.to(signatureSpinRef.current, { timeScale: 1, duration: 1.2, ease: 'power2.inOut' });
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-bg/90 backdrop-blur-md border-b border-line'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-[1640px] items-center justify-between overflow-x-clip px-7 py-5 sm:px-8 md:px-10 lg:px-16">
          <Link
            to="/"
            aria-label="EON home"
            className="group relative flex-shrink-0"
          >
            {/* ambient projection — not a glow. A large, soft, feathered
                diffusion of white light sitting behind the logo, breathing
                very slowly. The logo itself stays perfectly sharp. */}
            <span
              ref={projectionRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[42px] lg:h-44 lg:w-44"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 35%, rgba(255,255,255,0.15) 60%, transparent 78%)',
                opacity: 0.06,
              }}
            />
            <span className="relative flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-110">
              <img
                ref={badgeRef}
                src={eonBadge}
                alt="EON"
                className="block h-[68px] w-[68px] object-contain lg:h-[85px] lg:w-[85px]"
              />
            </span>
          </Link>

          <nav className="hidden min-w-0 items-center gap-9 md:flex lg:gap-14">
            {LEFT_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `eyebrow transition-colors ${
                    isActive ? 'text-electric' : 'text-ink hover:text-electric'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {/* EON Infinity Signature — decorative center brand mark. A genuine
                flex child (not absolutely positioned), so the row's own `gap`
                guarantees equal, overlap-free spacing on both sides. Reserved
                for lg+ where there's always enough room; hidden in the tighter
                md-only tablet band so nav links never get squeezed or overflow. */}
            <span
              aria-hidden="true"
              onMouseEnter={handleSignatureEnter}
              onMouseLeave={handleSignatureLeave}
              className="relative hidden flex-shrink-0 items-center justify-center rounded-full border border-line/70 bg-bg/85 p-2 shadow-sm backdrop-blur-sm transition-transform duration-500 ease-out hover:scale-[1.12] lg:flex"
            >
              <span
                className="absolute h-11 w-11 rounded-full opacity-0 blur-md transition-opacity duration-500 hover:opacity-100"
                style={{
                  background:
                    'radial-gradient(circle, rgba(42,70,255,0.25) 0%, transparent 70%)',
                }}
              />
              <img
                ref={signatureRef}
                src={theme === 'dark' ? eonBadgeWhite : eonBadgeElectric}
                alt=""
                draggable="false"
                className="relative block h-8 w-8 select-none object-contain opacity-90 lg:h-9 lg:w-9"
              />
            </span>

            {RIGHT_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `eyebrow transition-colors ${
                    isActive ? 'text-electric' : 'text-ink hover:text-electric'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-shrink-0 items-center gap-4 sm:gap-5">
            <ThemeToggle />
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="text-ink transition-colors hover:text-electric"
            >
              <SearchIcon />
            </button>
            <button
              aria-label="Open cart"
              onClick={() => setIsCartOpen(true)}
              className="relative text-ink transition-colors hover:text-electric"
            >
              <BagIcon />
              {count > 0 && (
                <span className="font-mono absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-electric text-[10px] text-white">
                  {count}
                </span>
              )}
            </button>
            <button
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex flex-col gap-[5px] md:hidden"
            >
              <span
                className={`h-px w-6 bg-ink transition-transform duration-300 ${
                  menuOpen ? 'translate-y-[3px] rotate-45' : ''
                }`}
              />
              <span
                className={`h-px w-6 bg-ink transition-transform duration-300 ${
                  menuOpen ? '-translate-y-[3px] -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="fixed inset-x-0 top-0 z-40 mt-[72px] overflow-hidden bg-bg border-b border-line md:hidden"
          >
            <nav className="flex flex-col gap-6 px-6 py-10">
              {LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="font-display text-3xl font-medium text-ink"
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/40 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="mt-24 w-[90%] max-w-xl border border-line bg-surface p-2"
            >
              <input
                autoFocus
                type="text"
                placeholder="Search products, e.g. Premium Shirt"
                className="w-full bg-transparent px-4 py-4 font-display text-lg text-ink outline-none placeholder:text-gray-mid"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <line x1="18" y1="18" x2="13.8" y2="13.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 7h10l-.8 10.2a1 1 0 0 1-1 .8H6.8a1 1 0 0 1-1-.8L5 7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M7.5 7V5.5a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
