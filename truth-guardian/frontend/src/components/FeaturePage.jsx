import { Construction, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FeaturePage({ eyebrow, title, description, children }) {
  return (
    <div className="bg-slate-50 py-14 sm:py-20">
      <div className="page-shell">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-guardian-100 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-guardian-800">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {eyebrow}
            </div>
            <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-600">{description}</p>
          </div>

          {children ? <div className="mt-10">{children}</div> : null}

          <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
            <div className="flex gap-4">
              <Construction className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" aria-hidden="true" />
              <div>
                <h2 className="font-extrabold text-amber-950">Planned module—not yet operational</h2>
                <p className="mt-1 text-sm leading-6 text-amber-900">
                  No demonstration records are being presented as real. This area will be enabled
                  only after its backend models, permissions, ingestion rules and tests are complete.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/verify"
              className="rounded-lg bg-guardian-800 px-5 py-3 text-sm font-extrabold text-white hover:bg-guardian-900"
            >
              Open verification workspace
            </Link>
            <Link
              to="/about"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-100"
            >
              Read about the platform
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
