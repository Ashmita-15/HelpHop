import mongoose from 'mongoose';

export const CHECKIN_METHODS = ['qr', 'manual'];

const attendanceSchema = new mongoose.Schema(
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
    // 'qr' = the volunteer scanned the event code themselves.
    // 'manual' = an organizer ticked them off the roster.
    method: { type: String, enum: CHECKIN_METHODS, required: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    markedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// One attendance row per volunteer per event, whichever way it was marked.
attendanceSchema.index({ opportunityId: 1, volunteerId: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
