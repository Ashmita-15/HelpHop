import { Link } from 'react-router-dom';

import { Icon } from './ui.jsx';
import { formatTimeRange } from '../lib/time.js';

const isToday = (value) => {
  const d = new Date(value);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

/**
 * Check-in is only findable if we put it in front of the volunteer on the day.
 * Shows today's joined events with a direct way in; renders nothing otherwise.
 */
export default function CheckinBanner({ events = [] }) {
  const today = events.filter((o) => isToday(o.date) && !o.completedAt && !o.attended);
  if (today.length === 0) return null;

  return (
    <section className="mt-6 rounded-2xl border border-brand-200 bg-brand-50/70 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 ring-1 ring-brand-200">
          <Icon name="qr" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-ink-900">
            {today.length === 1 ? 'Happening today' : `${today.length} events happening today`}
          </h2>
          <p className="mt-0.5 text-sm text-ink-600">
            Scan the organizer&apos;s QR code or enter their 6-digit code to mark yourself present.
          </p>

          <ul className="mt-4 space-y-2">
            {today.map((o) => {
              const range = formatTimeRange(o.startTime, o.endTime);
              return (
                <li
                  key={o._id}
                  className="flex flex-wrap items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-brand-100"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{o.title}</p>
                    <p className="truncate text-xs text-ink-500">
                      {o.venue || o.location}
                      {range ? ` · ${range}` : ''}
                    </p>
                  </div>
                  <Link to={`/checkin/${o._id}`} className="btn-primary btn-sm">
                    <Icon name="qr" className="h-3.5 w-3.5" />
                    Check in
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
