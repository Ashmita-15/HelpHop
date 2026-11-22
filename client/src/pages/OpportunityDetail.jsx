import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Sprig } from '../components/Ornament.jsx';
import {
  Alert,
  Avatar,
  Badge,
  Icon,
  Loading,
  Photo,
  ProgressBar,
  Spinner,
  formatDate,
} from '../components/ui.jsx';
import { gigLabel } from '../lib/gig.js';
import { formatTimeRange } from '../lib/time.js';
import { opportunityPhoto } from '../lib/imagery.js';

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isVolunteer, isOrganization } = useAuth();

  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [joining, setJoining] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getOpportunity(id)
      .then(({ opportunity: o }) => {
        setOpportunity(o);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  const handleJoin = async () => {
    setError('');
    setJoining(true);
    try {
      const res = await api.joinOpportunity(id);
      setSuccess(res.message);
      setOpportunity((o) => ({
        ...o,
        joined: true,
        registeredCount: res.registeredCount,
        spotsLeft: Math.max(0, o.requiredVolunteers - res.registeredCount),
      }));
    } catch (err) {
      setError(err.message);
      // A 409 means our view is stale (already joined, or now full) — refresh it.
      if (err.status === 409) load();
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <Loading label="Opening the listing…" />;

  if (!opportunity) {
    return (
      <div className="shell-narrow space-y-6 py-24 text-center">
        <Alert type="error">{error || 'We couldn’t find that opportunity.'}</Alert>
        <Link to="/opportunities" className="btn-outline">
          <Icon name="arrowLeft" className="h-4 w-4" />
          Back to all opportunities
        </Link>
      </div>
    );
  }

  const {
    title,
    description,
    category,
    location,
    date,
    requiredVolunteers,
    registeredCount,
    spotsLeft,
    organizationId,
    joined,
    attended,
    gig,
    completedAt,
    venue,
    startTime,
    endTime,
  } = opportunity;

  const reward = gigLabel(gig);
  const timeRange = formatTimeRange(startTime, endTime);
  const eventDay = new Date(date);
  const now = new Date();
  const isToday =
    eventDay.getFullYear() === now.getFullYear() &&
    eventDay.getMonth() === now.getMonth() &&
    eventDay.getDate() === now.getDate();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const finished = !!completedAt || new Date(date) < startOfToday;
  const isOwner = isOrganization && organizationId?._id === user?.id;
  const full = spotsLeft === 0;
  const orgName = organizationId?.name || 'A local organisation';

  return (
    <div className="pb-24">
      <div className="shell pt-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-bark-500 transition-colors hover:text-bark-800"
        >
          <Icon name="arrowLeft" className="h-4 w-4" />
          Back
        </button>
      </div>

      {/* ------------------------------------------------------------ title */}
      <header className="shell mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-16">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <Sprig className="h-3.5 w-3.5 text-sage-500" />
            {category}
          </p>
          <h1 className="h-title mt-5">{title}</h1>

          <div className="mt-6 flex items-center gap-3">
            <Avatar name={orgName} className="h-11 w-11" />
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-bark-400">Hosted by</p>
              <p className="font-serif text-lg text-bark-700">{orgName}</p>
            </div>
          </div>

          {(joined || full || completedAt || attended) && (
            <div className="mt-6 flex flex-wrap gap-2">
              {joined && (
                <Badge tone="sage" icon="check">
                  You&apos;re going
                </Badge>
              )}
              {attended && (
                <Badge tone="sage" icon="check">
                  You attended
                </Badge>
              )}
              {full && !joined && !completedAt && <Badge tone="oat">Fully signed up</Badge>}
              {completedAt && <Badge tone="neutral">Finished</Badge>}
            </div>
          )}
        </div>

        <div className="photo-frame aspect-[3/2]">
          <Photo
            id={opportunityPhoto({ ...opportunity, _id: id })}
            alt={`${category} volunteering`}
            width={760}
            ratio={3 / 2}
            eager
          />
        </div>
      </header>

      <div className="shell mt-6 space-y-3">
        {success && (
          <Alert type="success" onDismiss={() => setSuccess('')}>
            {success}{' '}
            <Link to="/dashboard" className="link">
              See it on your shelf
            </Link>
          </Alert>
        )}
        {error && (
          <Alert type="error" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}
      </div>

      {/* ------------------------------------------------------------- body */}
      <div className="shell mt-12 grid gap-12 lg:grid-cols-[1fr_20rem] lg:gap-16">
        <article>
          <h2 className="eyebrow">What you&apos;d be doing</h2>
          <div className="prose-warm mt-5 whitespace-pre-line">{description}</div>

          {reward && (
            <div className="panel mt-10 p-6">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 shrink-0 text-terra-600">
                  <Icon name={gig.mode === 'paid' ? 'wallet' : 'gift'} className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-serif text-lg text-bark-700">
                    {gig.mode === 'paid' ? `${reward} for each volunteer` : reward}
                  </h3>
                  {gig.perkDescription && (
                    <p className="mt-2 text-sm leading-[1.8] text-bark-600">{gig.perkDescription}</p>
                  )}
                  <p className="mt-3 text-xs leading-relaxed text-bark-500">
                    Given to everyone marked present, alongside a certificate. The organisation
                    settles it with you directly — HelpHop only keeps the record.
                  </p>
                </div>
              </div>
            </div>
          )}
        </article>

        {/* --------------------------------------------------------- aside */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card overflow-hidden">
            <dl className="divide-y divide-bark-200/70">
              <Detail
                icon="pin"
                label="Where"
                value={
                  venue ? (
                    <>
                      {venue}
                      <span className="mt-0.5 block text-bark-500">{location}</span>
                    </>
                  ) : (
                    location
                  )
                }
              />
              <Detail
                icon="calendar"
                label={timeRange ? 'When' : 'Date'}
                value={
                  <>
                    {formatDate(date)}
                    {timeRange && <span className="mt-0.5 block text-bark-500">{timeRange}</span>}
                  </>
                }
              />
              <Detail
                icon="users"
                label="Volunteers"
                value={
                  <>
                    {registeredCount} of {requiredVolunteers} signed up
                    <span className="mt-2.5 block">
                      <ProgressBar value={registeredCount} max={requiredVolunteers} />
                    </span>
                    <span className="mt-2 block text-xs font-normal text-bark-500">
                      {full ? 'No places left' : `${spotsLeft} still open`}
                    </span>
                  </>
                }
              />
            </dl>

            {/* ------------------------------------------------- actions */}
            <div className="border-t border-bark-200/70 bg-oat-50 p-5">
              {finished && (
                <p className="flex items-center gap-2 text-sm text-bark-500">
                  <Icon name="clock" className="h-4 w-4 text-bark-400" />
                  This event has finished.
                </p>
              )}

              {!user && !finished && (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-bark-600">
                    Sign in as a volunteer to claim a place on this shift.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link to="/register" className="btn-primary w-full">
                      Create an account
                    </Link>
                    <Link to="/login" className="btn-outline w-full">
                      Sign in
                    </Link>
                  </div>
                </div>
              )}

              {isVolunteer && finished && joined && (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-bark-600">
                    {attended
                      ? 'You were there. Thank you.'
                      : 'You signed up, but weren’t marked present on the day.'}
                  </p>
                  <Link to="/dashboard" className="btn-outline w-full">
                    {attended ? 'View your certificate' : 'Go to your shelf'}
                  </Link>
                </div>
              )}

              {isVolunteer && !finished && joined && isToday && !attended && (
                <div className="mb-4 rounded-field border border-sage-200 bg-sage-50 p-4">
                  <p className="text-sm leading-relaxed text-sage-800">
                    This is happening today — mark yourself present when you arrive.
                  </p>
                  <Link to={`/checkin/${opportunity._id}`} className="btn-primary btn-sm mt-3 w-full">
                    <Icon name="qr" className="h-3.5 w-3.5" />
                    Check in
                  </Link>
                </div>
              )}

              {isVolunteer && !finished && joined && attended && (
                <p className="mb-4 flex items-center gap-2 text-sm text-sage-700">
                  <Icon name="check" className="h-4 w-4" />
                  You&apos;re checked in for today.
                </p>
              )}

              {isVolunteer &&
                !finished &&
                (joined ? (
                  <div className="space-y-4">
                    <p className="flex items-start gap-2.5 text-sm leading-relaxed text-sage-700">
                      <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0" />
                      Your place is saved — see you there.
                    </p>
                    <Link to="/dashboard" className="btn-outline w-full">
                      Go to your shelf
                    </Link>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-primary w-full"
                    onClick={handleJoin}
                    disabled={joining || full}
                  >
                    {joining && <Spinner className="h-4 w-4" />}
                    {full ? 'All places are taken' : joining ? 'Saving your place…' : 'Count me in'}
                    {!joining && !full && <Icon name="arrowRight" className="h-4 w-4" />}
                  </button>
                ))}

              {isOrganization &&
                (isOwner ? (
                  <div className="flex flex-col gap-2">
                    <Link to={`/opportunities/${id}/manage`} className="btn-secondary w-full">
                      <Icon name="users" className="h-4 w-4" />
                      {completedAt ? 'View results' : 'Attendance and volunteers'}
                    </Link>
                    {!completedAt && (
                      <Link to={`/opportunities/${id}/edit`} className="btn-outline w-full">
                        <Icon name="edit" className="h-4 w-4" />
                        Edit this listing
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-bark-500">
                    You&apos;re signed in as an organisation. Only volunteer accounts can claim a
                    place.
                  </p>
                ))}
            </div>
          </div>

          <p className="mt-5 px-1 text-xs leading-relaxed text-bark-400">
            Plans change. If you can no longer make it, let the organisation know so the place can
            go to someone else.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Detail({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3.5 px-5 py-4">
      <span className="mt-0.5 shrink-0 text-sage-600">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[0.68rem] uppercase tracking-[0.16em] text-bark-400">{label}</dt>
        <dd className="mt-1 text-sm font-medium leading-relaxed text-bark-700">{value}</dd>
      </div>
    </div>
  );
}
