import { useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api/client.js';
import { gigLabel } from '../lib/gig.js';
import { certificateFilename, saveBlob } from '../lib/download.js';
import { formatDateWithTime } from '../lib/time.js';
import { Alert, Badge, Icon, Spinner, formatDate } from './ui.jsx';

const COLLAPSE_AFTER = 6;

/**
 * A volunteer's finished events. Deliberately quieter than the upcoming
 * cards — this is a record of what happened, not something to act on.
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
    <section className="mt-16">
      <div className="border-b border-bark-200/70 pb-4">
        <h2 className="font-serif text-xl text-bark-700">Where you’ve been</h2>
        <p className="mt-1.5 text-sm text-bark-500">Everything that has already happened, newest first.</p>
      </div>

      {error && (
        <div className="mt-5">
          <Alert type="error" onDismiss={() => setError('')}>
            {error}
          </Alert>
        </div>
      )}

      <ul className="divide-y divide-bark-200/70">
        {visible.map((event) => {
          const reward = event.attended ? gigLabel(event.gig) : null;

          return (
            <li key={event._id} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-5">
              <div className="min-w-0 flex-1 basis-56">
                <Link
                  to={`/opportunities/${event._id}`}
                  className="font-serif text-base text-bark-700 transition-colors hover:text-sage-700"
                >
                  {event.title}
                </Link>
                <p className="mt-1 truncate text-xs text-bark-500">
                  {event.organizationId?.name || 'A local organisation'} ·{' '}
                  {formatDateWithTime(formatDate(event.date), event.startTime, event.endTime)}
                </p>
              </div>

              {event.attended ? (
                <Badge tone="sage" icon="check">
                  Attended
                </Badge>
              ) : (
                <span className="text-xs text-bark-400">Didn&apos;t make it</span>
              )}

              {reward && (
                <span className="flex items-center gap-2 text-sm text-bark-700">
                  {reward}
                  <Badge tone={event.gig.status === 'settled' ? 'sage' : 'oat'}>
                    {event.gig.status === 'settled' ? 'Received' : 'Awaiting'}
                  </Badge>
                </span>
              )}

              {event.certificateCode && (
                <div className="flex items-center gap-1.5">
                  <Link
                    to={`/verify/${event.certificateCode}`}
                    className="btn-ghost btn-sm"
                    title="The public page anyone can use to verify this certificate"
                  >
                    <Icon name="shield" className="h-3.5 w-3.5" />
                    Verify
                  </Link>
                  <button
                    type="button"
                    onClick={() => download(event)}
                    disabled={downloading === event.certificateId}
                    className="btn-outline btn-sm"
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
        <button type="button" onClick={() => setExpanded((v) => !v)} className="link mt-5 text-sm">
          {expanded ? 'Show fewer' : `Show all ${events.length}`}
        </button>
      )}
    </section>
  );
}
