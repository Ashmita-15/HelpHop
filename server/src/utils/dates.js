/**
 * One definition of when an event begins and ends, imported everywhere so the
 * listing, the join guard, the dashboard and the completion check can never
 * disagree.
 *
 * ## Why instants, and not dates
 *
 * `Opportunity.date` is a calendar day and `startTime`/`endTime` are wall
 * clock strings — neither carries a timezone, so on their own they cannot be
 * compared with "now". An event written as 23 Nov, 09:00–13:00 happens at a
 * different moment in Kolkata than in Chicago.
 *
 * So the API resolves them once, at write time, into two real UTC instants
 * (`startsAt` / `endsAt`) using the organiser's own UTC offset, and every
 * comparison afterwards is instant-against-instant. The helpers below fall
 * back to deriving those instants for rows written before that field existed.
 */

/** Minutes east of UTC. Kolkata is +330, Chicago −360. */
export const serverOffsetMinutes = (at = new Date()) => -new Date(at).getTimezoneOffset();

/**
 * Accepts an offset from a client, or null when it isn't usable.
 * Note the explicit null/'' guard: Number(null) and Number('') are both 0,
 * which would silently read "no offset recorded" as UTC.
 */
export function readOffsetMinutes(raw) {
  if (raw === null || raw === undefined || raw === '') return null;

  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  // Real-world offsets run from −12:00 to +14:00.
  if (value < -720 || value > 840) return null;
  return Math.round(value);
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** 'HH:mm' → { hours, minutes }, or null. */
function readClock(value) {
  const match = TIME_RE.exec(String(value || '').trim());
  if (!match) return null;
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

/**
 * The calendar day an event falls on, as { year, month, day }.
 *
 * A 'YYYY-MM-DD' string is unambiguous. A stored Date needs a rule: the API
 * writes `new Date('YYYY-MM-DD')`, which lands on exact UTC midnight, and
 * that value denotes the UTC calendar day. Anything else (seed data, rows
 * written with a time of day) is read in the offset it was created under.
 */
function calendarDay(date, offsetMinutes) {
  if (typeof date === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date.trim());
    if (match) {
      return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
    }
  }

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;

  const isUtcMidnight = d.getTime() % 86_400_000 === 0;
  const shifted = isUtcMidnight ? d : new Date(d.getTime() + offsetMinutes * 60_000);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/**
 * Resolve a calendar day plus a wall clock into a real instant.
 * @param {string|Date} date          'YYYY-MM-DD', or a stored Date.
 * @param {string} time               'HH:mm' in the event's local time.
 * @param {number} offsetMinutes      Minutes east of UTC at the event.
 * @param {{endOfDay?: boolean}} opts When `time` is absent, whether to land on
 *                                    the last millisecond of the day instead
 *                                    of its first.
 */
export function resolveInstant(date, time, offsetMinutes, { endOfDay = false } = {}) {
  const day = calendarDay(date, offsetMinutes);
  if (!day) return null;

  const clock = readClock(time);
  const hours = clock ? clock.hours : endOfDay ? 23 : 0;
  const minutes = clock ? clock.minutes : endOfDay ? 59 : 0;
  const seconds = clock ? 0 : endOfDay ? 59 : 0;
  const ms = clock ? 0 : endOfDay ? 999 : 0;

  const localMs = Date.UTC(day.year, day.month - 1, day.day, hours, minutes, seconds, ms);
  return new Date(localMs - offsetMinutes * 60_000);
}

/**
 * Both instants for an opportunity, from its raw fields. Used when writing.
 * An event with no end time runs until the end of its day — that is the
 * latest moment it could still be going on.
 */
export function resolveEventWindow({ date, startTime, endTime, tzOffsetMinutes }) {
  const offset = readOffsetMinutes(tzOffsetMinutes) ?? serverOffsetMinutes(date);
  return {
    tzOffsetMinutes: offset,
    startsAt: resolveInstant(date, startTime, offset),
    endsAt: resolveInstant(date, endTime, offset, { endOfDay: true }),
  };
}

/**
 * When an opportunity is scheduled to finish. Prefers the stored instant and
 * derives one for rows written before `endsAt` existed, so a database that
 * has not been backfilled still behaves correctly.
 */
export function eventEndsAt(opportunity) {
  if (!opportunity) return null;
  if (opportunity.endsAt) return new Date(opportunity.endsAt);

  const offset =
    readOffsetMinutes(opportunity.tzOffsetMinutes) ?? serverOffsetMinutes(opportunity.date);
  return resolveInstant(opportunity.date, opportunity.endTime, offset, { endOfDay: true });
}

/** When an opportunity is scheduled to begin. */
export function eventStartsAt(opportunity) {
  if (!opportunity) return null;
  if (opportunity.startsAt) return new Date(opportunity.startsAt);

  const offset =
    readOffsetMinutes(opportunity.tzOffsetMinutes) ?? serverOffsetMinutes(opportunity.date);
  return resolveInstant(opportunity.date, opportunity.startTime, offset);
}

/** True once the scheduled end has passed. */
export function hasEnded(opportunity, now = Date.now()) {
  const ends = eventEndsAt(opportunity);
  return ends ? ends.getTime() <= now : false;
}

/** Kept under its original name: past = the scheduled end has been and gone. */
export const isPast = (opportunity) => hasEnded(opportunity);

/** Finished = it has ended, or the organisation closed it early. */
export const isFinished = (opportunity) => hasEnded(opportunity) || !!opportunity?.completedAt;

/**
 * Midnight this morning, server-local. Still used as a coarse database
 * pre-filter — the exact decision is always made with `hasEnded`.
 */
export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Midnight tonight, server-local. The other half of that pre-filter. */
export const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

/* ------------------------------------------------------------------ check-in */

/**
 * How long after an event finishes a volunteer can still be checked in.
 * Generous on purpose: an organiser who forgets to run the door on the day
 * should still be able to put the attendance right afterwards.
 */
export const CHECKIN_TAIL_MS = 2 * 864e5;

/**
 * When check-in opens: midnight at the start of the event's own day, in the
 * event's own timezone.
 *
 * The timezone matters. `date` is stored at exact UTC midnight, so reading it
 * with the server's local getters (`new Date(date).setHours(0,0,0,0)`) lands
 * on a different instant on a server in Kolkata than on one in UTC — and on a
 * different instant again in the volunteer's browser. That disagreement is
 * what let the dashboard offer a "Check in" button the API then refused.
 * Resolving against the event's recorded offset gives one answer everywhere.
 */
export function checkinOpensAt(opportunity) {
  if (!opportunity?.date) return null;
  const offset =
    readOffsetMinutes(opportunity.tzOffsetMinutes) ?? serverOffsetMinutes(opportunity.date);
  return resolveInstant(opportunity.date, null, offset);
}

/** When check-in closes: the scheduled end, plus the tail above. */
export function checkinClosesAt(opportunity) {
  const ends = eventEndsAt(opportunity);
  return ends ? new Date(ends.getTime() + CHECKIN_TAIL_MS) : null;
}

/** Both edges at once, for callers that want to explain the wait. */
export function checkinWindow(opportunity) {
  return { opensAt: checkinOpensAt(opportunity), closesAt: checkinClosesAt(opportunity) };
}

/** True while a check-in for this event would be accepted. */
export function checkinOpen(opportunity, now = Date.now()) {
  if (!opportunity || opportunity.completedAt) return false;
  const { opensAt, closesAt } = checkinWindow(opportunity);
  if (!opensAt || !closesAt) return false;
  return now >= opensAt.getTime() && now <= closesAt.getTime();
}
