import mongoose from 'mongoose';

/**
 * The cover photograph an organization uploads for one of its opportunities.
 *
 * Kept in its own collection rather than on the Opportunity document so the
 * bytes never ride along with a listing query — the board returns fifty
 * opportunities at a time, and an inline image would make that response
 * megabytes wide. Opportunity carries a `hasImage` flag instead, and clients
 * fetch the picture from GET /api/opportunities/:id/image.
 */
const opportunityImageSchema = new mongoose.Schema(
  {
    opportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
      unique: true,
      index: true,
    },
    contentType: { type: String, required: true },
    data: { type: Buffer, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model('OpportunityImage', opportunityImageSchema);
