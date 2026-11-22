import mongoose from 'mongoose';

import Certificate from '../models/Certificate.js';
import { asyncHandler, httpError } from '../middleware/error.js';
import { streamCertificatePdf, verifyUrl } from '../utils/certificate.js';

const POPULATE = [
  { path: 'volunteerId', select: 'name email' },
  { path: 'opportunityId', populate: { path: 'organizationId', select: 'name' } },
];

// GET /api/users/me/certificates   (volunteer)
export const myCertificates = asyncHandler(async (req, res) => {
  const certs = await Certificate.find({ volunteerId: req.user._id })
    .populate({ path: 'opportunityId', populate: { path: 'organizationId', select: 'name' } })
    .sort({ issuedAt: -1 });

  res.json({
    certificates: certs
      .filter((c) => c.opportunityId)
      .map((c) => ({
        id: c._id,
        code: c.code,
        issuedAt: c.issuedAt,
        verifyUrl: verifyUrl(c.code),
        opportunity: {
          id: c.opportunityId._id,
          title: c.opportunityId.title,
          date: c.opportunityId.date,
          location: c.opportunityId.location,
          category: c.opportunityId.category,
          organization: c.opportunityId.organizationId?.name || null,
        },
      })),
  });
});

// GET /api/certificates/:id/download   (the volunteer it belongs to, or the issuing org)
export const downloadCertificate = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Certificate not found');

  const cert = await Certificate.findById(req.params.id).populate(POPULATE);
  if (!cert || !cert.opportunityId || !cert.volunteerId) throw httpError(404, 'Certificate not found');

  const viewer = req.user._id.toString();
  const isOwner = cert.volunteerId._id.toString() === viewer;
  const isIssuer = cert.opportunityId.organizationId?._id?.toString() === viewer;
  if (!isOwner && !isIssuer) throw httpError(403, 'That certificate belongs to someone else');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="volunteerconnect-certificate-${cert.code}.pdf"`
  );

  await streamCertificatePdf(res, {
    volunteerName: cert.volunteerId.name,
    eventTitle: cert.opportunityId.title,
    orgName: cert.opportunityId.organizationId?.name || 'VolunteerConnect',
    eventDate: cert.opportunityId.date,
    issuedAt: cert.issuedAt,
    code: cert.code,
  });
});

/**
 * GET /api/certificates/verify/:code   (public — this is the point of the QR)
 * Always 200: a forged code is a valid question with the answer "no".
 */
export const verifyCertificate = asyncHandler(async (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();

  const cert = await Certificate.findOne({ code }).populate(POPULATE);
  if (!cert || !cert.opportunityId || !cert.volunteerId) {
    return res.json({ valid: false });
  }

  res.json({
    valid: true,
    code: cert.code,
    volunteerName: cert.volunteerId.name,
    eventTitle: cert.opportunityId.title,
    orgName: cert.opportunityId.organizationId?.name || null,
    eventDate: cert.opportunityId.date,
    eventLocation: cert.opportunityId.location,
    issuedAt: cert.issuedAt,
  });
});
