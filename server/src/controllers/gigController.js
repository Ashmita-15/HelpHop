import mongoose from 'mongoose';

import Opportunity from '../models/Opportunity.js';
import GigAward from '../models/GigAward.js';
import { asyncHandler, httpError } from '../middleware/error.js';

const summarise = (award) => {
  const obj = award.toObject ? award.toObject() : award;
  const opp = obj.opportunityId && typeof obj.opportunityId === 'object' ? obj.opportunityId : null;
  return {
    ...obj,
    opportunityId: opp ? opp._id : obj.opportunityId,
    opportunity: opp
      ? {
          id: opp._id,
          title: opp.title,
          date: opp.date,
          location: opp.location,
          category: opp.category,
          organization: opp.organizationId?.name || null,
        }
      : null,
  };
};

// GET /api/users/me/gigs   (volunteer)
export const myGigs = asyncHandler(async (req, res) => {
  const awards = await GigAward.find({ volunteerId: req.user._id })
    .populate({ path: 'opportunityId', populate: { path: 'organizationId', select: 'name' } })
    .sort({ createdAt: -1 });

  const gigs = awards.map(summarise);
  res.json({
    gigs,
    stats: {
      total: gigs.length,
      pending: gigs.filter((g) => g.status === 'pending').length,
      settled: gigs.filter((g) => g.status === 'settled').length,
    },
  });
});

// GET /api/opportunities/:id/gigs   (owning organization)
export const listOpportunityGigs = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Opportunity not found');

  const opportunity = await Opportunity.findById(req.params.id);
  if (!opportunity) throw httpError(404, 'Opportunity not found');
  if (opportunity.organizationId.toString() !== req.user._id.toString()) {
    throw httpError(403, 'You can only manage opportunities your organization created');
  }

  const awards = await GigAward.find({ opportunityId: opportunity._id })
    .populate('volunteerId', 'name email')
    .sort({ createdAt: 1 });

  res.json({
    opportunity: { id: opportunity._id, title: opportunity.title, gig: opportunity.gig },
    gigs: awards
      .filter((a) => a.volunteerId)
      .map((a) => ({
        id: a._id,
        volunteer: { id: a.volunteerId._id, name: a.volunteerId.name, email: a.volunteerId.email },
        mode: a.mode,
        amount: a.amount,
        currency: a.currency,
        perkTitle: a.perkTitle,
        status: a.status,
        settledAt: a.settledAt,
        reference: a.reference,
      })),
  });
});

/**
 * PATCH /api/gigs/:id   (owning organization)
 * Records that the organization paid or handed over the gig outside the app —
 * VolunteerConnect never moves money itself.
 */
export const updateGig = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Gig not found');

  const award = await GigAward.findById(req.params.id).populate('opportunityId', 'organizationId title');
  if (!award || !award.opportunityId) throw httpError(404, 'Gig not found');
  if (award.opportunityId.organizationId.toString() !== req.user._id.toString()) {
    throw httpError(403, 'You can only manage gigs your organization issued');
  }

  const { status, reference } = req.body || {};
  if (status !== undefined) {
    if (!['pending', 'settled'].includes(status)) {
      throw httpError(400, "Status must be 'pending' or 'settled'");
    }
    award.status = status;
    award.settledAt = status === 'settled' ? new Date() : undefined;
  }
  if (reference !== undefined) award.reference = String(reference).trim().slice(0, 200);

  await award.save();
  res.json({
    gig: {
      id: award._id,
      status: award.status,
      settledAt: award.settledAt,
      reference: award.reference,
    },
  });
});
