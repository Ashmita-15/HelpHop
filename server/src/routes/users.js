import { Router } from 'express';
import { dashboard } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', requireAuth, dashboard);

export default router;
