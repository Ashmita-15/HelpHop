/**
 * When an event begins and ends, client side.
 *
 * The API resolves every event's `date` + `startTime`/`endTime` into real
 * instants (`startsAt` / `endsAt`) using the organiser's own UTC offset, so
 * the browser only has to read them. The fallbacks below mirror the server's
 * rule for any row written before those fields existed.
 */

/** Minutes east of UTC for this browser. Sent when an event is written. */
export const localOffsetMinutes = () => -new Date().getTimezoneOffset();

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Mirrors utils/dates.js on the server, for rows with no stored instant. */
function derive(event, { endOfDay }) {
  if (!event?.date) return null;

  const base = new Date(event.date);
  if (Number.isNaN(base.getTime())) return null;

  const offset = Number.isFinite(event.tzOffsetMinutes)
    ? event.tzOffsetMinutes
    : localOffsetMinutes();

  // A date at exact UTC midnight came from a 'YYYY-MM-DD' string and denotes
  // that UTC calendar day; anything else carries a local time of day.
  const isUtcMidnight = base.getTime() % 86_400_000 === 0;
  const shifted = isUtcMidnight ? base : new Date(base.getTime() + offset * 60_000);

  const match = TIME_RE.exec(endOfDay ? event.endTime || '' : event.startTime || '');
  const hours = match ? Number(match[1]) : endOfDay ? 23 : 0;
  const minutes = match ? Number(match[2]) : endOfDay ? 59 : 0;
  const seconds = match ? 0 : endOfDay ? 59 : 0;
  const ms = match ? 0 : endOfDay ? 999 : 0;

  const localMs = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
    hours,
    minutes,
    seconds,
    ms
  );
  return new Date(localMs - offset * 60_000);
}

/** The moment an event is scheduled to finish. */
export const eventEndsAt = (event) =>
  event?.endsAt ? new Date(event.endsAt) : derive(event, { endOfDay: true });

/** The moment an event is scheduled to begin. */
export const eventStartsAt = (event) =>
  event?.startsAt ? new Date(event.startsAt) : derive(event, { endOfDay: false });

/** True once the scheduled end has passed. */
export function hasEnded(event, now = Date.now()) {
  const ends = eventEndsAt(event);
  return ends ? ends.getTime() <= now : false;
}

/** Ended, or closed early by the organisation. */
export const isFinished = (event) => hasEnded(event) || !!event?.completedAt;

/** "in about 3 hours" / "on 24 Nov" — for explaining why a button is waiting. */
export function untilEnd(event, now = Date.now()) {
  const ends = eventEndsAt(event);
  if (!ends) return '';

  const minutes = Math.round((ends.getTime() - now) / 60_000);
  if (minutes <= 0) return 'now';
  if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? '' : 's'}`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `in about ${hours} hour${hours === 1 ? '' : 's'}`;

  return `on ${ends.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} at ${ends.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}
