import { CheckCircle2, CircleAlert, Info, X, XCircle } from 'lucide-react';
import { useState } from 'react';

const tones = {
  info: {
    icon: Info,
    container: 'border-blue-200 bg-blue-50 text-blue-950',
    iconColor: 'text-blue-700',
  },
  success: {
    icon: CheckCircle2,
    container: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    iconColor: 'text-emerald-700',
  },
  warning: {
    icon: CircleAlert,
    container: 'border-amber-200 bg-amber-50 text-amber-950',
    iconColor: 'text-amber-700',
  },
  error: {
    icon: XCircle,
    container: 'border-rose-200 bg-rose-50 text-rose-950',
    iconColor: 'text-rose-700',
  },
};

export default function Alert({
  tone = 'info',
  title,
  children,
  onDismiss,
  className = '',
}) {
  const [dismissed, setDismissed] = useState(false);
  const config = tones[tone] || tones.info;
  const Icon = config.icon;

  if (dismissed) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 ${config.container} ${className}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconColor}`} aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm leading-6">
        {title ? <p className="font-extrabold">{title}</p> : null}
        {children ? <div className={title ? 'mt-1' : ''}>{children}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            onDismiss();
          }}
          className="rounded-lg p-1 text-current opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
          aria-label="Dismiss message"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
