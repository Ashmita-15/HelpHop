import { Link } from 'react-router-dom';
import { Badge, Icon, Photo, ProgressBar, formatDate } from './ui.jsx';
import { gigLabel, gigTone } from '../lib/gig.js';
import { formatDateWithTime } from '../lib/time.js';
import { opportunityPhoto } from '../lib/imagery.js';

/**
 * The opportunity card, used on the landing page, the explore grid and both
 * dashboards. `footer` lets a dashboard slot its own actions underneath
 * without the card needing to know anything about roles.
 */
export default function OpportunityCard({ opportunity, footer, featured = false }) {
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

  const orgName = organizationId?.name || 'A local organisation';
  const reward = gigLabel(gig);
  const full = registeredCount >= requiredVolunteers;
  const spotsLeft = Math.max(0, requiredVolunteers - registeredCount);

  return (
    <article className={`card-interactive group flex h-full flex-col overflow-hidden ${featured ? 'sm:flex-row' : ''}`}>
      <Link
        to={`/opportunities/${_id}`}
        className={`flex flex-1 flex-col ${featured ? 'sm:flex-row' : ''}`}
      >
        {/* On the featured card the picture stretches to whatever height the
            copy needs, so the row never opens up a gap under the text. */}
        <div
          className={`relative shrink-0 overflow-hidden bg-oat-200 ${
            featured ? 'aspect-[4/3] sm:aspect-auto sm:w-[42%] sm:self-stretch' : 'aspect-[3/2]'
          }`}
        >
          <Photo
            id={opportunityPhoto(opportunity)}
            alt={`${category} volunteering`}
            width={featured ? 700 : 520}
            ratio={featured ? 4 / 5 : 3 / 2}
            className={`transition-transform duration-[900ms] ease-natural group-hover:scale-[1.03] ${
              featured ? 'sm:absolute sm:inset-0' : ''
            }`}
          />
          <span className="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-bark-600 backdrop-blur-sm">
            {category}
          </span>
        </div>

        <div className={`flex flex-1 flex-col p-5 ${featured ? 'sm:p-7' : ''}`}>
          {(joined || full || completedAt || reward) && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              {joined && (
                <Badge tone="sage" icon="check">
                  You&apos;re going
                </Badge>
              )}
              {full && !joined && !completedAt && <Badge tone="oat">Fully signed up</Badge>}
              {completedAt && <Badge tone="neutral">Finished</Badge>}
              {reward && (
                <Badge tone={gigTone(gig)} icon={gig.mode === 'paid' ? 'wallet' : 'gift'}>
                  {reward}
                </Badge>
              )}
            </div>
          )}

          <h3
            className={`font-serif leading-snug text-bark-700 transition-colors duration-200 group-hover:text-sage-700 ${
              featured ? 'text-2xl' : 'text-lg'
            }`}
          >
            {title}
          </h3>

          <p className="mt-1.5 truncate text-sm text-bark-500">{orgName}</p>

          {featured && opportunity.description && (
            <p className="mt-3 line-clamp-3 text-sm leading-[1.75] text-bark-500">
              {opportunity.description}
            </p>
          )}

          <dl className="mt-4 space-y-2 text-sm text-bark-600">
            <div className="flex items-start gap-2.5">
              <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-bark-400" />
              <dt className="sr-only">Where</dt>
              <dd className="truncate">{location}</dd>
            </div>
            <div className="flex items-start gap-2.5">
              <Icon name="calendar" className="mt-0.5 h-4 w-4 shrink-0 text-bark-400" />
              <dt className="sr-only">When</dt>
              <dd>{formatDateWithTime(formatDate(date), startTime, endTime)}</dd>
            </div>
          </dl>

          <div className={`mt-auto ${featured ? 'pt-7' : 'pt-6'}`}>
            <div className="mb-2 flex items-baseline justify-between gap-3 text-xs">
              <span className="text-bark-500">
                {registeredCount} of {requiredVolunteers} signed up
              </span>
              <span className={full ? 'text-bark-400' : 'text-sage-700'}>
                {full
                  ? 'No places left'
                  : `${spotsLeft} ${spotsLeft === 1 ? 'place' : 'places'} open`}
              </span>
            </div>
            <ProgressBar value={registeredCount} max={requiredVolunteers} />
          </div>
        </div>
      </Link>

      {footer && <div className="border-t border-bark-200/70 bg-oat-50/60 px-5 py-3">{footer}</div>}
    </article>
  );
}
