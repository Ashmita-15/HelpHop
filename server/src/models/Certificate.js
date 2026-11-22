import crypto from 'node:crypto';
import mongoose from 'mongoose';

// Crockford-style base32: no I, L, O or U, so a code read off a printed
// certificate can't be mistyped as a different valid one.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const CODE_LENGTH = 10;

/** Cryptographically random, unambiguous certificate code. */
export function generateCertificateCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[bytes[i] % ALPHABET.length];
  return code;
}

const certificateSchema = new mongoose.Schema(
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
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: CODE_LENGTH,
      maxlength: CODE_LENGTH,
    },
    issuedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

certificateSchema.index({ opportunityId: 1, volunteerId: 1 }, { unique: true });

export default mongoose.model('Certificate', certificateSchema);
