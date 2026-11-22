import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import OpportunityCard from '../components/OpportunityCard.jsx';
import {
  Alert,
  CardSkeleton,
  EmptyState,
  Icon,
  Modal,
  PageHeader,
  Spinner,
  StatCard,
  formatDateTime,
} from '../components/ui.jsx';

export default function OrganizationDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [viewing, setViewing] = useState(null); // { id, title }

  const load = useCallback(() => {
    setLoading(true);
    api
      .dashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const handleDelete = async (opportunity) => {
    const ok = window.confirm(
      `Delete "${opportunity.title}"? This also removes its ${opportunity.registeredCount} registration(s). This cannot be undone.`
    );
    if (!ok) return;

    setError('');
    setDeletingId(opportunity._id);
    try {
      await api.deleteOpportunity(opportunity._id);
      setSuccess(`"${opportunity.title}" was deleted.`);
      setData((d) => ({
        ...d,
        opportunities: d.opportunities.filter((o) => o._id !== opportunity._id),
        stats: {
          ...d.stats,
          totalOpportunities: d.stats.totalOpportunities - 1,
          totalVolunteers: d.stats.totalVolunteers - opportunity.registeredCount,
          spotsOpen: d.stats.spotsOpen - opportunity.spotsLeft,
        },
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="shell py-10 sm:py-12">
        <div className="h-9 w-64 animate-pulse rounded bg-ink-100" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-28 animate-pulse" />
          ))}
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="shell py-10">
        <Alert type="error" onDismiss={() => setError('')}>
          {error || 'Could not load your dashboard.'}
        </Alert>
      </div>
    );
  }

  const { stats, opportunities } = data;

  return (
    <div className="shell py-10 sm:py-12">
      <PageHeader
        eyebrow="Organization dashboard"
        title={user.name}
        description="Everything you've posted, and who has signed up."
        actions={
          <Link to="/opportunities/new" className="btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            Post an opportunity
          </Link>
        }
      />

      <div className="space-y-4">
        {success && (
          <Alert type="success" onDismiss={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert type="error" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}
      </div>

      <div className={`grid gap-4 sm:grid-cols-3 ${success || error ? 'mt-4' : ''}`}>
        <StatCard label="Opportunities posted" value={stats.totalOpportunities} icon="compass" />
        <StatCard
          label="Volunteers signed up"
          value={stats.totalVolunteers}
          icon="users"
          tone="ocean"
        />
        <StatCard label="Spots still open" value={stats.spotsOpen} icon="clock" tone="neutral" />
      </div>

      <div className="mt-8">
        {opportunities.length === 0 ? (
          <EmptyState
            icon="building"
            title="No opportunities posted yet"
            message="Create your first one and it goes live on the board immediately — volunteers can find and join it right away."
            action={
              <Link to="/opportunities/new" className="btn-primary">
                <Icon name="plus" className="h-4 w-4" />
                Post your first opportunity
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((o) => (
              <OpportunityCard
                key={o._id}
                opportunity={{ ...o, organizationId: { name: user.name } }}
                footer={
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => setViewing({ id: o._id, title: o.title })}
                    >
                      <Icon name="users" className="h-3.5 w-3.5" />
                      {o.registeredCount}
                    </button>
                    <Link to={`/opportunities/${o._id}/manage`} className="btn-secondary btn-sm">
                      <Icon name="qr" className="h-3.5 w-3.5" />
                      {o.completedAt ? 'Results' : 'Attendance'}
                    </Link>
                    {!o.completedAt && (
                      <Link to={`/opportunities/${o._id}/edit`} className="btn-outline btn-sm">
                        <Icon name="edit" className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                    )}
                    <button
                      type="button"
                      className="btn-danger btn-sm ml-auto"
                      onClick={() => handleDelete(o)}
                      disabled={deletingId === o._id}
                    >
                      {deletingId === o._id ? (
                        <Spinner className="h-3.5 w-3.5" />
                      ) : (
                        <Icon name="trash" className="h-3.5 w-3.5" />
                      )}
                      {deletingId === o._id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>

      {viewing && <VolunteersModal opportunity={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function VolunteersModal({ opportunity, onClose }) {
  const [state, setState] = useState({ loading: true, error: '', volunteers: [], required: 0 });

  useEffect(() => {
    let cancelled = false;
    api
      .listVolunteers(opportunity.id)
      .then((res) => {
        if (cancelled) return;
        setState({
          loading: false,
          error: '',
          volunteers: res.volunteers,
          required: res.opportunity.requiredVolunteers,
        });
      })
      .catch((err) => !cancelled && setState((s) => ({ ...s, loading: false, error: err.message })));

    return () => {
      cancelled = true;
    };
  }, [opportunity.id]);

  const subtitle = state.loading
    ? undefined
    : `${state.volunteers.length} of ${state.required} spots filled`;

  return (
    <Modal title={opportunity.title} subtitle={subtitle} onClose={onClose}>
      {state.loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-ink-400">
          <Spinner className="h-5 w-5 text-brand-600" />
          <span className="text-sm">Loading volunteers…</span>
        </div>
      ) : state.error ? (
        <Alert type="error">{state.error}</Alert>
      ) : state.volunteers.length === 0 ? (
        <div className="py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon name="users" className="h-6 w-6" />
          </span>
          <p className="mt-3 font-semibold text-ink-900">No volunteers yet</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-ink-500">
            Share the link to this opportunity to get your first sign-up.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-ink-200/70">
          {state.volunteers.map((v) => (
            <li key={v.id} className="flex items-center gap-3 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                {v.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900">{v.name}</p>
                <a
                  href={`mailto:${v.email}`}
                  className="block truncate text-sm text-ink-500 hover:text-brand-700"
                >
                  {v.email}
                </a>
              </div>
              <p className="shrink-0 text-xs text-ink-400">{formatDateTime(v.joinedAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
