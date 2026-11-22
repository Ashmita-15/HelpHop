import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import OpportunityCard from '../components/OpportunityCard.jsx';
import VolunteerRewards from '../components/VolunteerRewards.jsx';
import PreviousEvents from '../components/PreviousEvents.jsx';
import CheckinBanner from '../components/CheckinBanner.jsx';
import { Sprig } from '../components/Ornament.jsx';
import {
  Alert,
  CardSkeleton,
  EmptyState,
  Icon,
  StatCard,
  formatDate,
  greeting,
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
      <div className="shell py-12 sm:py-16">
        <div className="h-10 w-64 animate-pulse rounded bg-oat-100" />
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
          {error || 'We couldn’t load your shelf just now.'}
        </Alert>
      </div>
    );
  }

  const { stats, opportunities, previous = [] } = data;
  const firstName = user.name.split(' ')[0];
  const next = opportunities[0];

  return (
    <div className="shell py-12 sm:py-16">
      {/* --------------------------------------------------------- greeting */}
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-bark-200/70 pb-10">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <Sprig className="h-3.5 w-3.5 text-sage-500" />
            Your shelf
          </p>
          <h1 className="h-title mt-4">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-3 max-w-prose text-[0.95rem] leading-relaxed text-bark-500">
            {next
              ? `Your next one is ${next.title} on ${formatDate(next.date)}.`
              : 'Nothing in the diary at the moment — the board is open whenever you are.'}
          </p>
        </div>
        <Link to="/opportunities" className="btn-outline">
          <Icon name="search" className="h-4 w-4" />
          Find something new
        </Link>
      </header>

      <CheckinBanner events={opportunities} />

      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        <StatCard label="Opportunities claimed" value={stats.totalJoined} hint="Since you joined" />
        <StatCard label="Still to come" value={stats.upcoming} hint="Today or later" tone="terra" />
        <StatCard
          label="Already attended"
          value={stats.completed ?? previous.length}
          hint="With certificates"
          tone="neutral"
        />
      </div>

      {/* --------------------------------------------------------- upcoming */}
      <section className="mt-16">
        <h2 className="font-serif text-xl text-bark-700">Coming up</h2>
        <div className="mt-6">
          {opportunities.length === 0 ? (
            <EmptyState
              title={previous.length ? 'Nothing in the diary' : 'Your shelf is empty for now'}
              message={
                previous.length
                  ? 'Everything you have been to is listed below. When you are ready for the next one, the board is a click away.'
                  : 'Browse the board and claim something that fits your week. Once you do, it will sit here with the date at the top so you don’t forget it.'
              }
              action={
                <Link to="/opportunities" className="btn-primary">
                  Find your volunteering opportunity
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
              }
            />
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {opportunities.map((o) => (
                <OpportunityCard
                  key={o._id}
                  opportunity={o}
                  footer={
                    <p className="flex items-center gap-2 text-xs text-bark-500">
                      <Icon name="check" className="h-3.5 w-3.5 text-sage-600" />
                      Claimed {formatDate(o.joinedAt)}
                    </p>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <PreviousEvents events={previous} />

      <VolunteerRewards />
    </div>
  );
}
