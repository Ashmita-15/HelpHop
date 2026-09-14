import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import { Alert, Icon, Spinner } from '../components/ui.jsx';

const ROLES = [
  {
    value: 'volunteer',
    icon: 'heart',
    title: 'Volunteer',
    blurb: 'Find shifts near you and sign up.',
  },
  {
    value: 'organization',
    icon: 'building',
    title: 'Organization',
    blurb: 'Post shifts and track who joins.',
  },
];

export default function Register() {
  const { register, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: 'volunteer',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  if (!authLoading && user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('The two passwords do not match.');

    setSubmitting(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const isOrg = form.role === 'organization';

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Takes about a minute. No approval queue."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Log in
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

        <fieldset>
          <legend className="label">I&apos;m signing up as a…</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {ROLES.map((r) => {
              const active = form.role === r.value;
              return (
                <label
                  key={r.value}
                  className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-all duration-200 ${
                    active
                      ? 'border-brand-500 bg-brand-50/50 shadow-soft ring-1 ring-brand-500/30'
                      : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={active}
                    onChange={set('role')}
                    className="sr-only"
                  />
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      active ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500'
                    }`}
                  >
                    <Icon name={r.icon} className="h-4 w-4" />
                  </span>
                  <span className="mt-1 text-sm font-semibold text-ink-900">{r.title}</span>
                  <span className="text-xs leading-relaxed text-ink-500">{r.blurb}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label className="label" htmlFor="name">
            {isOrg ? 'Organization name' : 'Full name'}
          </label>
          <input
            id="name"
            className="input"
            placeholder={isOrg ? 'Green Earth Collective' : 'Asha Verma'}
            value={form.name}
            onChange={set('name')}
            required
          />
        </div>

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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="input"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={set('password')}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="confirm">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              className="input"
              placeholder="Repeat it"
              value={form.confirm}
              onChange={set('confirm')}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting && <Spinner className="h-4 w-4" />}
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
