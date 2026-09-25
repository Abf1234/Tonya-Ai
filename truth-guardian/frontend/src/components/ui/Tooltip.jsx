export default function Tooltip({ label, children, side = 'top', className = '' }) {
  const position = side === 'bottom' ? 'top-full mt-2' : side === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' : 'bottom-full mb-2 left-1/2 -translate-x-1/2';
  return (
    <span className={`group relative inline-flex ${className}`}>
      {children}
      <span role="tooltip" className={`pointer-events-none absolute z-50 hidden w-max max-w-56 rounded-lg bg-guardian-950 px-2.5 py-1.5 text-xs font-semibold leading-5 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${position}`}>
        {label}
      </span>
    </span>
  );
}
