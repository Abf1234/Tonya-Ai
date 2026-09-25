import { Inbox } from 'lucide-react';

import Button from './Button';

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center ${className}`}>
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-3 font-display text-lg font-extrabold text-slate-900">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p> : null}
      {actionLabel && onAction ? (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
