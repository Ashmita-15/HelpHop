import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import OpportunityCard from '../components/OpportunityCard.jsx';
import { Sprig } from '../components/Ornament.jsx';
import {
  Alert,
  Avatar,
  Badge,
  CardSkeleton,
  EmptyState,
  Icon,
  Modal,
  Spinner,
  StatCard,
  formatDateTime,
  greeting,
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
      `Take down "${opportunity.title}"? This also removes its ${opportunity.registeredCount} sign-up(s), and cannot be undone.`
    );
    if (!ok) return;

    setError('');
    setDeletingId(opportunity._id);
    try {
      await api.deleteOpportunity(opportunity._id);
      setSuccess(`"${opportunity.title}" has been taken down.`);
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
      <div className="shell py-12 sm:py-16">
        <div className="h-10 w-72 animate-pulse rounded bg-oat-100" />
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded bg-oat-100" />
          ))}
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="shell py-16">
        <Alert type="error" onDismiss={() => setError('')}>
          {error || 'We couldn’t load your desk just now.'}
        </Alert>
      </div>
    );
  }

  const { stats, opportunities } = data;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const isPast = (o) => new Date(o.date) < startOfToday;

  const needsCompleting = opportunities
    .filter((o) => isPast(o) && !o.completedAt)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const upcoming = opportunities
    .filter((o) => !isPast(o) && !o.completedAt)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const done = opportunities
    .filter((o) => o.completedAt)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const renderCard = (o) => (
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
            aria-label={`Take down ${o.title}`}
          >
            {deletingId === o._id ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              <Icon name="trash" className="h-3.5 w-3.5" />
            )}
            {deletingId === o._id ? 'Removing…' : 'Take down'}
          </button>
        </div>
      }
    />
  );

  return (
    <div className="shell py-12 sm:py-16">
      {/* ------------------------------------------------------- the desk */}
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-bark-200/70 pb-10">
        <div className="min-w-0">
          <p className="eyebrow flex items-center gap-2">
            <Sprig className="h-3.5 w-3.5 text-terra-500" />
            Your desk
          </p>
          <div className="mt-4 flex items-center gap-4">
            <Avatar name={user.name} className="hidden h-14 w-14 sm:flex" />
            <div className="min-w-0">
              <h1 className="h-title">{user.name}</h1>
              <p className="mt-1.5 text-[0.95rem] text-bark-500">
                {greeting()}. {upcoming.length > 0
                  ? `${upcoming.length} ${upcoming.length === 1 ? 'shift is' : 'shifts are'} still to come.`
                  : 'Nothing on the board at the moment.'}
              </p>
            </div>
          </div>
        </div>
        <Link to="/opportunities/new" className="btn-primary">
          <Icon name="plus" className="h-4 w-4" />
          Post an opportunity
        </Link>
      </header>

      <div className="mt-6 space-y-3">
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

      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        <StatCard
          label="Opportunities posted"
          value={stats.totalOpportunities}
          hint="All time"
          tone="terra"
        />
        <StatCard
          label="Volunteers signed up"
          value={stats.totalVolunteers}
          hint="Across every shift"
        />
        <StatCard
          label="Places still to fill"
          value={stats.spotsOpen}
          hint="On open shifts"
          tone="neutral"
        />
      </div>

      <div className="mt-16">
        {opportunities.length === 0 ? (
          <EmptyState
            tone="oat"
            title="Nothing on the board yet"
            message="Write your first shift and it goes up straight away — no review, no waiting. Volunteers can find it and claim a place within the minute."
            action={
              <Link to="/opportunities/new" className="btn-primary">
                <Icon name="plus" className="h-4 w-4" />
                Post your first opportunity
              </Link>
            }
          />
        ) : (
          <div className="space-y-16">
            {needsCompleting.length > 0 && (
              <Group
                title="Waiting on you"
                count={needsCompleting.length}
                tone="terra"
                note="These have happened. Take attendance and complete them so your volunteers get their certificates."
              >
                {needsCompleting.map(renderCard)}
              </Group>
            )}

            {upcoming.length > 0 && (
              <Group title="Coming up" count={upcoming.length}>
                {upcoming.map(renderCard)}
              </Group>
            )}

            {done.length > 0 && (
              <Group title="Finished" count={done.length} muted>
                {done.map(renderCard)}
              </Group>
            )}
          </div>
        )}
      </div>

      {viewing && <VolunteersModal opportunity={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

/** One titled band of opportunity cards on the organisation desk. */
function Group({ title, count, note, tone, muted, children }) {
  return (
    <section>
      <div className="flex flex-wrap items-center gap-3 border-b border-bark-200/70 pb-4">
        <h2 className={`font-serif text-xl ${muted ? 'text-bark-500' : 'text-bark-700'}`}>
          {title}
        </h2>
        <Badge tone={tone === 'terra' ? 'terra' : 'neutral'}>{count}</Badge>
      </div>
      {note && <p className="mt-4 max-w-prose text-sm leading-relaxed text-bark-500">{note}</p>}
      <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
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
    : `${state.volunteers.length} of ${state.required} places filled`;

  return (
    <Modal title={opportunity.title} subtitle={subtitle} onClose={onClose}>
      {state.loading ? (
        <div className="flex items-center justify-center gap-3 py-14 text-bark-400">
          <Spinner className="h-5 w-5 text-sage-600" />
          <span className="font-serif text-sm italic">Fetching the list…</span>
        </div>
      ) : state.error ? (
        <Alert type="error">{state.error}</Alert>
      ) : state.volunteers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <Sprig className="h-7 w-7 text-sage-400" />
          <p className="font-serif text-lg text-bark-700">Nobody yet</p>
          <p className="max-w-xs text-sm leading-relaxed text-bark-500">
            Share the link to this opportunity and the first names will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-bark-200/70">
          {state.volunteers.map((v) => (
            <li key={v.id} className="flex items-center gap-3 py-3.5">
              <Avatar name={v.name} className="h-9 w-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-bark-800">{v.name}</p>
                <a
                  href={`mailto:${v.email}`}
                  className="block truncate text-sm text-bark-500 transition-colors hover:text-sage-700"
                >
                  {v.email}
                </a>
              </div>
              <p className="shrink-0 text-xs text-bark-400">{formatDateTime(v.joinedAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
