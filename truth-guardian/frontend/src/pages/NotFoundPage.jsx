import { ArrowLeft, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="bg-slate-50 py-24">
      <div className="page-shell text-center">
        <SearchX className="mx-auto h-12 w-12 text-guardian-700" aria-hidden="true" />
        <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.2em] text-guardian-700">Page not found</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold text-slate-950">This page could not be found</h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-slate-600">
          Check the address or return to the verification workspace.
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-2 rounded-lg bg-guardian-800 px-5 py-3 text-sm font-extrabold text-white hover:bg-guardian-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Return home
        </Link>
      </div>
    </div>
  );
}
