import { Router } from 'express';
import { dashboard } from '../controllers/userController.js';
import { myGigs } from '../controllers/gigController.js';
import { myCertificates } from '../controllers/certificateController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', requireAuth, dashboard);

// A volunteer's own rewards and certificates
router.get('/me/gigs', requireAuth, requireRole('volunteer'), myGigs);
router.get('/me/certificates', requireAuth, requireRole('volunteer'), myCertificates);

export default router;
