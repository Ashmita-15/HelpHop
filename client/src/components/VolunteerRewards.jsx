import { useEffect, useState } from 'react';

import { api } from '../api/client.js';
import { gigLabel } from '../lib/gig.js';
import { Alert, Badge, Icon, Spinner, formatDate } from './ui.jsx';

/** Triggers a browser save of a PDF blob, then releases the object URL. */
function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** A volunteer's earned gigs and certificates, shown under their dashboard. */
export default function VolunteerRewards() {
  const [gigs, setGigs] = useState(null);
  const [certificates, setCertificates] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    Promise.all([api.myGigs(), api.myCertificates()])
      .then(([g, c]) => {
        setGigs(g.gigs);
        setCertificates(c.certificates);
      })
      .catch((err) => setError(err.message));
  }, []);

  const download = async (cert) => {
    setError('');
    setDownloading(cert.id);
    try {
      const blob = await api.certificatePdf(cert.id);
      saveBlob(blob, `volunteerconnect-certificate-${cert.code}.pdf`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(null);
    }
  };

  // Nothing earned yet: stay quiet rather than showing two empty boxes.
  if (!gigs || !certificates) return null;
  if (gigs.length === 0 && certificates.length === 0) return null;

  return (
    <div className="mt-10 space-y-6">
      {error && <Alert type="error" onDismiss={() => setError('')}>{error}</Alert>}

      {gigs.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink-900">
            <Icon name="gift" className="h-4 w-4 text-brand-600" />
            Your gigs
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Earned by attending. The organization settles these directly with you.
          </p>

          <ul className="card mt-4 divide-y divide-ink-200/70">
            {gigs.map((g) => (
              <li key={g._id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {g.opportunity?.title || 'Event removed'}
                  </p>
                  <p className="truncate text-xs text-ink-500">
                    {g.opportunity?.organization}
                    {g.opportunity?.date ? ` · ${formatDate(g.opportunity.date)}` : ''}
                  </p>
                </div>
                <span className="text-sm font-semibold text-ink-900">
                  {gigLabel({
                    mode: g.mode,
                    amount: g.amount,
                    currency: g.currency,
                    perkTitle: g.perkTitle,
                  })}
                </span>
                <Badge tone={g.status === 'settled' ? 'brand' : 'amber'}>
                  {g.status === 'settled' ? 'Received' : 'Awaiting'}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {certificates.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink-900">
            <Icon name="certificate" className="h-4 w-4 text-brand-600" />
            Your certificates
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Each one carries a QR anybody can scan to confirm it is genuine.
          </p>

          <ul className="card mt-4 divide-y divide-ink-200/70">
            {certificates.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{c.opportunity.title}</p>
                  <p className="truncate text-xs text-ink-500">
                    {c.opportunity.organization} · Issued {formatDate(c.issuedAt)}
                  </p>
                </div>
                <code className="hidden text-xs font-semibold tracking-wide text-ink-400 sm:block">
                  {c.code}
                </code>
                <button
                  type="button"
                  onClick={() => download(c)}
                  disabled={downloading === c.id}
                  className="btn-secondary btn-sm"
                >
                  {downloading === c.id ? (
                    <Spinner className="h-3.5 w-3.5" />
                  ) : (
                    <Icon name="download" className="h-3.5 w-3.5" />
                  )}
                  {downloading === c.id ? 'Preparing…' : 'Download'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
