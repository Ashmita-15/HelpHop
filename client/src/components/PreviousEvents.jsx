import { useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api/client.js';
import { gigLabel } from '../lib/gig.js';
import { certificateFilename, saveBlob } from '../lib/download.js';
import { formatDateWithTime } from '../lib/time.js';
import { Alert, Badge, Icon, Spinner, formatDate } from './ui.jsx';

const COLLAPSE_AFTER = 6;

/**
 * A volunteer's finished events. Deliberately quieter than the upcoming cards —
 * this is a record of what happened, not something to act on.
 */
export default function PreviousEvents({ events }) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');

  if (!events || events.length === 0) return null;

  const collapsible = events.length > COLLAPSE_AFTER;
  const visible = collapsible && !expanded ? events.slice(0, COLLAPSE_AFTER) : events;

  const download = async (event) => {
    setError('');
    setDownloading(event.certificateId);
    try {
      const blob = await api.certificatePdf(event.certificateId);
      saveBlob(blob, certificateFilename(event.certificateCode));
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <section className="mt-10">
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink-900">
        <Icon name="clock" className="h-4 w-4 text-ink-400" />
        Previous events
      </h2>
      <p className="mt-1 text-sm text-ink-500">
        Shifts that have already happened, newest first.
      </p>

      {error && (
        <div className="mt-4">
          <Alert type="error" onDismiss={() => setError('')}>
            {error}
          </Alert>
        </div>
      )}

      <ul className="card mt-4 divide-y divide-ink-200/70">
        {visible.map((event) => {
          const reward = event.attended ? gigLabel(event.gig) : null;

          return (
            <li key={event._id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-4">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/opportunities/${event._id}`}
                  className="truncate text-sm font-semibold text-ink-700 transition-colors hover:text-brand-700"
                >
                  {event.title}
                </Link>
                <p className="mt-0.5 truncate text-xs text-ink-500">
                  {event.organizationId?.name || 'An organization'} ·{' '}
                  {formatDateWithTime(formatDate(event.date), event.startTime, event.endTime)}
                </p>
              </div>

              {event.attended ? (
                <Badge tone="brand" icon="check">
                  Attended
                </Badge>
              ) : (
                <span className="text-xs font-medium text-ink-400">Didn&apos;t attend</span>
              )}

              {reward && (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-700">
                  {reward}
                  <Badge tone={event.gig.status === 'settled' ? 'brand' : 'amber'}>
                    {event.gig.status === 'settled' ? 'Received' : 'Awaiting'}
                  </Badge>
                </span>
              )}

              {event.certificateCode && (
                <div className="flex items-center gap-1.5">
                  <Link
                    to={`/verify/${event.certificateCode}`}
                    className="btn-outline btn-sm"
                    title="Public verification page for this certificate"
                  >
                    <Icon name="shield" className="h-3.5 w-3.5" />
                    Verify
                  </Link>
                  <button
                    type="button"
                    onClick={() => download(event)}
                    disabled={downloading === event.certificateId}
                    className="btn-secondary btn-sm"
                  >
                    {downloading === event.certificateId ? (
                      <Spinner className="h-3.5 w-3.5" />
                    ) : (
                      <Icon name="download" className="h-3.5 w-3.5" />
                    )}
                    Certificate
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="btn-outline btn-sm mt-3"
        >
          {expanded ? 'Show fewer' : `Show previous events (${events.length})`}
        </button>
      )}
    </section>
  );
}
