import { useState } from 'react';
import { LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function AccountPage() {
  const { configured, loading, signOut, user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  const handleSignOut = async () => {
    setSignOutError('');
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSignOutError('Sign-out could not be completed. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 py-20">
        <div className="page-shell text-center text-slate-600">Checking your Appwrite session…</div>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="bg-slate-50 py-20">
        <div className="page-shell mx-auto max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h1 className="font-display text-2xl font-extrabold text-amber-950">Appwrite is not configured</h1>
          <p className="mt-3 text-sm leading-6 text-amber-900">
            Add the public Appwrite endpoint and project ID to the frontend environment before using
            account features.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-slate-50 py-20">
        <div className="page-shell mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft">
          <UserRound className="mx-auto h-10 w-10 text-guardian-700" aria-hidden="true" />
          <h1 className="mt-4 font-display text-2xl font-extrabold text-slate-950">You are signed out</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Sign in with your Appwrite account to use authenticated features.
          </p>
          <Link
            to="/login?next=%2Faccount"
            className="mt-6 inline-flex rounded-xl bg-guardian-800 px-5 py-3 text-sm font-extrabold text-white hover:bg-guardian-900"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 py-14 sm:py-20">
      <div className="page-shell mx-auto max-w-2xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-guardian-100 text-guardian-800">
              <UserRound className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-guardian-800">
                Appwrite account
              </p>
              <h1 className="mt-2 font-display text-3xl font-extrabold text-slate-950">
                {user.name || 'Truth Guardian user'}
              </h1>
              <p className="mt-2 break-all text-sm text-slate-600">{user.email}</p>
            </div>
          </div>

          <div className="mt-8 flex gap-3 rounded-2xl bg-guardian-50 p-4 text-sm leading-6 text-guardian-950">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-guardian-700" aria-hidden="true" />
            <p>
              Authentication is handled by Appwrite. Truth Guardian stores no password in the Django
              application.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
          {signOutError ? (
            <p role="alert" className="mt-3 text-sm font-semibold text-rose-700">
              {signOutError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
