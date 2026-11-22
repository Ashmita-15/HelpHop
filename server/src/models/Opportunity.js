import crypto from 'node:crypto';
import mongoose from 'mongoose';

export const GIG_MODES = ['none', 'paid', 'perk'];

/** Secret behind an event's rotating check-in QR. Never leaves the server. */
export const generateCheckinSecret = () => crypto.randomBytes(32).toString('hex');

export const CATEGORIES = [
  'Environment',
  'Education',
  'Health',
  'Animals',
  'Community',
  'Food Security',
  'Seniors',
  'Disaster Relief',
];

const opportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    category: { type: String, required: true, enum: CATEGORIES },
    // Broad area — this is what Browse filters on.
    location: { type: String, required: true, trim: true, maxlength: 120 },
    // The specific meeting point within that area. Optional.
    venue: { type: String, trim: true, maxlength: 200 },
    date: { type: Date, required: true },
    // 'HH:mm', 24-hour. Display only — see utils/dates.js for the past rule.
    startTime: { type: String, trim: true },
    endTime: { type: String, trim: true },
    requiredVolunteers: { type: Number, required: true, min: 1, max: 10000 },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // What a volunteer receives for turning up. 'paid' is record-keeping only:
    // the organization settles it outside the app.
    gig: {
      mode: { type: String, enum: GIG_MODES, default: 'none' },
      amount: { type: Number, min: 0 },
      currency: { type: String, trim: true, maxlength: 8, default: 'INR' },
      perkTitle: { type: String, trim: true, maxlength: 120 },
      perkDescription: { type: String, trim: true, maxlength: 1000 },
    },
    // Set once, when the organizer closes the event and issues awards.
    completedAt: { type: Date },
    checkinSecret: {
      type: String,
      required: true,
      default: generateCheckinSecret,
      select: false, // keep it out of every ordinary query result
    },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// Powers the keyword search on title + description
opportunitySchema.index({ title: 'text', description: 'text' });

// select:false hides the secret from queries, but a freshly created document
// still carries it — strip it on the way out so it can never reach a response.
const hideSecret = (_doc, ret) => {
  delete ret.checkinSecret;
  return ret;
};
opportunitySchema.set('toJSON', { transform: hideSecret });
opportunitySchema.set('toObject', { transform: hideSecret });

export default mongoose.model('Opportunity', opportunitySchema);
