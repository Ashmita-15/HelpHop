import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Icon, Spinner } from '../components/ui.jsx';

/**
 * Where a scanned event QR lands. The volunteer arrives from their phone
 * camera, so this does one thing and says plainly whether it worked.
 */
export default function Checkin() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const token = params.get('t');
  const { user, loading: authLoading } = useAuth();

  const [state, setState] = useState('working'); // working | done | error
  const [message, setMessage] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const attempted = useRef(false);

  useEffect(() => {
    if (authLoading || !user || attempted.current) return;
    attempted.current = true;

    if (!token) {
      setState('error');
      setMessage('That link is missing its code. Scan the QR on the organizer’s screen again.');
      return;
    }

    api
      .checkin(id, token)
      .then((res) => {
        setState('done');
        setMessage(res.message);
      })
      .catch((err) => {
        setState('error');
        setMessage(err.message);
      });

    api
      .getOpportunity(id)
      .then(({ opportunity }) => setEventTitle(opportunity.title))
      .catch(() => {});
  }, [authLoading, user, id, token]);

  const tone = { working: 'ink', done: 'brand', error: 'rose' }[state];

  return (
    <div className="shell-narrow py-20">
      <div className="card mx-auto max-w-md p-8 text-center">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
            tone === 'brand'
              ? 'bg-brand-50 text-brand-600'
              : tone === 'rose'
                ? 'bg-rose-50 text-rose-600'
                : 'bg-ink-100 text-ink-500'
          }`}
        >
          {state === 'working' ? (
            <Spinner className="h-6 w-6" />
          ) : (
            <Icon name={state === 'done' ? 'check' : 'close'} className="h-7 w-7" />
          )}
        </div>

        <h1 className="mt-5 text-xl font-bold tracking-tight text-ink-900">
          {state === 'working' && 'Checking you in…'}
          {state === 'done' && "You're checked in"}
          {state === 'error' && 'Check-in failed'}
        </h1>

        {eventTitle && <p className="mt-1 text-sm font-medium text-ink-600">{eventTitle}</p>}

        {state !== 'working' && (
          <div className="mt-4 text-left">
            <Alert type={state === 'done' ? 'success' : 'error'}>{message}</Alert>
          </div>
        )}

        {state === 'done' && (
          <p className="mt-4 text-sm text-ink-500">
            Your certificate appears on your dashboard once the organizer completes the event.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Link to="/dashboard" className="btn-primary">
            Go to dashboard
            <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
          <Link to={`/opportunities/${id}`} className="btn-outline">
            View the event
          </Link>
        </div>
      </div>
    </div>
  );
}
