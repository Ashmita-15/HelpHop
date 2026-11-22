import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { api } from '../api/client.js';
import { gigLabel } from '../lib/gig.js';
import { formatDateWithTime } from '../lib/time.js';
import { Sprig } from '../components/Ornament.jsx';
import { hasEnded, untilEnd } from '../lib/eventTime.js';
import {
  Alert,
  Avatar,
  Badge,
  Icon,
  Loading,
  Modal,
  PageHeader,
  Spinner,
  StatCard,
  formatDate,
  formatDateTime,
} from '../components/ui.jsx';

/** The QR rotates every 30s; refresh a little sooner so it never shows stale. */
const QR_REFRESH_MS = 25_000;
const ROSTER_POLL_MS = 10_000;

export default function ManageEvent() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [qr, setQr] = useState(null);
  const [qrError, setQrError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [gigs, setGigs] = useState(null);

  // Keeps the polling effects from writing state after unmount. Set on mount
  // as well as cleared on cleanup, so StrictMode's double-invoke in dev
  // doesn't leave it stuck false for the surviving mount.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadRoster = useCallback(
    async ({ quiet = false } = {}) => {
      try {
        const res = await api.attendance(id);
        if (mounted.current) setData(res);
      } catch (err) {
        if (!quiet && mounted.current) setError(err.message);
      } finally {
        if (!quiet && mounted.current) setLoading(false);
      }
    },
    [id]
  );

  const loadGigs = useCallback(async () => {
    try {
      const res = await api.opportunityGigs(id);
      if (mounted.current) setGigs(res.gigs);
    } catch {
      /* the roster is the primary view — a gig hiccup shouldn't blank it */
    }
  }, [id]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const completed = !!data?.opportunity?.completedAt;

  // Live roster: poll while the door is open, stop once the event is closed.
  useEffect(() => {
    if (completed) return undefined;
    const t = setInterval(() => loadRoster({ quiet: true }), ROSTER_POLL_MS);
    return () => clearInterval(t);
  }, [completed, loadRoster]);

  useEffect(() => {
    if (completed) loadGigs();
  }, [completed, loadGigs]);

  // Rotating check-in QR.
  useEffect(() => {
    if (completed) return undefined;

    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await api.checkinToken(id);
        if (!cancelled && mounted.current) {
          setQr(res);
          setQrError('');
        }
      } catch (err) {
        if (!cancelled && mounted.current) setQrError(err.message);
      }
    };

    refresh();
    const t = setInterval(refresh, QR_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [id, completed]);

  const toggle = async (row) => {
    setError('');
    setSavingId(row.volunteerId);
    try {
      await api.markAttendance(id, row.volunteerId, !row.present);
      await loadRoster({ quiet: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const complete = async ({ confirmNoAttendees = false } = {}) => {
    setError('');
    setCompleting(true);
    try {
      const res = await api.completeOpportunity(id, { confirmNoAttendees });
      setNotice(
        `All done — ${res.certificates} certificate${res.certificates === 1 ? '' : 's'}` +
          (res.awards ? ` and ${res.awards} reward${res.awards === 1 ? '' : 's'} issued.` : ' issued.')
      );
      setConfirming(false);
      await loadRoster({ quiet: true });
      await loadGigs();
    } catch (err) {
      setError(err.message);
      setConfirming(false);
    } finally {
      setCompleting(false);
    }
  };

  const reopen = async () => {
    setError('');
    setNotice('');
    setReopening(true);
    try {
      const res = await api.reopenOpportunity(id);
      setNotice(`${res.message}. Certificates already issued have been kept.`);
      await loadRoster({ quiet: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setReopening(false);
    }
  };

  const settle = async (gig) => {
    setError('');
    setSavingId(gig.id);
    try {
      await api.updateGig(gig.id, { status: gig.status === 'settled' ? 'pending' : 'settled' });
      await loadGigs();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <Loading label="Opening the register…" />;

  if (!data) {
    return (
      <div className="shell-narrow space-y-6 py-24 text-center">
        <Alert type="error">{error || 'We couldn’t find that event.'}</Alert>
        <Link to="/dashboard" className="btn-outline">
          <Icon name="arrowLeft" className="h-4 w-4" />
          Back to your desk
        </Link>
      </div>
    );
  }

  const { opportunity, counts, roster } = data;
  const gig = gigLabel(opportunity.gig);

  // Completion is gated on the event's real scheduled end, resolved by the
  // API into an instant — not on the calendar date, which used to leave an
  // event that finished at lunchtime looking like it was still to come.
  const ended = hasEnded(opportunity);
  const noneMarked = counts.present === 0;

  return (
    <div className="shell py-12 sm:py-16">
      <PageHeader
        eyebrow={completed ? 'A finished event' : 'On the day'}
        title={opportunity.title}
        description={formatDateWithTime(
          formatDate(opportunity.date),
          opportunity.startTime,
          opportunity.endTime
        )}
        actions={
          <Link to="/dashboard" className="btn-outline">
            <Icon name="arrowLeft" className="h-4 w-4" />
            Your desk
          </Link>
        }
      />

      <div className="mt-6 space-y-3">
        {error && (
          <Alert type="error" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}
        {notice && (
          <Alert type="success" onDismiss={() => setNotice('')}>
            {notice}
          </Alert>
        )}
        {completed && (
          <Alert type="info">
            <span className="flex flex-wrap items-center justify-between gap-3">
              <span>
                Completed {formatDateTime(opportunity.completedAt)}.{' '}
                {counts.present > 0
                  ? `${counts.present} certificate${counts.present === 1 ? '' : 's'} issued.`
                  : 'Nobody was marked present, so no certificates were issued.'}{' '}
                Attendance is locked.
              </span>
              <button
                type="button"
                className="btn-outline btn-sm shrink-0"
                onClick={reopen}
                disabled={reopening}
              >
                {reopening && <Spinner className="h-3.5 w-3.5" />}
                {reopening ? 'Reopening…' : 'Reopen to fix attendance'}
              </button>
            </span>
          </Alert>
        )}
      </div>

      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        <StatCard label="Checked in" value={counts.present} hint="So far today" />
        <StatCard label="Signed up" value={counts.registered} hint="Expected" tone="terra" />
        <StatCard
          label="Each volunteer gets"
          value={gig || 'A certificate'}
          hint={
            opportunity.gig?.mode === 'paid' ? 'Settled by you, outside HelpHop' : 'Plus a certificate'
          }
          tone="neutral"
        />
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-[21rem_1fr] lg:gap-14">
        {/* ------------------------------------------------------------ QR */}
        {!completed && (
          <section className="card h-fit p-6 text-center lg:sticky lg:top-28">
            <Sprig className="mx-auto h-5 w-5 text-sage-500" />
            <h2 className="mt-3 font-serif text-lg text-bark-700">Scan to check in</h2>
            <p className="mt-2 text-sm leading-relaxed text-bark-500">
              Put this on a screen at the door. It changes every thirty seconds, so a photo of it
              is no use later.
            </p>

            <div className="mt-5 flex aspect-square items-center justify-center rounded-field border border-bark-200 bg-paper p-3">
              {qrError ? (
                <p className="px-4 text-sm text-terra-700">{qrError}</p>
              ) : qr ? (
                <img
                  src={qr.qrDataUrl}
                  alt="Check-in QR code"
                  className="h-full w-full object-contain"
                />
              ) : (
                <Spinner className="h-7 w-7 text-sage-600" />
              )}
            </div>

            <div className="panel mt-5 px-4 py-4">
              <p className="eyebrow">Or read this out</p>
              <p className="mt-2 font-serif text-3xl tracking-[0.25em] text-bark-700">
                {qr?.code || '······'}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-bark-500">
                For anyone who can&apos;t scan — they type it in under Check in.
              </p>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-bark-400">
              People need to have claimed a place before they can check in.
            </p>
          </section>
        )}

        {/* -------------------------------------------------------- roster */}
        <section className={completed ? 'lg:col-span-2' : ''}>
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-bark-200/70 px-5 py-4">
              <div>
                <h2 className="font-serif text-lg text-bark-700">Who&apos;s here</h2>
                <p className="mt-0.5 text-sm text-bark-500">
                  {completed
                    ? 'The final register.'
                    : 'Tick anyone who signs in at the door by hand.'}
                </p>
              </div>
              {!completed && (
                <div className="text-right">
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={() => setConfirming(true)}
                    disabled={!ended}
                    title={ended ? undefined : 'You can complete this once the event has finished'}
                  >
                    <Icon name="check" className="h-3.5 w-3.5" />
                    Complete event
                  </button>
                  {!ended && (
                    <p className="mt-1.5 text-xs text-bark-400">
                      Available {untilEnd(opportunity)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {roster.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
                <Sprig className="h-7 w-7 text-sage-400" />
                <p className="font-serif text-lg text-bark-700">Nobody has joined yet</p>
                <p className="max-w-xs text-sm leading-relaxed text-bark-500">
                  Names will appear here as people claim a place.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-bark-200/70">
                {roster.map((row) => (
                  <li
                    key={row.volunteerId}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3.5"
                  >
                    <Avatar name={row.name} className="h-9 w-9" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-bark-800">{row.name}</p>
                      <p className="truncate text-xs text-bark-500">{row.email}</p>
                    </div>

                    {row.present && (
                      <Badge tone={row.method === 'qr' ? 'sage' : 'oat'} icon="check">
                        {row.method === 'qr' ? 'Scanned in' : 'Ticked off'}
                      </Badge>
                    )}

                    {!completed && (
                      <button
                        type="button"
                        onClick={() => toggle(row)}
                        disabled={savingId === row.volunteerId}
                        className={row.present ? 'btn-ghost btn-sm' : 'btn-outline btn-sm'}
                      >
                        {savingId === row.volunteerId ? (
                          <Spinner className="h-3.5 w-3.5" />
                        ) : row.present ? (
                          'Undo'
                        ) : (
                          'Mark present'
                        )}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ------------------------------------------------ what you owe */}
          {completed && gigs && gigs.length > 0 && (
            <div className="card mt-8 overflow-hidden">
              <div className="border-b border-bark-200/70 px-5 py-4">
                <h2 className="font-serif text-lg text-bark-700">Still to hand over</h2>
                <p className="mt-0.5 text-sm leading-relaxed text-bark-500">
                  Tick each one off once you have paid or handed it over. HelpHop only keeps the
                  record.
                </p>
              </div>
              <ul className="divide-y divide-bark-200/70">
                {gigs.map((g) => (
                  <li key={g.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-bark-800">{g.volunteer.name}</p>
                      <p className="truncate text-xs text-bark-500">{g.volunteer.email}</p>
                    </div>
                    <span className="text-sm text-bark-700">
                      {gigLabel({
                        mode: g.mode,
                        amount: g.amount,
                        currency: g.currency,
                        perkTitle: g.perkTitle,
                      })}
                    </span>
                    <Badge tone={g.status === 'settled' ? 'sage' : 'oat'}>
                      {g.status === 'settled' ? 'Settled' : 'Outstanding'}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => settle(g)}
                      disabled={savingId === g.id}
                      className={g.status === 'settled' ? 'btn-ghost btn-sm' : 'btn-outline btn-sm'}
                    >
                      {savingId === g.id ? (
                        <Spinner className="h-3.5 w-3.5" />
                      ) : g.status === 'settled' ? (
                        'Undo'
                      ) : (
                        'Mark settled'
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {confirming && (
        <Modal
          title="Complete this event?"
          subtitle="This is the step that issues everything."
          onClose={() => !completing && setConfirming(false)}
        >
          <div className="space-y-5 text-sm leading-relaxed text-bark-600">
            <p>
              <span className="font-serif text-xl text-bark-800">{counts.present}</span> of{' '}
              {counts.registered} volunteers are marked present.{' '}
              {noneMarked ? 'Nobody will receive anything.' : 'Each of them will receive:'}
            </p>

            {!noneMarked && (
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2.5">
                  <Icon name="certificate" className="h-4 w-4 text-sage-600" />
                  Their own certificate of participation
                </li>
                {gig && (
                  <li className="flex items-center gap-2.5">
                    <Icon
                      name={opportunity.gig.mode === 'paid' ? 'wallet' : 'gift'}
                      className="h-4 w-4 text-sage-600"
                    />
                    {gig}
                  </li>
                )}
              </ul>
            )}

            {noneMarked && counts.registered > 0 ? (
              <Alert type="warning">
                No certificates will be issued, because nobody has been ticked off the list. If
                people did turn up, close this and mark them present first — it only takes a
                moment, and it is what the certificates are generated from.
              </Alert>
            ) : (
              <Alert type="warning">
                Attendance locks afterwards and the event can no longer be edited. Anyone not
                marked present receives nothing. You can reopen the event if you need to correct
                it.
              </Alert>
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setConfirming(false)}
              disabled={completing}
            >
              Not yet
            </button>
            <button
              type="button"
              className={noneMarked && counts.registered > 0 ? 'btn-danger' : 'btn-primary'}
              onClick={() => complete({ confirmNoAttendees: noneMarked })}
              disabled={completing}
            >
              {completing && <Spinner className="h-4 w-4" />}
              {completing
                ? 'Issuing…'
                : noneMarked && counts.registered > 0
                  ? 'Nobody came — close it anyway'
                  : `Complete and issue to ${counts.present}`}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
