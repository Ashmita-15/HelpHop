import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import OpportunityCard from '../components/OpportunityCard.jsx';
import VolunteerRewards from '../components/VolunteerRewards.jsx';
import PreviousEvents from '../components/PreviousEvents.jsx';
import {
  Alert,
  CardSkeleton,
  EmptyState,
  Icon,
  PageHeader,
  StatCard,
  formatDate,
} from '../components/ui.jsx';

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="shell py-10 sm:py-12">
        <div className="h-9 w-56 animate-pulse rounded bg-ink-100" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="card h-28 animate-pulse" />
          <div className="card h-28 animate-pulse" />
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

  const { stats, opportunities, previous = [] } = data;
  const firstName = user.name.split(' ')[0];

  return (
    <div className="shell py-10 sm:py-12">
      <PageHeader
        eyebrow="Your dashboard"
        title={`Hi ${firstName}`}
        description="The shifts you've claimed, newest first."
        actions={
          <Link to="/opportunities" className="btn-outline">
            <Icon name="search" className="h-4 w-4" />
            Find more
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Opportunities joined"
          value={stats.totalJoined}
          icon="check"
          hint="Across all time"
        />
        <StatCard
          label="Still upcoming"
          value={stats.upcoming}
          icon="clock"
          tone="ocean"
          hint="Dated today or later"
        />
        <StatCard
          label="Completed"
          value={stats.completed ?? previous.length}
          icon="certificate"
          tone="neutral"
          hint="Already happened"
        />
      </div>

      <div className="mt-8">
        {opportunities.length === 0 ? (
          <EmptyState
            icon="heart"
            title={previous.length ? 'Nothing coming up' : "You haven't joined anything yet"}
            message={
              previous.length
                ? 'Your finished events are listed below. Browse the board to claim your next shift.'
                : "Browse the board and claim a shift that fits your schedule. You can always check back here to see what's coming up."
            }
            action={
              <Link to="/opportunities" className="btn-primary">
                Browse opportunities
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((o) => (
              <OpportunityCard
                key={o._id}
                opportunity={o}
                footer={
                  <p className="flex items-center gap-1.5 text-xs text-ink-400">
                    <Icon name="check" className="h-3.5 w-3.5 text-brand-500" />
                    Signed up {formatDate(o.joinedAt)}
                  </p>
                }
              />
            ))}
          </div>
        )}
      </div>

      <PreviousEvents events={previous} />

      <VolunteerRewards />
    </div>
  );
}
