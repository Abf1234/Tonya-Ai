import { LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';

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
        <div className="page-shell mx-auto max-w-2xl">
          <Card className="p-6 sm:p-8" aria-label="Checking your account">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="bg-slate-50 py-20">
        <div className="page-shell mx-auto max-w-xl">
          <Alert tone="warning" title="Appwrite is not configured" className="shadow-card">
            Add the public Appwrite endpoint and project ID to the frontend environment before using account features.
          </Alert>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-slate-50 py-20">
        <div className="page-shell mx-auto max-w-xl">
          <Card className="p-8 text-center shadow-soft">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-guardian-100 text-guardian-800">
              <UserRound className="h-6 w-6" aria-hidden="true" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-extrabold text-slate-950">You are signed out</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Sign in with your Appwrite account to use authenticated features. Public verification and fraud reporting do not require an account.
            </p>
            <Button as={Link} to="/login?next=%2Faccount" size="lg" className="mt-6">
              Sign in
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 py-14 sm:py-20">
      <div className="page-shell mx-auto max-w-2xl">
        <Card className="p-6 shadow-soft sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-guardian-100 text-guardian-800">
              <UserRound className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-guardian-800">Appwrite account</p>
              <h1 className="mt-2 font-display text-3xl font-extrabold text-slate-950">{user.name || 'Truth Guardian user'}</h1>
              <p className="mt-2 break-all text-sm text-slate-600">{user.email}</p>
            </div>
          </div>

          <div className="mt-8 flex gap-3 rounded-2xl bg-guardian-50 p-4 text-sm leading-6 text-guardian-950">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-guardian-700" aria-hidden="true" />
            <p>Authentication is handled by Appwrite. Truth Guardian stores no password in the Django application.</p>
          </div>

          <Button type="button" variant="secondary" size="lg" onClick={handleSignOut} loading={signingOut} disabled={signingOut} className="mt-8">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </Button>
          {signOutError ? <Alert tone="error" className="mt-3">{signOutError}</Alert> : null}
        </Card>
      </div>
    </div>
  );
}
