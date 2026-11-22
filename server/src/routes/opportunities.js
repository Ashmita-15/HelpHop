import { Router } from 'express';
import {
  listOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  joinOpportunity,
  listVolunteers,
  listCategories,
} from '../controllers/opportunityController.js';
import {
  checkinToken,
  checkin,
  listAttendance,
  markAttendance,
  completeOpportunity,
  reopenOpportunity,
} from '../controllers/attendanceController.js';
import {
  putOpportunityImage,
  deleteOpportunityImage,
  getOpportunityImage,
} from '../controllers/opportunityImageController.js';
import { listOpportunityGigs } from '../controllers/gigController.js';
import { listOpportunityCertificates } from '../controllers/certificateController.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Public browsing; optionalAuth lets us mark which ones the viewer already joined.
router.get('/categories', listCategories);
router.get('/', optionalAuth, listOpportunities);
router.get('/:id', optionalAuth, getOpportunity);
router.get('/:id/image', getOpportunityImage);

// Organization-only management
router.post('/', requireAuth, requireRole('organization'), createOpportunity);
router.put('/:id', requireAuth, requireRole('organization'), updateOpportunity);
router.delete('/:id', requireAuth, requireRole('organization'), deleteOpportunity);
router.get('/:id/volunteers', requireAuth, requireRole('organization'), listVolunteers);

// Cover photograph. Its wider body limit is applied in app.js, which has to
// reach the request before the general JSON parser does.
router.put('/:id/image', requireAuth, requireRole('organization'), putOpportunityImage);
router.delete('/:id/image', requireAuth, requireRole('organization'), deleteOpportunityImage);

// Volunteer-only sign-up
router.post('/:id/join', requireAuth, requireRole('volunteer'), joinOpportunity);

// Attendance — the organizer runs the door, the volunteer scans the QR
router.post('/:id/checkin-token', requireAuth, requireRole('organization'), checkinToken);
router.post('/:id/checkin', requireAuth, requireRole('volunteer'), checkin);
router.get('/:id/attendance', requireAuth, requireRole('organization'), listAttendance);
router.patch(
  '/:id/attendance/:volunteerId',
  requireAuth,
  requireRole('organization'),
  markAttendance
);

// Completion issues the gigs and certificates; reopening unlocks attendance
// on an event that was closed too soon.
router.post('/:id/complete', requireAuth, requireRole('organization'), completeOpportunity);
router.post('/:id/reopen', requireAuth, requireRole('organization'), reopenOpportunity);
router.get('/:id/gigs', requireAuth, requireRole('organization'), listOpportunityGigs);
router.get(
  '/:id/certificates',
  requireAuth,
  requireRole('organization'),
  listOpportunityCertificates
);

export default router;
