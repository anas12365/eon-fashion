import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className="text-ink transition-colors hover:text-electric"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.4" />
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <line x1="10" y1="1.5" x2="10" y2="3.3" />
        <line x1="10" y1="16.7" x2="10" y2="18.5" />
        <line x1="1.5" y1="10" x2="3.3" y2="10" />
        <line x1="16.7" y1="10" x2="18.5" y2="10" />
        <line x1="4.2" y1="4.2" x2="5.5" y2="5.5" />
        <line x1="14.5" y1="14.5" x2="15.8" y2="15.8" />
        <line x1="4.2" y1="15.8" x2="5.5" y2="14.5" />
        <line x1="14.5" y1="5.5" x2="15.8" y2="4.2" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <path
        d="M17 12.4A7.2 7.2 0 0 1 7.6 3a7.2 7.2 0 1 0 9.4 9.4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
