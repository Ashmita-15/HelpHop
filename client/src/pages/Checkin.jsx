import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { api } from '../api/client.js';
import QrScanner from '../components/QrScanner.jsx';
import { Alert, Icon, Loading, Spinner, formatDate } from '../components/ui.jsx';
import { formatTimeRange } from '../lib/time.js';

/** The QR encodes a full check-in URL; a typed code is just six digits. */
function tokenFromScan(text, opportunityId) {
  try {
    const url = new URL(text);
    const t = url.searchParams.get('t');
    // Guard against scanning a QR for a different event.
    if (t && url.pathname.includes(opportunityId)) return t;
    return t ? null : null;
  } catch {
    return /^\d{6}$/.test(text.trim()) ? text.trim() : null;
  }
}

export default function Checkin() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const urlToken = params.get('t');

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // null | 'scan' | 'code'
  const [code, setCode] = useState('');
  const [state, setState] = useState(urlToken ? 'working' : 'idle');
  const [message, setMessage] = useState('');
  const attempted = useRef(false);

  useEffect(() => {
    api
      .getOpportunity(id)
      .then(({ opportunity }) => setEvent(opportunity))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id]);

  const submit = useCallback(
    async (token) => {
      setState('working');
      setMessage('');
      try {
        const res = await api.checkin(id, token);
        setState('done');
        setMessage(res.message);
      } catch (err) {
        setState('error');
        setMessage(err.message);
      }
    },
    [id]
  );

  // Arrived from a scanned QR: check in immediately, once.
  useEffect(() => {
    if (!urlToken || attempted.current) return;
    attempted.current = true;
    submit(urlToken);
  }, [urlToken, submit]);

  const handleScan = useCallback(
    (text) => {
      const token = tokenFromScan(text, id);
      if (!token) {
        setState('error');
        setMessage('That QR is for a different event. Scan the one on this event’s screen.');
        setMode(null);
        return;
      }
      setMode(null);
      submit(token);
    },
    [id, submit]
  );

  if (loading) return <Loading label="Loading event…" />;

  const retry = () => {
    setState('idle');
    setMessage('');
    setCode('');
  };

  return (
    <div className="shell-narrow py-12 sm:py-16">
      <div className="card mx-auto max-w-md overflow-hidden">
        <div className="border-b border-ink-200/70 px-6 py-5 text-center">
          <p className="eyebrow">Check in</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-ink-900">
            {event?.title || 'This event'}
          </h1>
          {event && (
            <p className="mt-1 text-sm text-ink-500">
              {formatDate(event.date)}
              {formatTimeRange(event.startTime, event.endTime)
                ? ` · ${formatTimeRange(event.startTime, event.endTime)}`
                : ''}
            </p>
          )}
          {event?.venue && <p className="mt-0.5 text-sm text-ink-500">{event.venue}</p>}
        </div>

        <div className="px-6 py-6">
          {state === 'working' && (
            <div className="flex flex-col items-center gap-3 py-6 text-ink-500">
              <Spinner className="h-6 w-6 text-brand-600" />
              <p className="text-sm font-medium">Checking you in…</p>
            </div>
          )}

          {state === 'done' && (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Icon name="check" className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-ink-900">You&apos;re checked in</h2>
              <p className="mt-2 text-sm text-ink-500">
                Your certificate appears on your dashboard once the organizer completes the event.
              </p>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-4">
              <Alert type="error">{message}</Alert>
              <button type="button" className="btn-primary w-full" onClick={retry}>
                Try again
              </button>
            </div>
          )}

          {state === 'idle' && (
            <div className="space-y-5">
              {!mode && (
                <>
                  <p className="text-center text-sm text-ink-600">
                    The organizer has a QR code and a 6-digit code on screen. Use either one.
                  </p>
                  <div className="grid gap-2">
                    <button
                      type="button"
                      className="btn-primary w-full"
                      onClick={() => setMode('scan')}
                    >
                      <Icon name="qr" className="h-4 w-4" />
                      Scan the QR code
                    </button>
                    <button
                      type="button"
                      className="btn-outline w-full"
                      onClick={() => setMode('code')}
                    >
                      Enter the 6-digit code
                    </button>
                  </div>
                </>
              )}

              {mode === 'scan' && (
                <div className="space-y-3">
                  <QrScanner onResult={handleScan} />
                  <button
                    type="button"
                    className="btn-outline btn-sm w-full"
                    onClick={() => setMode('code')}
                  >
                    Enter the code instead
                  </button>
                </div>
              )}

              {mode === 'code' && (
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (/^\d{6}$/.test(code)) submit(code);
                  }}
                >
                  <label className="label" htmlFor="code">
                    6-digit code
                  </label>
                  <input
                    id="code"
                    className="input text-center text-2xl font-semibold tracking-[0.4em]"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoFocus
                  />
                  <p className="hint">It changes every 30 seconds — type the one showing now.</p>
                  <button type="submit" className="btn-primary w-full" disabled={code.length !== 6}>
                    Check in
                  </button>
                  <button
                    type="button"
                    className="btn-outline btn-sm w-full"
                    onClick={() => setMode('scan')}
                  >
                    Scan the QR instead
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-ink-200/70 px-6 py-4">
          <Link to="/dashboard" className="btn-outline btn-sm flex-1 justify-center">
            Dashboard
          </Link>
          <Link to={`/opportunities/${id}`} className="btn-outline btn-sm flex-1 justify-center">
            View event
          </Link>
        </div>
      </div>
    </div>
  );
}
