import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import { Alert, Spinner } from '../components/ui.jsx';

export default function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  if (!authLoading && user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Good to see you again"
      subtitle="Sign in to pick up where you left off."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="link">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && (
          <Alert type="error" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="input"
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
            required
          />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting && <Spinner className="h-4 w-4" />}
          {submitting ? 'Signing you in…' : 'Sign in'}
        </button>
      </form>

      <div className="panel mt-8 px-5 py-4">
        <p className="eyebrow">Demo accounts</p>
        <dl className="mt-3 space-y-1.5 text-xs leading-relaxed text-bark-500">
          <div className="flex gap-2">
            <dt className="w-24 shrink-0">Volunteer</dt>
            <dd className="text-bark-700">asha@volunteerconnect.dev</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0">Organisation</dt>
            <dd className="text-bark-700">green@volunteerconnect.dev</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0">Password</dt>
            <dd className="text-bark-700">password123</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-bark-400">Available once the seed script has been run.</p>
      </div>
    </AuthLayout>
  );
}
