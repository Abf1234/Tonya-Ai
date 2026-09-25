import { Check, Copy, LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

async function writeClipboard(value) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') {
    return false;
  }

  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  return copied;
}

export default function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  onError,
  onSuccess,
  className = '',
  variant = 'secondary',
  size = 'sm',
}) {
  const [state, setState] = useState('idle');
  const timer = useRef(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const handleClick = async () => {
    if (state === 'loading') return;
    setState('loading');
    try {
      const copied = await writeClipboard(value);
      if (!copied) throw new Error('Clipboard unavailable');
      setState('success');
      onSuccess?.();
    } catch {
      setState('error');
      onError?.();
    } finally {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setState('idle'), 1800);
    }
  };

  const loading = state === 'loading';
  const success = state === 'success';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-extrabold transition-[background-color,border-color,color,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guardian-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
        success
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-slate-300 bg-white text-slate-700 hover:border-guardian-300 hover:bg-guardian-50 hover:text-guardian-900'
      } ${variant === 'primary' ? 'border-guardian-800 bg-guardian-800 text-white hover:bg-guardian-900' : ''} ${className}`}
      aria-label={success ? copiedLabel : label}
    >
      {loading ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : success ? (
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      <span aria-hidden="true">{loading ? 'Copying…' : success ? `✓ ${copiedLabel}` : label}</span>
    </button>
  );
}
