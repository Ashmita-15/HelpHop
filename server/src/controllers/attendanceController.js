import mongoose from 'mongoose';
import QRCode from 'qrcode';

import Opportunity from '../models/Opportunity.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import GigAward from '../models/GigAward.js';
import Certificate, { generateCertificateCode } from '../models/Certificate.js';
import { asyncHandler, httpError } from '../middleware/error.js';
import { mintCheckinToken, verifyCheckinToken } from '../utils/checkin.js';

const DAY_MS = 864e5;

/**
 * The typed short code is only 6 digits, so without a limit someone could sit
 * and guess inside its 60-second window. Ten wrong tries per volunteer per
 * event buys back the margin. In-memory is fine: a restart clearing it is
 * harmless, and this app runs as a single process.
 */
const FAILED_LIMIT = 10;
const FAILED_WINDOW_MS = 10 * 60 * 1000;
const failedAttempts = new Map();

function recordFailure(key) {
  const now = Date.now();
  const entry = failedAttempts.get(key);
  if (!entry || now - entry.first > FAILED_WINDOW_MS) {
    failedAttempts.set(key, { count: 1, first: now });
    return;
  }
  entry.count += 1;
}

function assertNotLockedOut(key) {
  const entry = failedAttempts.get(key);
  if (!entry) return;
  if (Date.now() - entry.first > FAILED_WINDOW_MS) {
    failedAttempts.delete(key);
    return;
  }
  if (entry.count >= FAILED_LIMIT) {
    throw httpError(429, 'Too many failed attempts — wait a few minutes and try again');
  }
}

/** Loads an opportunity (with its secret) and verifies the caller owns it. */
async function findOwned(id, user, { withSecret = false } = {}) {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Opportunity not found');

  const query = Opportunity.findById(id);
  if (withSecret) query.select('+checkinSecret');

  const doc = await query;
  if (!doc) throw httpError(404, 'Opportunity not found');
  if (doc.organizationId.toString() !== user._id.toString()) {
    throw httpError(403, 'You can only manage opportunities your organization created');
  }
  return doc;
}

/** Check-in opens at midnight on the event date and closes 24h after it. */
function assertCheckinWindow(opportunity) {
  if (opportunity.completedAt) {
    throw httpError(409, 'This event has been completed — attendance is closed');
  }
  const opens = new Date(opportunity.date);
  opens.setHours(0, 0, 0, 0);
  const now = Date.now();

  if (now < opens.getTime()) throw httpError(409, "Check-in hasn't opened for this event yet");
  if (now > opens.getTime() + 2 * DAY_MS) throw httpError(409, 'Check-in for this event has closed');
}

// POST /api/opportunities/:id/checkin-token   (owning organization)
export const checkinToken = asyncHandler(async (req, res) => {
  const doc = await findOwned(req.params.id, req.user, { withSecret: true });
  if (doc.completedAt) throw httpError(409, 'This event has been completed');

  const { token, code, expiresAt } = mintCheckinToken(doc.checkinSecret, doc._id.toString());
  const origin = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0].trim();
  const url = `${origin.replace(/\/$/, '')}/checkin/${doc._id}?t=${token}`;

  const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 320 });
  res.json({ token, code, url, qrDataUrl, expiresAt });
});

// POST /api/opportunities/:id/checkin   (volunteer, body { token })
export const checkin = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Opportunity not found');

  const doc = await Opportunity.findById(req.params.id).select('+checkinSecret');
  if (!doc) throw httpError(404, 'Opportunity not found');

  const throttleKey = `${req.user._id}:${doc._id}`;
  assertNotLockedOut(throttleKey);

  if (!verifyCheckinToken(req.body?.token, doc.checkinSecret, doc._id.toString())) {
    recordFailure(throttleKey);
    throw httpError(401, 'That code has expired — check the organizer’s screen for the current one');
  }
  failedAttempts.delete(throttleKey);

  assertCheckinWindow(doc);

  const registered = await Registration.exists({ volunteerId: req.user._id, opportunityId: doc._id });
  if (!registered) throw httpError(403, "You haven't joined this opportunity");

  try {
    const attendance = await Attendance.create({
      opportunityId: doc._id,
      volunteerId: req.user._id,
      method: 'qr',
      markedBy: req.user._id,
    });
    res.status(201).json({ message: `Checked in to "${doc.title}"`, attendance });
  } catch (err) {
    if (err.code === 11000) throw httpError(409, "You're already checked in to this event");
    throw err;
  }
});

