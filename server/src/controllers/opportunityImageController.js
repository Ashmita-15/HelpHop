import mongoose from 'mongoose';

import Opportunity from '../models/Opportunity.js';
import OpportunityImage from '../models/OpportunityImage.js';
import { asyncHandler, httpError } from '../middleware/error.js';

/** What a browser can actually display, and what the client encoder produces. */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * The client downsizes and re-encodes before sending, so anything much larger
 * than this means the picture never went through that step.
 */
const MAX_BYTES = 900 * 1024;

const DATA_URL_RE = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i;

/** Loads an opportunity and verifies the caller's organization owns it. */
async function findOwned(id, user) {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Opportunity not found');

  const doc = await Opportunity.findById(id);
  if (!doc) throw httpError(404, 'Opportunity not found');
  if (doc.organizationId.toString() !== user._id.toString()) {
    throw httpError(403, 'You can only manage opportunities your organization created');
  }
  return doc;
}

/** Turns the posted data URL into { contentType, buffer }, or throws. */
function readDataUrl(raw) {
  if (typeof raw !== 'string' || !raw) throw httpError(400, 'No image was sent');

  const match = DATA_URL_RE.exec(raw.trim());
  if (!match) throw httpError(400, 'That image could not be read');

  const contentType = match[1].toLowerCase();
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw httpError(400, 'Images need to be a JPEG, PNG or WebP');
  }

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0) throw httpError(400, 'That image was empty');
  if (buffer.length > MAX_BYTES) {
    throw httpError(413, 'That image is too large — try one under 1MB');
  }

  return { contentType, buffer };
}

// PUT /api/opportunities/:id/image   (owning organization, body { image })
export const putOpportunityImage = asyncHandler(async (req, res) => {
  const doc = await findOwned(req.params.id, req.user);
  if (doc.completedAt) {
    throw httpError(409, 'This event has been completed and can no longer be edited');
  }

  const { contentType, buffer } = readDataUrl(req.body?.image);

  await OpportunityImage.findOneAndUpdate(
    { opportunityId: doc._id },
    { opportunityId: doc._id, contentType, data: buffer, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  if (!doc.hasImage) {
    doc.hasImage = true;
    await doc.save();
  }

  res.json({ message: 'Photograph saved', hasImage: true });
});

// DELETE /api/opportunities/:id/image   (owning organization)
export const deleteOpportunityImage = asyncHandler(async (req, res) => {
  const doc = await findOwned(req.params.id, req.user);

  await OpportunityImage.deleteOne({ opportunityId: doc._id });
  if (doc.hasImage) {
    doc.hasImage = false;
    await doc.save();
  }

  res.json({ message: 'Photograph removed', hasImage: false });
});

// GET /api/opportunities/:id/image   (public — the board is public too)
export const getOpportunityImage = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Image not found');

  const image = await OpportunityImage.findOne({ opportunityId: req.params.id });
  if (!image) throw httpError(404, 'Image not found');

  // Revalidate rather than cache hard: an organization can replace the
  // picture, and the listing links to a stable URL.
  res.set('Content-Type', image.contentType);
  res.set('Cache-Control', 'public, max-age=0, must-revalidate');
  res.set('ETag', `W/"${image.updatedAt.getTime()}"`);

  if (req.headers['if-none-match'] === `W/"${image.updatedAt.getTime()}"`) {
    return res.status(304).end();
  }

  return res.send(image.data);
});
