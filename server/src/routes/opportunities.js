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

export default router;
