import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Badge, Icon, Loading, ProgressBar, Spinner, formatDate } from '../components/ui.jsx';

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isVolunteer, isOrganization } = useAuth();

  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [joining, setJoining] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getOpportunity(id)
      .then(({ opportunity: o }) => {
        setOpportunity(o);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  const handleJoin = async () => {
    setError('');
    setJoining(true);
    try {
      const res = await api.joinOpportunity(id);
      setSuccess(res.message);
      setOpportunity((o) => ({
        ...o,
        joined: true,
        registeredCount: res.registeredCount,
        spotsLeft: Math.max(0, o.requiredVolunteers - res.registeredCount),
      }));
    } catch (err) {
      setError(err.message);
      // A 409 means our view is stale (already joined, or now full) — refresh it.
      if (err.status === 409) load();
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <Loading label="Loading opportunity…" />;

  if (!opportunity) {
    return (
      <div className="shell-narrow space-y-4 py-20 text-center">
        <Alert type="error">{error || 'Opportunity not found.'}</Alert>
        <Link to="/opportunities" className="btn-outline">
          <Icon name="arrowLeft" className="h-4 w-4" />
          Back to all opportunities
        </Link>
      </div>
    );
  }

  const {
    title,
    description,
    category,
    location,
    date,
    requiredVolunteers,
    registeredCount,
    spotsLeft,
    organizationId,
    joined,
  } = opportunity;

  const isOwner = isOrganization && organizationId?._id === user?.id;
  const full = spotsLeft === 0;

  return (
    <div className="shell max-w-4xl py-8 sm:py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <Icon name="arrowLeft" className="h-4 w-4" />
        Back
      </button>

      <div className="space-y-4">
        {success && (
          <Alert type="success" onDismiss={() => setSuccess('')}>
            {success}{' '}
            <Link to="/dashboard" className="font-semibold underline underline-offset-2">
              View your dashboard
            </Link>
          </Alert>
        )}
        {error && (
          <Alert type="error" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}
      </div>

      <article className="card mt-4 overflow-hidden">
        {/* Header */}
        <div className="border-b border-ink-200/70 bg-hero-glow px-6 py-8 sm:px-8">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge tone="brand">{category}</Badge>
            {joined && (
              <Badge tone="ocean" icon="check">
                You joined this
              </Badge>
            )}
            {full && !joined && <Badge tone="amber">Full</Badge>}
          </div>

          <h1 className="text-2xl font-bold leading-tight tracking-tight text-ink-900 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-500">
            <Icon name="building" className="h-4 w-4" />
            Hosted by{' '}
            <span className="font-semibold text-ink-800">
              {organizationId?.name || 'An organization'}
            </span>
          </p>
        </div>

        {/* Facts */}
        <dl className="grid gap-5 border-b border-ink-200/70 px-6 py-5 sm:grid-cols-3 sm:px-8">
          <Detail icon="pin" label="Location" value={location} />
          <Detail icon="calendar" label="Date" value={formatDate(date)} />
          <Detail
            icon="users"
            label="Volunteers"
            value={`${registeredCount} of ${requiredVolunteers}`}
          />
        </dl>

        {/* Body */}
        <div className="px-6 py-7 sm:px-8">
          <h2 className="eyebrow">About this opportunity</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-700">{description}</p>

          <div className="mt-8 rounded-xl border border-ink-200 bg-ink-50/60 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-ink-700">Spots filled</span>
              <span className={full ? 'font-semibold text-amber-700' : 'text-ink-500'}>
                {full ? 'No spots left' : `${spotsLeft} still open`}
              </span>
            </div>
            <ProgressBar value={registeredCount} max={requiredVolunteers} className="h-2" />
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-ink-200/70 bg-ink-50/60 px-6 py-5 sm:px-8">
          {!user && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-600">
                Log in as a volunteer to claim a spot on this shift.
              </p>
              <div className="flex gap-2">
                <Link to="/login" className="btn-outline">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign up
                </Link>
              </div>
            </div>
          )}

          {isVolunteer &&
            (joined ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-medium text-brand-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100">
                    <Icon name="check" className="h-3.5 w-3.5" />
                  </span>
                  You&apos;re signed up — see you there.
                </p>
                <Link to="/dashboard" className="btn-outline">
                  My opportunities
                </Link>
              </div>
            ) : (
              <button
                type="button"
                className="btn-primary btn-lg w-full sm:w-auto"
                onClick={handleJoin}
                disabled={joining || full}
              >
                {joining && <Spinner className="h-4 w-4" />}
                {full ? 'This opportunity is full' : joining ? 'Joining…' : 'Join opportunity'}
                {!joining && !full && <Icon name="arrowRight" className="h-4 w-4" />}
              </button>
            ))}

          {isOrganization &&
            (isOwner ? (
              <div className="flex flex-wrap gap-2">
                <Link to={`/opportunities/${id}/edit`} className="btn-outline">
                  <Icon name="edit" className="h-4 w-4" />
                  Edit opportunity
                </Link>
                <Link to="/dashboard" className="btn-secondary">
                  <Icon name="users" className="h-4 w-4" />
                  View registered volunteers
                </Link>
              </div>
            ) : (
              <p className="text-sm text-ink-500">
                You&apos;re logged in as an organization — only volunteer accounts can join.
              </p>
            ))}
        </div>
      </article>
    </div>
  );
}

function Detail({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</dt>
        <dd className="mt-0.5 text-sm font-semibold text-ink-900">{value}</dd>
      </div>
    </div>
  );
}
