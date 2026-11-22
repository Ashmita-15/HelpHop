import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { api } from '../api/client.js';
import { Sprig, Wave } from '../components/Ornament.jsx';
import { Icon, Loading, formatDate, formatDateTime } from '../components/ui.jsx';

/**
 * The public page behind the QR printed on every certificate. No login:
 * anyone handed a certificate has to be able to confirm it in one scan.
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

  if (loading) return <Loading label="Checking the record…" />;

  const valid = result?.valid;

  const rows = valid
    ? [
        ['Volunteer', result.volunteerName],
        ['Event', result.eventTitle],
        ['Organisation', result.orgName],
        ['Where', result.eventLocation],
        ['Date of the event', result.eventDate && formatDate(result.eventDate)],
        ['Issued', result.issuedAt && formatDateTime(result.issuedAt)],
        ['Certificate ID', result.code],
      ].filter(([, value]) => value)
    : [];

  return (
    <div className="shell-narrow py-16 sm:py-20">
      <div className="card mx-auto max-w-xl overflow-hidden">
        {/* The header is set like the head of a printed certificate. */}
        <div
          className={`px-8 py-10 text-center ${valid ? 'bg-sage-50' : 'bg-terra-50'}`}
        >
          <span
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
              valid ? 'bg-sage-600 text-paper' : 'bg-terra-600 text-paper'
            }`}
          >
            <Icon name={valid ? 'shield' : 'close'} className="h-5 w-5" />
          </span>
          <h1
            className={`mt-5 font-serif text-2xl ${valid ? 'text-sage-900' : 'text-terra-800'}`}
          >
            {valid ? 'This certificate is genuine' : 'We don’t recognise this certificate'}
          </h1>
          <p className={`mt-2 text-sm ${valid ? 'text-sage-800' : 'text-terra-700'}`}>
            {valid
              ? 'Issued through HelpHop, and recorded against the event below.'
              : 'Nothing in our records matches that code.'}
          </p>
          {valid && <Wave className="mx-auto mt-6 h-4 w-20 text-sage-300" />}
        </div>

        {valid ? (
          <dl className="divide-y divide-bark-200/70">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="flex flex-wrap items-baseline gap-x-6 gap-y-1 px-8 py-4"
              >
                <dt className="w-36 shrink-0 text-[0.68rem] uppercase tracking-[0.16em] text-bark-400">
                  {label}
                </dt>
                <dd
                  className={`min-w-0 flex-1 text-sm text-bark-800 ${
                    label === 'Certificate ID' ? 'font-mono tracking-wide' : ''
                  }`}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="flex flex-col items-center gap-4 px-8 py-12 text-center">
            <Sprig className="h-7 w-7 text-oat-500" />
            <p className="max-w-sm text-sm leading-[1.8] text-bark-500">
              The code <span className="font-mono text-bark-700">{code}</span> isn’t in our
              records. Worth checking for typos — certificate IDs never contain the letters I, L,
              O or U.
            </p>
          </div>
        )}

        <div className="border-t border-bark-200/70 bg-oat-50 px-8 py-5">
          <Link to="/" className="btn-ghost btn-sm">
            <Icon name="arrowLeft" className="h-3.5 w-3.5" />
            Go to HelpHop
          </Link>
        </div>
      </div>
    </div>
  );
}
