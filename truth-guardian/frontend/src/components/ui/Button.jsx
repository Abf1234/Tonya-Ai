import { LoaderCircle } from 'lucide-react';

const variants = {
  primary:
    'bg-guardian-800 text-white shadow-sm hover:bg-guardian-900 active:bg-guardian-950',
  secondary:
    'border border-slate-300 bg-white text-slate-800 shadow-sm hover:border-guardian-300 hover:bg-guardian-50 hover:text-guardian-900',
  soft: 'bg-guardian-50 text-guardian-900 hover:bg-guardian-100',
  ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-950',
  danger: 'bg-rose-700 text-white shadow-sm hover:bg-rose-800 active:bg-rose-900',
  dangerSoft: 'border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100',
};

const sizes = {
  sm: 'min-h-10 px-3 text-xs',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-sm',
  icon: 'h-11 w-11 p-0',
};

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  type = 'button',
  children,
  ...props
}) {
  const isNativeButton = Component === 'button';
  const isDisabled = disabled || loading;

  return (
    <Component
      {...props}
      {...(isNativeButton ? { type } : {})}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-extrabold transition-[transform,background-color,border-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guardian-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${
        variants[variant] || variants.primary
      } ${sizes[size] || sizes.md} ${className}`}
      {...(isNativeButton
        ? { disabled: isDisabled, 'aria-busy': loading || undefined }
        : { 'aria-disabled': isDisabled || undefined })}
      {...(isDisabled && !isNativeButton ? { onClick: undefined } : {})}
    >
      {loading ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /> : null}
      {children}
    </Component>
  );
}
