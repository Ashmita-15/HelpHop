import mongoose from 'mongoose';
import Opportunity, { CATEGORIES, GIG_MODES } from '../models/Opportunity.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import GigAward from '../models/GigAward.js';
import Certificate from '../models/Certificate.js';
import { asyncHandler, httpError } from '../middleware/error.js';
import { startOfToday } from '../utils/dates.js';

/** Escapes user input before putting it inside a RegExp. */
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Adds registeredCount / spotsLeft (and joined, when a volunteer is logged in). */
async function decorate(docs, viewer) {
  const ids = docs.map((d) => d._id);

  const counts = await Registration.aggregate([
    { $match: { opportunityId: { $in: ids } } },
    { $group: { _id: '$opportunityId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  let joinedSet = new Set();
  let attendedSet = new Set();
  if (viewer?.role === 'volunteer') {
    const [mine, attended] = await Promise.all([
      Registration.find({ volunteerId: viewer._id, opportunityId: { $in: ids } }).select('opportunityId'),
      Attendance.find({ volunteerId: viewer._id, opportunityId: { $in: ids } }).select('opportunityId'),
    ]);
    joinedSet = new Set(mine.map((r) => r.opportunityId.toString()));
    attendedSet = new Set(attended.map((a) => a.opportunityId.toString()));
  }

  return docs.map((d) => {
    const obj = d.toObject ? d.toObject() : d;
    const registeredCount = countMap.get(d._id.toString()) || 0;
    return {
      ...obj,
      registeredCount,
      spotsLeft: Math.max(0, obj.requiredVolunteers - registeredCount),
      joined: joinedSet.has(d._id.toString()),
      attended: attendedSet.has(d._id.toString()),
    };
  });
}

// GET /api/opportunities?search=&category=&location=&mine=true&when=upcoming|past|all
export const listOpportunities = asyncHandler(async (req, res) => {
  const { search, category, location, mine, when = 'upcoming' } = req.query;
  const filter = {};

  if (search?.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }
  if (category?.trim() && category !== 'All') filter.category = category;
  if (location?.trim()) filter.location = new RegExp(escapeRegex(location.trim()), 'i');

  // An organization listing its own board always sees everything: past events
  // are where it takes attendance and issues certificates.
  const ownBoard = mine === 'true' && req.user?.role === 'organization';
  if (mine === 'true' && req.user) filter.organizationId = req.user._id;

  let sort = { date: 1 }; // soonest first
  if (!ownBoard) {
    if (when === 'past') {
      filter.date = { $lt: startOfToday() };
      sort = { date: -1 }; // most recent first
    } else if (when !== 'all') {
      // Default: only what a volunteer can still turn up to.
      filter.date = { $gte: startOfToday() };
      filter.completedAt = null; // matches both unset and null
    }
  }

  const docs = await Opportunity.find(filter)
    .populate('organizationId', 'name email')
    .sort(sort);

  res.json({ opportunities: await decorate(docs, req.user) });
});

// GET /api/opportunities/:id
export const getOpportunity = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Opportunity not found');

  const doc = await Opportunity.findById(req.params.id).populate('organizationId', 'name email');
  if (!doc) throw httpError(404, 'Opportunity not found');

  const [decorated] = await decorate([doc], req.user);
  res.json({ opportunity: decorated });
});

/**
 * Validates the gig an organization attaches to an event.
 * 'paid' is a record of what the org promises to pay outside the app — no
 * payment details are accepted or stored anywhere.
 */
function readGig(raw) {
  const mode = (raw?.mode || 'none').trim();
  if (!GIG_MODES.includes(mode)) {
    throw httpError(400, `Gig mode must be one of: ${GIG_MODES.join(', ')}`);
  }

  if (mode === 'paid') {
    const amount = Number(raw.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw httpError(400, 'A paid gig needs an amount greater than 0');
    }
    const currency = (raw.currency || 'INR').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw httpError(400, 'Currency must be a 3-letter code');
    return { mode, amount, currency };
  }

  if (mode === 'perk') {
    const perkTitle = (raw.perkTitle || '').trim();
    if (!perkTitle) throw httpError(400, 'A perk gig needs a title');
    return {
      mode,
      perkTitle: perkTitle.slice(0, 120),
      perkDescription: (raw.perkDescription || '').trim().slice(0, 1000),
    };
  }

  return { mode: 'none' };
}

function readOpportunityBody(body) {
  const title = (body.title || '').trim();
  const description = (body.description || '').trim();
  const category = (body.category || '').trim();
  const location = (body.location || '').trim();
  const requiredVolunteers = Number(body.requiredVolunteers);
  const date = body.date ? new Date(body.date) : null;

  if (!title || !description || !category || !location || !body.date) {
    throw httpError(400, 'Title, description, category, location and date are required');
  }
  if (!CATEGORIES.includes(category)) {
    throw httpError(400, `Category must be one of: ${CATEGORIES.join(', ')}`);
  }
  if (Number.isNaN(date.getTime())) throw httpError(400, 'Please enter a valid date');
  if (!Number.isInteger(requiredVolunteers) || requiredVolunteers < 1) {
    throw httpError(400, 'Required volunteers must be a whole number of at least 1');
  }

  return { title, description, category, location, date, requiredVolunteers, gig: readGig(body.gig) };
}

// POST /api/opportunities  (organization only)
export const createOpportunity = asyncHandler(async (req, res) => {
  const data = readOpportunityBody(req.body);
  const doc = await Opportunity.create({ ...data, organizationId: req.user._id });
  await doc.populate('organizationId', 'name email');

  const [decorated] = await decorate([doc], req.user);
  res.status(201).json({ opportunity: decorated });
});

/** Loads an opportunity and verifies the caller owns it. */
async function findOwned(id, user) {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Opportunity not found');

  const doc = await Opportunity.findById(id);
  if (!doc) throw httpError(404, 'Opportunity not found');
  if (doc.organizationId.toString() !== user._id.toString()) {
    throw httpError(403, 'You can only manage opportunities your organization created');
  }
  return doc;
}

// PUT /api/opportunities/:id
export const updateOpportunity = asyncHandler(async (req, res) => {
  const doc = await findOwned(req.params.id, req.user);
  if (doc.completedAt) {
    throw httpError(409, 'This event has been completed and can no longer be edited');
  }
  Object.assign(doc, readOpportunityBody(req.body));
  await doc.save();
  await doc.populate('organizationId', 'name email');

  const [decorated] = await decorate([doc], req.user);
  res.json({ opportunity: decorated });
});

// DELETE /api/opportunities/:id
export const deleteOpportunity = asyncHandler(async (req, res) => {
  const doc = await findOwned(req.params.id, req.user);
  await Promise.all([
    Registration.deleteMany({ opportunityId: doc._id }),
    Attendance.deleteMany({ opportunityId: doc._id }),
    GigAward.deleteMany({ opportunityId: doc._id }),
    Certificate.deleteMany({ opportunityId: doc._id }),
  ]);
  await doc.deleteOne();

  res.json({ message: 'Opportunity deleted' });
});

// POST /api/opportunities/:id/join  (volunteer only)
export const joinOpportunity = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Opportunity not found');

  const doc = await Opportunity.findById(req.params.id);
  if (!doc) throw httpError(404, 'Opportunity not found');

  if (doc.completedAt) throw httpError(409, 'This event has been completed');
  if (new Date(doc.date) < startOfToday()) {
    throw httpError(409, 'This opportunity has already taken place');
  }

  const already = await Registration.exists({
    volunteerId: req.user._id,
    opportunityId: doc._id,
  });
  if (already) throw httpError(409, "You've already joined this opportunity");

  const registeredCount = await Registration.countDocuments({ opportunityId: doc._id });
  if (registeredCount >= doc.requiredVolunteers) {
    throw httpError(409, 'This opportunity is already full');
  }

  try {
    await Registration.create({ volunteerId: req.user._id, opportunityId: doc._id });
  } catch (err) {
    // Unique index caught a race between two simultaneous joins.
    if (err.code === 11000) throw httpError(409, "You've already joined this opportunity");
    throw err;
  }

  res.status(201).json({
    message: `You're signed up for "${doc.title}"`,
    registeredCount: registeredCount + 1,
  });
});

// GET /api/opportunities/:id/volunteers  (owning organization only)
export const listVolunteers = asyncHandler(async (req, res) => {
  const doc = await findOwned(req.params.id, req.user);

  const registrations = await Registration.find({ opportunityId: doc._id })
    .populate('volunteerId', 'name email')
    .sort({ createdAt: 1 });

  res.json({
    opportunity: { id: doc._id, title: doc.title, requiredVolunteers: doc.requiredVolunteers },
    volunteers: registrations
      .filter((r) => r.volunteerId) // skip rows whose user was removed
      .map((r) => ({
        id: r.volunteerId._id,
        name: r.volunteerId.name,
        email: r.volunteerId.email,
        joinedAt: r.createdAt,
      })),
  });
});

export const listCategories = (_req, res) => res.json({ categories: CATEGORIES });
