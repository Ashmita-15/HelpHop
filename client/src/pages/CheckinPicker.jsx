import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { api } from '../api/client.js';
import { Sprig } from '../components/Ornament.jsx';
import { Alert, EmptyState, Icon, Loading, formatDate } from '../components/ui.jsx';
import { formatTimeRange } from '../lib/time.js';
import { isToday, openForCheckin } from '../lib/checkin.js';

/**
 * Where "Check in" goes when the volunteer hasn't come from a particular
 * event — reached from the dashboard, the menu, or a QR scanned with the
 * phone's own camera app that landed them on the site rather than the event.
 *
 * With exactly one event open it steps out of the way and forwards straight
 * to it, which is the common case.
 */
export default function CheckinPicker() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .dashboard()
      .then((data) => setEvents([...(data.opportunities || []), ...(data.previous || [])]))
      .catch((err) => {
        setError(err.message);
        setEvents([]);
      });
  }, []);

  if (events === null) return <Loading label="Finding your events…" />;

  const open = openForCheckin(events);

  // One event open: no point making them choose from a list of one.
  if (open.length === 1) return <Navigate to={`/checkin/${open[0]._id}`} replace />;

  return (
    <div className="shell-narrow py-14 sm:py-20">
      <header className="text-center">
        <Sprig className="mx-auto h-6 w-6 text-sage-500" />
        <p className="eyebrow mt-4">Check in</p>
        <h1 className="h-title mt-3">Mark yourself present</h1>
        <p className="mx-auto mt-4 max-w-md text-[0.95rem] leading-relaxed text-bark-500">
          Pick the event you&apos;re at. You&apos;ll then scan the organiser&apos;s QR code, or type
          the six-digit number from their screen.
        </p>
      </header>

      {error && (
        <div className="mt-8">
          <Alert type="error" onDismiss={() => setError('')}>
            {error}
          </Alert>
        </div>
      )}

      <div className="mt-10">
        {open.length === 0 ? (
          <EmptyState
            title="Nothing to check in to today"
            message="Check-in opens on the morning of an event you've claimed a place at, and stays open for two days afterwards. Nothing of yours is inside that window right now."
            action={
              <Link to="/dashboard" className="btn-outline">
                Back to your shelf
              </Link>
            }
          />
        ) : (
          <ul className="card divide-y divide-bark-200/70 overflow-hidden">
            {open.map((e) => {
              const range = formatTimeRange(e.startTime, e.endTime);
              return (
                <li key={e._id}>
                  <Link
                    to={`/checkin/${e._id}`}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-oat-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-base text-bark-700">{e.title}</p>
                      <p className="mt-0.5 truncate text-xs text-bark-500">
                        {e.venue || e.location} · {isToday(e.date) ? 'Today' : formatDate(e.date)}
                        {range ? ` · ${range}` : ''}
                      </p>
                    </div>
                    <Icon name="arrowRight" className="h-4 w-4 shrink-0 text-bark-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
