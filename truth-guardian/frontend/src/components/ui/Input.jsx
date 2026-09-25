import { forwardRef, useId } from 'react';

const controlClasses =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-[border-color,box-shadow] focus:border-guardian-500 focus:outline-none focus:ring-2 focus:ring-guardian-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

const Input = forwardRef(function Input(
  {
    id,
    label,
    hint,
    error,
    className = '',
    containerClassName = '',
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={containerClassName}>
      {label ? <label htmlFor={inputId} className="text-sm font-extrabold text-slate-900">{label}</label> : null}
      <input
        {...props}
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${controlClasses} ${error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : ''} ${className}`}
      />
      {hint && !error ? <p id={hintId} className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</p> : null}
      {error ? <p id={errorId} className="mt-1.5 text-xs font-bold text-rose-700" role="alert">{error}</p> : null}
    </div>
  );
});

export default Input;
