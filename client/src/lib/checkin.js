/**
 * When a volunteer can check in.
 *
 * The server opens check-in at midnight on the event date and closes it two
 * days later (see assertCheckinWindow in the attendance controller). The
 * client mirrors that rule so it only ever offers check-in when it will work.
 */

const DAY_MS = 864e5;
const WINDOW_DAYS = 2;

/** Midnight at the start of the event's date. */
function opensAt(event) {
  const d = new Date(event.date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** True while the server would accept a check-in for this event. */
export function checkinOpen(event, now = Date.now()) {
  if (!event?.date || event.completedAt) return false;
  const opens = opensAt(event);
  return now >= opens && now <= opens + WINDOW_DAYS * DAY_MS;
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
 * window, and not already marked present. Today's come first.
 */
export function openForCheckin(events = [], now = Date.now()) {
  return events
    .filter((e) => checkinOpen(e, now) && !e.attended)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}
