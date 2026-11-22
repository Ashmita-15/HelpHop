import Opportunity from '../models/Opportunity.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import GigAward from '../models/GigAward.js';
import { asyncHandler } from '../middleware/error.js';
import { isFinished } from '../utils/dates.js';

/** How many volunteers have signed up for each of the given opportunity ids. */
async function countsByOpportunity(ids) {
  const counts = await Registration.aggregate([
    { $match: { opportunityId: { $in: ids } } },
    { $group: { _id: '$opportunityId', count: { $sum: 1 } } },
  ]);
  return new Map(counts.map((c) => [c._id.toString(), c.count]));
}

function withCounts(obj, countMap) {
  const registeredCount = countMap.get(obj._id.toString()) || 0;
  return {
    ...obj,
    registeredCount,
    spotsLeft: Math.max(0, obj.requiredVolunteers - registeredCount),
  };
}

/**
 * GET /api/users/dashboard
 * Volunteer    → the opportunities they joined.
 * Organization → the opportunities they posted, each with its volunteer count.
 */
export const dashboard = asyncHandler(async (req, res) => {
  if (req.user.role === 'volunteer') {
    const registrations = await Registration.find({ volunteerId: req.user._id })
      .populate({
        path: 'opportunityId',
        populate: { path: 'organizationId', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    const live = registrations.filter((r) => r.opportunityId); // may have been deleted
    const ids = live.map((r) => r.opportunityId._id);

    // Everything the "previous" cards need, in three queries over the whole
    // id set rather than three per event.
    const [countMap, attendance, certificates, awards] = await Promise.all([
      countsByOpportunity(ids),
      Attendance.find({ volunteerId: req.user._id, opportunityId: { $in: ids } }).select(
        'opportunityId'
      ),
      Certificate.find({ volunteerId: req.user._id, opportunityId: { $in: ids } }),
      GigAward.find({ volunteerId: req.user._id, opportunityId: { $in: ids } }),
    ]);

    const attendedSet = new Set(attendance.map((a) => a.opportunityId.toString()));
    const certMap = new Map(certificates.map((c) => [c.opportunityId.toString(), c]));
    const awardMap = new Map(awards.map((a) => [a.opportunityId.toString(), a]));

    const joined = live.map((r) => ({
      ...withCounts(r.opportunityId.toObject(), countMap),
      joinedAt: r.createdAt,
      joined: true,
    }));

    const upcoming = joined.filter((o) => !isFinished(o));

    // Finished events, most recent first, each carrying what came of it.
    const previous = joined
      .filter((o) => isFinished(o))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((o) => {
        const key = o._id.toString();
        const cert = certMap.get(key);
        const award = awardMap.get(key);
        return {
          ...o,
          attended: attendedSet.has(key),
          certificateId: cert?._id || null,
          certificateCode: cert?.code || null,
          gig: award
            ? {
                mode: award.mode,
                amount: award.amount,
                currency: award.currency,
                perkTitle: award.perkTitle,
                status: award.status,
              }
            : null,
        };
      });

    return res.json({
      role: 'volunteer',
      stats: {
        totalJoined: joined.length,
        upcoming: upcoming.length,
        completed: previous.length,
      },
      opportunities: upcoming,
      previous,
    });
  }

  // Organization
  const opportunities = await Opportunity.find({ organizationId: req.user._id })
    .populate('organizationId', 'name email')
    .sort({ date: 1 });

  const countMap = await countsByOpportunity(opportunities.map((o) => o._id));
  const decorated = opportunities.map((o) => withCounts(o.toObject(), countMap));

  res.json({
    role: 'organization',
    stats: {
      totalOpportunities: decorated.length,
      totalVolunteers: decorated.reduce((sum, o) => sum + o.registeredCount, 0),
      spotsOpen: decorated.reduce((sum, o) => sum + o.spotsLeft, 0),
    },
    opportunities: decorated,
  });
});
