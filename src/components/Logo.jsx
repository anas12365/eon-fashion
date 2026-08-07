import InfinityMark from './InfinityMark';

// size: tailwind-esque text size for the letters, controls scale of everything
export default function Logo({ className = '', size = 'text-2xl', color = 'currentColor' }) {
  return (
    <span
      className={`inline-flex items-center font-display font-bold tracking-tight leading-none select-none ${size} ${className}`}
      style={{ color }}
      aria-label="EON"
    >
      <span>E</span>
      <InfinityMark
        className="inline-block h-[0.62em] w-[0.9em] -mx-[0.02em] translate-y-[0.02em]"
        strokeWidth={9}
        color={color}
      />
      <span>N</span>
    </span>
  );
}
