/** Formatting helpers for gigs, shared by cards, forms and dashboards. */

export const formatMoney = (amount, currency = 'INR') => {
  if (!Number.isFinite(Number(amount))) return '';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    // Unknown currency code — fall back to a plain number.
    return `${currency} ${Number(amount).toLocaleString()}`;
  }
};

/** Short label for a gig attached to an opportunity, or null when there is none. */
export function gigLabel(gig) {
  if (!gig || gig.mode === 'none' || !gig.mode) return null;
  if (gig.mode === 'paid') return formatMoney(gig.amount, gig.currency || 'INR');
  return gig.perkTitle || 'Reward';
}

export const gigTone = (gig) => (gig?.mode === 'paid' ? 'brand' : 'ocean');
