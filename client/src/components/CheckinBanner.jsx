import { Link } from 'react-router-dom';

import { Icon } from './ui.jsx';
import { Sprig } from './Ornament.jsx';
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
 * Check-in is only findable if it is put in front of the volunteer on the
 * day. Shows today's claimed events with a direct way in; renders nothing
 * on every other day.
 */
export default function CheckinBanner({ events = [] }) {
  const today = events.filter((o) => isToday(o.date) && !o.completedAt && !o.attended);
  if (today.length === 0) return null;

  return (
    <section className="mt-10 rounded-card border border-sage-200 bg-sage-50 p-6 sm:p-7">
      <div className="flex items-start gap-4">
        <Sprig className="mt-0.5 hidden h-6 w-6 shrink-0 text-sage-500 sm:block" />
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl text-sage-900">
            {today.length === 1 ? 'Today’s the day' : `${today.length} things on today`}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-sage-800">
            Scan the organiser&apos;s QR code, or type the six-digit number they read out, to mark
            yourself present.
          </p>

          <ul className="mt-5 space-y-2.5">
            {today.map((o) => {
              const range = formatTimeRange(o.startTime, o.endTime);
              return (
                <li
                  key={o._id}
                  className="flex flex-wrap items-center gap-3 rounded-field border border-sage-200/80 bg-paper px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-bark-800">{o.title}</p>
                    <p className="truncate text-xs text-bark-500">
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
