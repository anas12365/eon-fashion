// A hand-drawn lemniscate (infinity) path, used as the "O" in the EON
// wordmark and as the recurring brand signature throughout the site.
export default function InfinityMark({
  className = '',
  strokeWidth = 8,
  color = 'currentColor',
  id = 'infinity-path',
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        id={id}
        d="M20,50 C20,30 40,30 50,50 C60,70 80,70 80,50 C80,30 60,30 50,50 C40,70 20,70 20,50 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
