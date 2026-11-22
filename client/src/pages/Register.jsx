import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import { Alert, Icon, Spinner } from '../components/ui.jsx';

const ROLES = [
  {
    value: 'volunteer',
    icon: 'heart',
    title: 'I want to volunteer',
    blurb: 'Find shifts nearby and claim a place.',
  },
  {
    value: 'organization',
    icon: 'building',
    title: 'I run an organisation',
    blurb: 'Post what you need and see who comes.',
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

    if (form.password.length < 6) return setError('Your password needs at least 6 characters.');
    if (form.password !== form.confirm) return setError('The two passwords don’t match.');

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
      title="Join HelpHop"
      subtitle="It takes about a minute, and there is no approval queue on the other side."
      quote="“We put up one shift on a Tuesday. By Thursday there were nine of us.”"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="link">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-7" noValidate>
        {error && (
          <Alert type="error" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        <fieldset>
          <legend className="label">Which of these is you?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {ROLES.map((r) => {
              const active = form.role === r.value;
              return (
                <label
                  key={r.value}
                  className={`flex cursor-pointer flex-col gap-1.5 rounded-card border p-4 transition-all duration-200 ease-natural ${
                    active
                      ? 'border-sage-500 bg-sage-50'
                      : 'border-bark-200 bg-paper hover:border-bark-300'
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
                  <span className={active ? 'text-sage-600' : 'text-bark-400'}>
                    <Icon name={r.icon} className="h-5 w-5" />
                  </span>
                  <span className="mt-1 font-serif text-base text-bark-700">{r.title}</span>
                  <span className="text-xs leading-relaxed text-bark-500">{r.blurb}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label className="label" htmlFor="name">
            {isOrg ? 'Organisation name' : 'Your name'}
          </label>
          <input
            id="name"
            className="input"
            placeholder={isOrg ? 'Fairfield Allotments' : 'Asha Verma'}
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

        <div className="grid gap-5 sm:grid-cols-2">
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
              Confirm it
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              className="input"
              placeholder="Type it again"
              value={form.confirm}
              onChange={set('confirm')}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting && <Spinner className="h-4 w-4" />}
          {submitting ? 'Setting things up…' : 'Create my account'}
        </button>
      </form>
    </AuthLayout>
  );
}
