import { Router } from 'express';
import { generateDescription } from '../utils/ai.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, httpError } from '../middleware/error.js';

const router = Router();

router.post(
  '/generate-description',
  requireAuth,
  requireRole('organization'),
  asyncHandler(async (req, res) => {
    const title = (req.body.title || '').trim();
    const category = (req.body.category || '').trim();
    const location = (req.body.location || '').trim();

    if (!title || !category || !location) {
      throw httpError(400, 'Add a title, category and location first, then generate.');
    }

    const result = await generateDescription({ title, category, location });
    res.json(result);
  })
);

export default router;
