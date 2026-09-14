import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    opportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// Database-level guarantee against duplicate sign-ups
registrationSchema.index({ volunteerId: 1, opportunityId: 1 }, { unique: true });

export default mongoose.model('Registration', registrationSchema);
