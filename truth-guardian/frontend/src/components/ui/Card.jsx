const tones = {
  default: 'border-slate-200 bg-white shadow-card',
  soft: 'border-slate-200 bg-slate-50',
  dark: 'border-guardian-800 bg-guardian-950 text-white shadow-soft',
  accent: 'border-guardian-200 bg-guardian-50',
  danger: 'border-rose-200 bg-rose-50',
  warning: 'border-amber-200 bg-amber-50',
};

export default function Card({
  as: Component = 'div',
  tone = 'default',
  interactive = false,
  className = '',
  children,
  ...props
}) {
  return (
    <Component
      {...props}
      className={`rounded-2xl border ${tones[tone] || tones.default} ${
        interactive
          ? 'transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-guardian-300 hover:shadow-soft motion-reduce:hover:translate-y-0'
          : ''
      } ${className}`}
    >
      {children}
    </Component>
  );
}
