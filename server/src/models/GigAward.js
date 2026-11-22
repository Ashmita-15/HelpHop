import mongoose from 'mongoose';

export const AWARD_STATUSES = ['pending', 'settled'];

const gigAwardSchema = new mongoose.Schema(
  {
    opportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
      index: true,
    },
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Snapshot of the gig as it stood when the event was completed, so editing
    // the opportunity afterwards can never change what was already promised.
    mode: { type: String, enum: ['paid', 'perk'], required: true },
    amount: { type: Number, min: 0 },
    currency: { type: String, trim: true, maxlength: 8 },
    perkTitle: { type: String, trim: true, maxlength: 120 },
    // 'settled' records that the organization paid or handed over the perk
    // outside the app. No money moves through VolunteerConnect.
    status: { type: String, enum: AWARD_STATUSES, default: 'pending', index: true },
    settledAt: { type: Date },
    reference: { type: String, trim: true, maxlength: 200 },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

gigAwardSchema.index({ opportunityId: 1, volunteerId: 1 }, { unique: true });

export default mongoose.model('GigAward', gigAwardSchema);