// GET /api/opportunities/:id/attendance   (owning organization)
export const listAttendance = asyncHandler(async (req, res) => {
  const doc = await findOwned(req.params.id, req.user);

  const [registrations, attendance] = await Promise.all([
    Registration.find({ opportunityId: doc._id }).populate('volunteerId', 'name email').sort({ createdAt: 1 }),
    Attendance.find({ opportunityId: doc._id }),
  ]);

  const byVolunteer = new Map(attendance.map((a) => [a.volunteerId.toString(), a]));

  const roster = registrations
    .filter((r) => r.volunteerId)
    .map((r) => {
      const marked = byVolunteer.get(r.volunteerId._id.toString());
      return {
        volunteerId: r.volunteerId._id,
        name: r.volunteerId.name,
        email: r.volunteerId.email,
        joinedAt: r.createdAt,
        present: !!marked,
        method: marked?.method || null,
        markedAt: marked?.markedAt || null,
      };
    });

  res.json({
    opportunity: {
      id: doc._id,
      title: doc.title,
      date: doc.date,
      startTime: doc.startTime,
      endTime: doc.endTime,
      venue: doc.venue,
      gig: doc.gig,
      completedAt: doc.completedAt,
      requiredVolunteers: doc.requiredVolunteers,
    },
    counts: { registered: roster.length, present: roster.filter((r) => r.present).length },
    roster,
  });
});

// PATCH /api/opportunities/:id/attendance/:volunteerId   (owning organization)
export const markAttendance = asyncHandler(async (req, res) => {
  const doc = await findOwned(req.params.id, req.user);
  if (doc.completedAt) throw httpError(409, 'This event has been completed — attendance is locked');

  const { volunteerId } = req.params;
  if (!mongoose.isValidObjectId(volunteerId)) throw httpError(404, 'Volunteer not found');

  if (typeof req.body?.present !== 'boolean') {
    throw httpError(400, 'Send { present: true } or { present: false }');
  }

  const registered = await Registration.exists({ volunteerId, opportunityId: doc._id });
  if (!registered) throw httpError(404, "That volunteer hasn't joined this opportunity");

  if (req.body.present) {
    await Attendance.updateOne(
      { opportunityId: doc._id, volunteerId },
      { $setOnInsert: { method: 'manual', markedBy: req.user._id, markedAt: new Date() } },
      { upsert: true }
    );
  } else {
    await Attendance.deleteOne({ opportunityId: doc._id, volunteerId });
  }

  const present = await Attendance.countDocuments({ opportunityId: doc._id });
  res.json({ volunteerId, present: req.body.present, counts: { present } });
});

// POST /api/opportunities/:id/complete   (owning organization)
export const completeOpportunity = asyncHandler(async (req, res) => {
  const doc = await findOwned(req.params.id, req.user);

  const startOfDay = new Date(doc.date);
  startOfDay.setHours(0, 0, 0, 0);
  if (Date.now() < startOfDay.getTime()) {
    throw httpError(409, "You can't complete an event before the day it happens");
  }

  const attendees = await Attendance.find({ opportunityId: doc._id }).select('volunteerId');
  const issuesGig = doc.gig?.mode === 'paid' || doc.gig?.mode === 'perk';

  // Upserts keep this idempotent: re-running changes nothing and the unique
  // indexes make a double submit harmless.
  if (issuesGig && attendees.length) {
    await GigAward.bulkWrite(
      attendees.map((a) => ({
        updateOne: {
          filter: { opportunityId: doc._id, volunteerId: a.volunteerId },
          update: {
            $setOnInsert: {
              mode: doc.gig.mode,
              amount: doc.gig.mode === 'paid' ? doc.gig.amount : undefined,
              currency: doc.gig.mode === 'paid' ? doc.gig.currency || 'INR' : undefined,
              perkTitle: doc.gig.mode === 'perk' ? doc.gig.perkTitle : undefined,
              status: 'pending',
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  }

  for (const a of attendees) {
    const existing = await Certificate.findOne({ opportunityId: doc._id, volunteerId: a.volunteerId });
    if (existing) continue;
    try {
      await Certificate.create({
        opportunityId: doc._id,
        volunteerId: a.volunteerId,
        code: generateCertificateCode(),
      });
    } catch (err) {
      // 11000 here means a concurrent complete() beat us to this attendee.
      if (err.code !== 11000) throw err;
    }
  }

  if (!doc.completedAt) {
    doc.completedAt = new Date();
    await doc.save();
  }

  const [awards, certificates] = await Promise.all([
    GigAward.countDocuments({ opportunityId: doc._id }),
    Certificate.countDocuments({ opportunityId: doc._id }),
  ]);

  res.json({
    message: `"${doc.title}" completed`,
    completedAt: doc.completedAt,
    attendees: attendees.length,
    awards,
    certificates,
  });
});
