import { AlertCircle, LogIn, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { getAuthErrorMessage, useAuth } from '../context/AuthContext';

function safeNextPath(value) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /(%2f|%5c)/i.test(value) ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return '/';
  }

  try {
    const baseOrigin =
      typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null'
        ? window.location.origin
        : 'http://localhost';
    const parsed = new URL(value, baseOrigin);
    if (parsed.origin !== baseOrigin) {
      return '/';
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/';
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { configured, error: authError, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!email.trim() || !password) {
      setFormError('Enter your email address and password.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(safeNextPath(searchParams.get('next')), { replace: true });
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 py-14 sm:py-20">
      <div className="page-shell">
        <div className="mx-auto max-w-xl">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-guardian-800 text-white shadow-soft">
              <ShieldCheck className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.16em] text-guardian-800">
              Appwrite account
            </p>
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-950">
              Sign in securely
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Your identity and session are managed by Appwrite. Truth Guardian does not store your
              password in the Django application.
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            {!configured ? (
              <div className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="alert">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
                <div>
                  <strong>Appwrite is not configured yet.</strong>
                  <p className="mt-1">
                    Set the public Appwrite endpoint and project ID in the frontend environment
                    before enabling sign-in.
                  </p>
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="text-sm font-extrabold text-slate-900">
                  Email address
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={!configured || submitting || loading}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-guardian-500 focus:ring-2 focus:ring-guardian-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="text-sm font-extrabold text-slate-900">
                  Password
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={!configured || submitting || loading}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-guardian-500 focus:ring-2 focus:ring-guardian-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="Your password"
                />
              </div>

              {formError || authError ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800" role="alert">
                  {formError || authError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!configured || submitting || loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-guardian-800 px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-guardian-900 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <LogIn className="h-5 w-5" aria-hidden="true" />
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            Need to browse first?{' '}
            <Link to="/" className="font-extrabold text-guardian-800 hover:text-guardian-950">
              Return home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
