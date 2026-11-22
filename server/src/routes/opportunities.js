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
} from '../controllers/attendanceController.js';
import { listOpportunityGigs } from '../controllers/gigController.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Public browsing; optionalAuth lets us mark which ones the viewer already joined.
router.get('/categories', listCategories);
router.get('/', optionalAuth, listOpportunities);
router.get('/:id', optionalAuth, getOpportunity);

// Organization-only management
router.post('/', requireAuth, requireRole('organization'), createOpportunity);
router.put('/:id', requireAuth, requireRole('organization'), updateOpportunity);
router.delete('/:id', requireAuth, requireRole('organization'), deleteOpportunity);
router.get('/:id/volunteers', requireAuth, requireRole('organization'), listVolunteers);

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

// Completion issues the gigs and certificates
router.post('/:id/complete', requireAuth, requireRole('organization'), completeOpportunity);
router.get('/:id/gigs', requireAuth, requireRole('organization'), listOpportunityGigs);

export default router;
