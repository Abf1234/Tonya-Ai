import { Bot, MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function AssistantLauncher() {
  const [dismissed, setDismissed] = useState(false);
  const location = useLocation();
  if (dismissed || location.pathname === '/truth-guardian' || location.pathname === '/chat') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      <div className="pointer-events-none hidden max-w-[220px] rounded-2xl border border-slate-200 bg-white/95 p-3 text-xs leading-5 text-slate-600 opacity-0 shadow-soft transition-opacity duration-200 group-hover:opacity-100 sm:block">
        Ask about a claim using approved public records. No login required.
      </div>
      <div className="group relative flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guardian-500"
          aria-label="Hide Truth Guardian assistant shortcut"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <Link
          to="/truth-guardian"
          className="group inline-flex min-h-14 items-center gap-3 rounded-2xl border border-guardian-300 bg-guardian-950 px-4 py-3 text-white shadow-soft transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guardian-500 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
          aria-label="Open Truth Guardian assistant"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-guardian-400/15 text-guardian-200">
            <Bot className="h-5 w-5 animate-breathe" aria-hidden="true" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-guardian-950 bg-guardian-300" aria-hidden="true" />
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-extrabold">Ask Truth Guardian</span>
            <span className="mt-0.5 block text-[11px] text-guardian-200">Approved evidence only</span>
          </span>
          <MessageCircle className="h-4 w-4 text-guardian-300 sm:hidden" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
