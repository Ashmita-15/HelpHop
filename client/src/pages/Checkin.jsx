import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { api } from '../api/client.js';
import QrScanner from '../components/QrScanner.jsx';
import { Sprig } from '../components/Ornament.jsx';
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
        setMessage('That code belongs to a different event. Scan the one on this event’s screen.');
        setMode(null);
        return;
      }
      setMode(null);
      submit(token);
    },
    [id, submit]
  );

  if (loading) return <Loading label="Finding the event…" />;

  const retry = () => {
    setState('idle');
    setMessage('');
    setCode('');
  };

  const timeRange = event ? formatTimeRange(event.startTime, event.endTime) : '';

  return (
    <div className="shell-narrow py-14 sm:py-20">
      <div className="card mx-auto max-w-md overflow-hidden">
        <div className="border-b border-bark-200/70 bg-oat-50 px-6 py-7 text-center">
          <Sprig className="mx-auto h-5 w-5 text-sage-500" />
          <p className="eyebrow mt-3">You&apos;re here</p>
          <h1 className="mt-2 font-serif text-xl leading-snug text-bark-700">
            {event?.title || 'This event'}
          </h1>
          {event && (
            <p className="mt-2 text-sm text-bark-500">
              {formatDate(event.date)}
              {timeRange ? ` · ${timeRange}` : ''}
            </p>
          )}
          {event?.venue && <p className="mt-0.5 text-sm text-bark-500">{event.venue}</p>}
        </div>

        <div className="px-6 py-7">
          {state === 'working' && (
            <div className="flex flex-col items-center gap-3 py-8 text-bark-500">
              <Spinner className="h-6 w-6 text-sage-600" />
              <p className="font-serif text-sm italic">Marking you present…</p>
            </div>
          )}

          {state === 'done' && (
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage-100 text-sage-700">
                <Icon name="check" className="h-7 w-7" />
              </span>
              <h2 className="mt-5 font-serif text-xl text-bark-700">That&apos;s you, checked in</h2>
              <p className="mt-3 text-sm leading-relaxed text-bark-500">
                {message || 'Thanks for coming.'} Your certificate will appear on your shelf once
                the organiser closes the event.
              </p>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-5">
              <Alert type="error">{message}</Alert>
              <button type="button" className="btn-primary w-full" onClick={retry}>
                Try again
              </button>
            </div>
          )}

          {state === 'idle' && (
            <div className="space-y-6">
              {!mode && (
                <>
                  <p className="text-center text-sm leading-relaxed text-bark-600">
                    The organiser has a QR code and a six-digit number on screen. Either one works.
                  </p>
                  <div className="grid gap-2">
                    <button type="button" className="btn-primary w-full" onClick={() => setMode('scan')}>
                      <Icon name="qr" className="h-4 w-4" />
                      Scan the QR code
                    </button>
                    <button type="button" className="btn-outline w-full" onClick={() => setMode('code')}>
                      Type the six-digit number
                    </button>
                  </div>
                </>
              )}

              {mode === 'scan' && (
                <div className="space-y-3">
                  <QrScanner onResult={handleScan} />
                  <button
                    type="button"
                    className="btn-ghost btn-sm w-full"
                    onClick={() => setMode('code')}
                  >
                    Type the number instead
                  </button>
                </div>
              )}

              {mode === 'code' && (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (/^\d{6}$/.test(code)) submit(code);
                  }}
                >
                  <div>
                    <label className="label text-center" htmlFor="code">
                      Six-digit number
                    </label>
                    <input
                      id="code"
                      className="input text-center font-serif text-3xl tracking-[0.3em]"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="\d{6}"
                      maxLength={6}
                      placeholder="000000"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      autoFocus
                    />
                    <p className="hint mt-2 text-center">
                      It changes every thirty seconds — use the one showing now.
                    </p>
                  </div>
                  <button type="submit" className="btn-primary w-full" disabled={code.length !== 6}>
                    Check me in
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm w-full"
                    onClick={() => setMode('scan')}
                  >
                    Scan the QR instead
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-bark-200/70 px-6 py-4">
          <Link to="/dashboard" className="btn-ghost btn-sm flex-1 justify-center">
            Your shelf
          </Link>
          <Link to={`/opportunities/${id}`} className="btn-ghost btn-sm flex-1 justify-center">
            View the event
          </Link>
        </div>
      </div>
    </div>
  );
}
