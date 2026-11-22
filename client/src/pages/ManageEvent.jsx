import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { api } from '../api/client.js';
import { gigLabel } from '../lib/gig.js';
import {
  Alert,
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

  useEffect(() => { loadRoster(); }, [loadRoster]);

  const completed = !!data?.opportunity?.completedAt;

  // Live roster: poll while the door is open, stop once the event is closed.
  useEffect(() => {
    if (completed) return undefined;
    const t = setInterval(() => loadRoster({ quiet: true }), ROSTER_POLL_MS);
    return () => clearInterval(t);
  }, [completed, loadRoster]);

  useEffect(() => { if (completed) loadGigs(); }, [completed, loadGigs]);

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
    return () => { cancelled = true; clearInterval(t); };
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

  const complete = async () => {
    setError('');
    setCompleting(true);
    try {
      const res = await api.completeOpportunity(id);
      setNotice(
        `Event completed — ${res.certificates} certificate${res.certificates === 1 ? '' : 's'}` +
          (res.awards ? ` and ${res.awards} gig${res.awards === 1 ? '' : 's'} issued.` : ' issued.')
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

  if (loading) return <Loading label="Loading event…" />;

  if (!data) {
    return (
      <div className="shell-narrow space-y-4 py-20 text-center">
        <Alert type="error">{error || 'Event not found.'}</Alert>
        <Link to="/dashboard" className="btn-outline">
          <Icon name="arrowLeft" className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>
    );
  }

  const { opportunity, counts, roster } = data;
  const gig = gigLabel(opportunity.gig);

  return (
    <div className="shell py-10 sm:py-12">
      <PageHeader
        eyebrow={completed ? 'Completed event' : 'Live attendance'}
        title={opportunity.title}
        description={`${formatDate(opportunity.date)} · ${counts.present} of ${counts.registered} volunteers checked in`}
        actions={
          <Link to="/dashboard" className="btn-outline">
            <Icon name="arrowLeft" className="h-4 w-4" />
            Dashboard
          </Link>
        }
      />

      <div className="space-y-4">
        {error && <Alert type="error" onDismiss={() => setError('')}>{error}</Alert>}
        {notice && <Alert type="success" onDismiss={() => setNotice('')}>{notice}</Alert>}
        {completed && (
          <Alert type="info">
            Completed {formatDateTime(opportunity.completedAt)}. Attendance is locked and
            certificates have been issued.
          </Alert>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Checked in" value={counts.present} icon="check" />
        <StatCard label="Registered" value={counts.registered} icon="users" tone="ocean" />
        <StatCard
          label="Reward each"
          value={gig || 'None'}
          icon={opportunity.gig?.mode === 'paid' ? 'wallet' : 'gift'}
          tone="neutral"
          hint={opportunity.gig?.mode === 'paid' ? 'Paid by you, outside the app' : undefined}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[22rem_1fr]">
        {/* ------------------------------------------------------------ QR */}
        {!completed && (
          <section className="card h-fit p-5 text-center">
            <h2 className="flex items-center justify-center gap-2 text-base font-semibold text-ink-900">
              <Icon name="qr" className="h-4 w-4 text-brand-600" />
              Scan to check in
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Show this on a screen at the door. It changes every 30 seconds, so a screenshot
              won&apos;t work later.
            </p>

            <div className="mt-4 flex aspect-square items-center justify-center rounded-xl border border-ink-200 bg-white p-3">
              {qrError ? (
                <p className="px-4 text-sm text-rose-700">{qrError}</p>
              ) : qr ? (
                <img src={qr.qrDataUrl} alt="Check-in QR code" className="h-full w-full object-contain" />
              ) : (
                <Spinner className="h-7 w-7 text-brand-600" />
              )}
            </div>

            <p className="mt-3 text-xs text-ink-400">
              Volunteers must have joined the event before they can check in.
            </p>
          </section>
        )}

        {/* -------------------------------------------------------- roster */}
        <section className={completed ? 'lg:col-span-2' : ''}>
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200/70 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-ink-900">Attendance</h2>
                <p className="mt-0.5 text-sm text-ink-500">
                  {completed ? 'Final roster.' : 'Tick anyone who signs in at the door by hand.'}
                </p>
              </div>
              {!completed && (
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={() => setConfirming(true)}
                  disabled={counts.registered === 0}
                >
                  <Icon name="check" className="h-3.5 w-3.5" />
                  Complete event
                </button>
              )}
            </div>

            {roster.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-ink-500">
                Nobody has joined this event yet.
              </p>
            ) : (
              <ul className="divide-y divide-ink-200/70">
                {roster.map((row) => (
                  <li key={row.volunteerId} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{row.name}</p>
                      <p className="truncate text-xs text-ink-500">{row.email}</p>
                    </div>

                    {row.present && (
                      <Badge tone={row.method === 'qr' ? 'brand' : 'ocean'} icon="check">
                        {row.method === 'qr' ? 'Scanned' : 'Manual'}
                      </Badge>
                    )}

                    {!completed && (
                      <button
                        type="button"
                        onClick={() => toggle(row)}
                        disabled={savingId === row.volunteerId}
                        className={row.present ? 'btn-outline btn-sm' : 'btn-secondary btn-sm'}
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

          {/* ---------------------------------------------------- gig table */}
          {completed && gigs && gigs.length > 0 && (
            <div className="card mt-6 overflow-hidden">
              <div className="border-b border-ink-200/70 px-5 py-4">
                <h2 className="text-base font-semibold text-ink-900">Gigs to settle</h2>
                <p className="mt-0.5 text-sm text-ink-500">
                  Mark each one once you&apos;ve paid or handed it over. VolunteerConnect only keeps
                  the record.
                </p>
              </div>
              <ul className="divide-y divide-ink-200/70">
                {gigs.map((g) => (
                  <li key={g.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{g.volunteer.name}</p>
                      <p className="truncate text-xs text-ink-500">{g.volunteer.email}</p>
                    </div>
                    <span className="text-sm font-semibold text-ink-700">
                      {gigLabel({ mode: g.mode, amount: g.amount, currency: g.currency, perkTitle: g.perkTitle })}
                    </span>
                    <Badge tone={g.status === 'settled' ? 'brand' : 'amber'}>
                      {g.status === 'settled' ? 'Settled' : 'Pending'}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => settle(g)}
                      disabled={savingId === g.id}
                      className={g.status === 'settled' ? 'btn-outline btn-sm' : 'btn-secondary btn-sm'}
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
          <div className="space-y-4 text-sm text-ink-600">
            <p>
              <strong className="text-ink-900">{counts.present}</strong> of {counts.registered}{' '}
              volunteers are marked present. They will each receive:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Icon name="certificate" className="h-4 w-4 text-brand-600" />
                A certificate of participation
              </li>
              {gig && (
                <li className="flex items-center gap-2">
                  <Icon
                    name={opportunity.gig.mode === 'paid' ? 'wallet' : 'gift'}
                    className="h-4 w-4 text-brand-600"
                  />
                  {gig}
                </li>
              )}
            </ul>
            <Alert type="warning">
              Attendance locks afterwards and the event can no longer be edited. Volunteers not
              marked present receive nothing.
            </Alert>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-outline" onClick={() => setConfirming(false)} disabled={completing}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={complete} disabled={completing}>
              {completing && <Spinner className="h-4 w-4" />}
              {completing ? 'Issuing…' : `Complete and issue to ${counts.present}`}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
