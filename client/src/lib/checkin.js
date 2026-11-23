/**
 * When a volunteer can check in.
 *
 * The rule lives on the server in utils/dates.js; this mirrors it from the
 * fields the API already sends, so the dashboard never offers a "Check in"
 * button the API will refuse.
 *
 * It has to be derived from the event's own `tzOffsetMinutes` and not from the
 * browser's. `date` arrives at exact UTC midnight, so reading it with local
 * getters gives a different answer in every timezone — which is exactly how a
 * volunteer in Kolkata used to be shown a check-in link that a UTC server then
 * turned down as "not opened yet".
 */
import { eventEndsAt, eventStartsAt, localOffsetMinutes } from './eventTime.js';

const DAY_MS = 864e5;

/** Must match CHECKIN_TAIL_MS on the server. */
const TAIL_MS = 2 * DAY_MS;

/** Minutes east of UTC where the event happens. */
const offsetOf = (event) =>
  Number.isFinite(event?.tzOffsetMinutes) ? event.tzOffsetMinutes : localOffsetMinutes();

/** Midnight at the start of the event's own day, in the event's own timezone. */
export function checkinOpensAt(event) {
  if (!event?.date) return null;

  const base = new Date(event.date);
  if (Number.isNaN(base.getTime())) return null;

  const offset = offsetOf(event);
  // Exact UTC midnight came from a 'YYYY-MM-DD' string and denotes that UTC
  // calendar day; anything else carries a local time of day.
  const shifted =
    base.getTime() % DAY_MS === 0 ? base : new Date(base.getTime() + offset * 60_000);

  const localMidnight = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate()
  );
  return new Date(localMidnight - offset * 60_000);
}

/** The scheduled end, plus the server's tail. */
export function checkinClosesAt(event) {
  const ends = eventEndsAt(event);
  return ends ? new Date(ends.getTime() + TAIL_MS) : null;
}

/** True while the server would accept a check-in for this event. */
export function checkinOpen(event, now = Date.now()) {
  if (!event || event.completedAt) return false;

  const opens = checkinOpensAt(event);
  const closes = checkinClosesAt(event);
  if (!opens || !closes) return false;

  return now >= opens.getTime() && now <= closes.getTime();
}

/** "24 Nov at 00:00", in the event's own local time — for explaining a wait. */
export function formatCheckinOpens(event) {
  const opens = checkinOpensAt(event);
  if (!opens) return '';

  const offset = offsetOf(event);
  const d = new Date(opens.getTime() + offset * 60_000);
  const month = d.toLocaleString(undefined, { month: 'short', timeZone: 'UTC' });
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${d.getUTCDate()} ${month} at ${hh}:${mm}`;
}

/** True when the event's date is today, in the viewer's timezone. */
export function isToday(value, now = new Date()) {
  const d = new Date(value);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * The events a volunteer could check in to right now: joined, inside the
 * window, and not already marked present. Soonest to start comes first.
 */
export function openForCheckin(events = [], now = Date.now()) {
  return events
    .filter((e) => checkinOpen(e, now) && !e.attended)
    .sort((a, b) => (eventStartsAt(a)?.getTime() || 0) - (eventStartsAt(b)?.getTime() || 0));
}
