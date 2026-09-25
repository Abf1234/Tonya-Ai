const variants = {
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
  guardian: 'border-guardian-200 bg-guardian-50 text-guardian-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-rose-200 bg-rose-50 text-rose-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  dark: 'border-white/15 bg-white/10 text-guardian-100',
};

export default function Badge({
  variant = 'neutral',
  dot = false,
  className = '',
  children,
  ...props
}) {
  return (
    <span
      {...props}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-extrabold leading-4 ${
        variants[variant] || variants.neutral
      } ${className}`}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
