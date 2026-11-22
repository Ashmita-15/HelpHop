import { Router } from 'express';
import { downloadCertificate, verifyCertificate } from '../controllers/certificateController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Public: anyone scanning the QR on a printed certificate can check it.
router.get('/verify/:code', verifyCertificate);

router.get('/:id/download', requireAuth, downloadCertificate);

export default router;
