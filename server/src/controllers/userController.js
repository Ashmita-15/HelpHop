import Opportunity from '../models/Opportunity.js';
import Registration from '../models/Registration.js';
import { asyncHandler } from '../middleware/error.js';

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
    const countMap = await countsByOpportunity(live.map((r) => r.opportunityId._id));

    const joined = live.map((r) => ({
      ...withCounts(r.opportunityId.toObject(), countMap),
      joinedAt: r.createdAt,
      joined: true,
    }));

    const now = Date.now();
    return res.json({
      role: 'volunteer',
      stats: {
        totalJoined: joined.length,
        upcoming: joined.filter((o) => new Date(o.date).getTime() >= now).length,
      },
      opportunities: joined,
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
