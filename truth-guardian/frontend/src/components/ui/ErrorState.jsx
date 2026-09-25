import { RotateCcw, TriangleAlert } from 'lucide-react';

import Button from './Button';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again.',
  onRetry,
  retryLabel = 'Try again',
  className = '',
}) {
  return (
    <div className={`rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center ${className}`} role="alert">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-rose-700 shadow-sm">
        <TriangleAlert className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-3 font-display text-lg font-extrabold text-rose-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-rose-900">{message}</p>
      {onRetry ? (
        <Button variant="dangerSoft" size="sm" className="mt-5" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
