import mongoose from 'mongoose';

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
    location: { type: String, required: true, trim: true, maxlength: 120 },
    date: { type: Date, required: true },
    requiredVolunteers: { type: Number, required: true, min: 1, max: 10000 },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// Powers the keyword search on title + description
opportunitySchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Opportunity', opportunitySchema);
