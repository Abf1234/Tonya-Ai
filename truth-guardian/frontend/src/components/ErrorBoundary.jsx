import { Component } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Keep the user-facing message generic. The host can still collect a
    // sanitized error report without rendering stack traces in the interface.
    if (import.meta.env.DEV) {
      console.error('Truth Guardian UI error', error, info);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-16">
        <div className="w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-soft" role="alert">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-slate-950">Something went wrong</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">The page could not be displayed safely. Please try again.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-guardian-800 px-5 text-sm font-extrabold text-white hover:bg-guardian-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guardian-500 focus-visible:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      </div>
    );
  }
}
