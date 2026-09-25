import { Check, ClipboardPaste, LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function PasteButton({
  onPaste,
  onUnavailable,
  label = 'Paste',
  className = '',
  disabled = false,
}) {
  const [state, setState] = useState('idle');
  const resetTimer = useRef(null);

  useEffect(() => () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
  }, []);

  const scheduleReset = () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setState('idle'), 1800);
  };

  const handleClick = async () => {
    if (disabled || state === 'loading') return;

    setState('loading');
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
        throw new Error('Clipboard API unavailable');
      }
      const text = await navigator.clipboard.readText();
      if (!text) throw new Error('Clipboard is empty');
      onPaste?.(text);
      setState('success');
      scheduleReset();
    } catch {
      setState('error');
      onUnavailable?.();
      scheduleReset();
    }
  };

  const isSuccess = state === 'success';
  const isLoading = state === 'loading';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-extrabold transition-[background-color,border-color,color,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guardian-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
        isSuccess
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-slate-300 bg-white text-slate-700 hover:border-guardian-300 hover:bg-guardian-50 hover:text-guardian-900'
      } ${className}`}
      aria-label={isSuccess ? 'Pasted' : label}
      title="Read text from your clipboard"
    >
      {isLoading ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : isSuccess ? (
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      <span aria-hidden="true">{isLoading ? 'Reading…' : isSuccess ? '✓ Pasted' : label}</span>
    </button>
  );
}
