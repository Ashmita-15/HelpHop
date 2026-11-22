/**
 * Formatting for the optional startTime/endTime fields ('HH:mm', 24-hour).
 * Every caller must cope with them being absent, so these return ''.
 */

/** '09:00' → '9:00 AM' in the viewer's locale, falling back to the raw value. */
export function formatTime(value) {
  if (!value) return '';
  const [h, m] = value.split(':').map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return value;

  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** '09:00'+'13:00' → '9:00 AM – 1:00 PM'; start alone → 'from 9:00 AM'; none → ''. */
export function formatTimeRange(startTime, endTime) {
  if (!startTime) return '';
  if (!endTime) return `from ${formatTime(startTime)}`;
  return `${formatTime(startTime)} – ${formatTime(endTime)}`;
}

/** 'Sun, 23 Nov 2026 · 9:00 AM – 1:00 PM', collapsing to the date alone. */
export function formatDateWithTime(formattedDate, startTime, endTime) {
  const range = formatTimeRange(startTime, endTime);
  return range ? `${formattedDate} · ${range}` : formattedDate;
}
