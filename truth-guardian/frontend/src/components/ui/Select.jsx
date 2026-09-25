import { forwardRef, useId } from 'react';

const Select = forwardRef(function Select(
  {
    id,
    label,
    hint,
    error,
    children,
    className = '',
    containerClassName = '',
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={containerClassName}>
      {label ? <label htmlFor={selectId} className="text-sm font-extrabold text-slate-900">{label}</label> : null}
      <select
        {...props}
        ref={ref}
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition-[border-color,box-shadow] focus:border-guardian-500 focus:outline-none focus:ring-2 focus:ring-guardian-200 disabled:cursor-not-allowed disabled:bg-slate-100 ${error ? 'border-rose-300' : ''} ${className}`}
      >
        {children}
      </select>
      {hint && !error ? <p id={hintId} className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</p> : null}
      {error ? <p id={errorId} className="mt-1.5 text-xs font-bold text-rose-700" role="alert">{error}</p> : null}
    </div>
  );
});

export default Select;
