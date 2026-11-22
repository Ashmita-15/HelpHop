import { Router } from 'express';
import { updateGig } from '../controllers/gigController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Organizations settle the gigs they issued; volunteers read theirs via /users/me/gigs.
router.patch('/:id', requireAuth, requireRole('organization'), updateGig);

export default router;
