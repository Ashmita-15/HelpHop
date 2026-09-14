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
      title="Welcome back"
      subtitle="Log in to manage your shifts and sign-ups."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-ink-200 bg-ink-50/70 px-4 py-3">
        <p className="text-xs font-semibold text-ink-700">Demo accounts</p>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
          Volunteer <span className="font-medium text-ink-700">asha@volunteerconnect.dev</span>
          <br />
          Organization <span className="font-medium text-ink-700">green@volunteerconnect.dev</span>
          <br />
          Password <span className="font-medium text-ink-700">password123</span>
        </p>
        <p className="mt-1.5 text-xs text-ink-400">Available after running the seed script.</p>
      </div>
    </AuthLayout>
  );
}
