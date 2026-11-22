import { Link } from 'react-router-dom';
import { Badge, Icon, ProgressBar, formatDate } from './ui.jsx';
import { gigLabel, gigTone } from '../lib/gig.js';
import { formatDateWithTime } from '../lib/time.js';

/**
 * Summary card used on the landing page, the explore grid and both dashboards.
 * `footer` lets a dashboard slot in its own actions (edit/delete, etc).
 */
export default function OpportunityCard({ opportunity, footer }) {
  const {
    _id,
    title,
    category,
    location,
    date,
    requiredVolunteers,
    registeredCount = 0,
    organizationId,
    joined,
    gig,
    completedAt,
    startTime,
    endTime,
  } = opportunity;

  const orgName = organizationId?.name || 'An organization';
  const reward = gigLabel(gig);
  const full = registeredCount >= requiredVolunteers;
  const spotsLeft = Math.max(0, requiredVolunteers - registeredCount);

  return (
    <article className="card-interactive group flex h-full flex-col">
      <Link to={`/opportunities/${_id}`} className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone="brand">{category}</Badge>
          {joined && (
            <Badge tone="ocean" icon="check">
              Joined
            </Badge>
          )}
          {full && !joined && !completedAt && <Badge tone="amber">Full</Badge>}
          {completedAt && <Badge tone="neutral">Completed</Badge>}
          {reward && (
            <Badge tone={gigTone(gig)} icon={gig.mode === 'paid' ? 'wallet' : 'gift'}>
              {reward}
            </Badge>
          )}
        </div>

        <h3 className="text-lg font-semibold leading-snug tracking-tight text-ink-900 transition-colors duration-200 group-hover:text-brand-700">
          {title}
        </h3>

        <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-ink-500">
          <Icon name="building" className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{orgName}</span>
        </p>

        <dl className="mt-4 space-y-2 text-sm text-ink-600">
          <div className="flex items-center gap-2">
            <Icon name="pin" className="h-4 w-4 shrink-0 text-ink-400" />
            <dt className="sr-only">Location</dt>
            <dd className="truncate">{location}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="calendar" className="h-4 w-4 shrink-0 text-ink-400" />
            <dt className="sr-only">Date</dt>
            <dd>{formatDateWithTime(formatDate(date), startTime, endTime)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="users" className="h-4 w-4 shrink-0 text-ink-400" />
            <dt className="sr-only">Volunteers</dt>
            <dd>
              {registeredCount} of {requiredVolunteers} volunteers
            </dd>
          </div>
        </dl>

        <div className="mt-auto pt-5">
          <ProgressBar value={registeredCount} max={requiredVolunteers} />
          <p className="mt-2 text-xs font-medium text-ink-400">
            {full ? 'No spots left' : `${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} still open`}
          </p>
        </div>
      </Link>

      {footer && <div className="border-t border-ink-200/70 px-5 py-3">{footer}</div>}
    </article>
  );
}
