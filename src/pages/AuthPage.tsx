import { useState, type FormEvent } from 'react';
import { Footprints, Info, Loader2, LogIn, UserPlus } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';

type Mode = 'signin' | 'signup';

export default function AuthPage() {
  const { navigate } = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isSignUp = mode === 'signup';

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setPassword('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (isSignUp && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    const { error: authError } = isSignUp
      ? await signUp(email.trim(), password)
      : await signIn(email.trim(), password);
    setSubmitting(false);

    if (authError) {
      setError(authError);
      return;
    }
    navigate({ name: 'home' });
  };

  return (
    <main className="flex-1">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-primary-50 via-indigo-50 to-purple-50 blur-3xl"
      />
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-black">
            <Footprints className="h-6 w-6 text-primary" />
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            {isSignUp
              ? 'Sign up to create guides and track your progress.'
              : 'Sign in to pick up your guides where you left off.'}
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="auth-email" className="mb-2 block text-sm font-semibold text-neutral-900">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="mb-2 block text-sm font-semibold text-neutral-900">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full !py-3.5">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isSignUp ? 'Creating account…' : 'Signing in…'}
                </>
              ) : isSignUp ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create account
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500">
            {isSignUp ? 'Already have an account?' : 'New to Stepwise?'}{' '}
            <button
              type="button"
              onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
              className="font-semibold text-primary hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
