import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { api } from '../api/client.js';
import { Icon, Loading, formatDate, formatDateTime } from '../components/ui.jsx';

/**
 * Public page behind the QR printed on every certificate. No login: anyone
 * handed a certificate must be able to confirm it in one scan.
 */
export default function VerifyCertificate() {
  const { code } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .verifyCertificate(code)
      .then(setResult)
      .catch(() => setResult({ valid: false }))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <Loading label="Checking certificate…" />;

  const valid = result?.valid;

  return (
    <div className="shell-narrow py-16">
      <div className="card mx-auto max-w-lg overflow-hidden">
        <div
          className={`flex items-center gap-3 px-6 py-5 ${
            valid ? 'bg-brand-50 text-brand-800' : 'bg-rose-50 text-rose-800'
          }`}
        >
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              valid ? 'bg-brand-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            <Icon name={valid ? 'shield' : 'close'} className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              {valid ? 'Genuine certificate' : 'Not a valid certificate'}
            </h1>
            <p className="text-sm opacity-80">
              {valid
                ? 'Issued through VolunteerConnect.'
                : 'No certificate matches this code.'}
            </p>
          </div>
        </div>

        {valid ? (
          <dl className="divide-y divide-ink-200/70">
            {[
              ['Volunteer', result.volunteerName],
              ['Event', result.eventTitle],
              ['Organization', result.orgName],
              ['Location', result.eventLocation],
              ['Event date', result.eventDate && formatDate(result.eventDate)],
              ['Issued', result.issuedAt && formatDateTime(result.issuedAt)],
              ['Certificate ID', result.code],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-6 py-3.5">
                  <dt className="w-32 shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-400">
                    {label}
                  </dt>
                  <dd
                    className={`min-w-0 flex-1 text-sm font-medium text-ink-900 ${
                      label === 'Certificate ID' ? 'font-mono tracking-wide' : ''
                    }`}
                  >
                    {value}
                  </dd>
                </div>
              ))}
          </dl>
        ) : (
          <div className="px-6 py-8 text-sm leading-relaxed text-ink-500">
            <p>
              The code <span className="font-mono font-semibold text-ink-700">{code}</span> is not in
              our records. Check for typos — certificate IDs never contain the letters I, L, O or U.
            </p>
          </div>
        )}

        <div className="border-t border-ink-200/70 px-6 py-4">
          <Link to="/" className="btn-outline btn-sm">
            <Icon name="arrowLeft" className="h-3.5 w-3.5" />
            Go to VolunteerConnect
          </Link>
        </div>
      </div>
    </div>
  );
}
