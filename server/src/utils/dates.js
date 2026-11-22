/**
 * One definition of "has this event happened yet", imported everywhere so the
 * list, the join guard and the dashboard can never disagree.
 *
 * Opportunity.date is a whole day with no start time, so an event dated today
 * stays visible and joinable until midnight rather than vanishing at 00:01.
 */
export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Past = the day has been and gone. */
export const isPast = (opportunity) => new Date(opportunity.date) < startOfToday();

/** Finished = past, or closed early by the organizer completing it. */
export const isFinished = (opportunity) => isPast(opportunity) || !!opportunity.completedAt;
