import { LogIn, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { getAuthErrorMessage, useAuth } from '../context/AuthContext';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

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
            <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.16em] text-guardian-800">Appwrite account</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-950">Sign in securely</h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Your identity and session are managed by Appwrite. Truth Guardian does not store your password in the Django application.
            </p>
            <p className="mt-3 text-sm font-semibold text-guardian-800">Public verification and fraud reporting do not require an account.</p>
          </div>

          <Card className="mt-8 p-6 shadow-soft sm:p-8">
            {!configured ? (
              <Alert tone="warning" title="Appwrite is not configured yet" className="mb-6">
                Set the public Appwrite endpoint and project ID in the frontend environment before enabling sign-in.
              </Alert>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                label="Email address"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={!configured || submitting || loading}
                placeholder="you@example.com"
              />
              <Input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                label="Password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={!configured || submitting || loading}
                placeholder="Your password"
              />

              {formError || authError ? <Alert tone="error">{formError || authError}</Alert> : null}

              <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={!configured || submitting || loading}>
                <LogIn className="h-5 w-5" aria-hidden="true" />
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </Card>

          <p className="mt-6 text-center text-sm text-slate-600">
            Need to browse first?{' '}
            <Link to="/" className="font-extrabold text-guardian-800 hover:text-guardian-950">Return home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
