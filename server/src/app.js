
import express from 'express';
import cors from 'cors';

import { connectDB } from './config/db.js';

import authRoutes from './routes/auth.js';
import opportunityRoutes from './routes/opportunities.js';
import userRoutes from './routes/users.js';
import aiRoutes from './routes/ai.js';
import gigRoutes from './routes/gigs.js';
import certificateRoutes from './routes/certificates.js';

import { notFound, errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(cors({ origin: origins }));

  // An opportunity's cover photograph arrives as a data URL, which is far
  // wider than any other request this API takes. body-parser only ever parses
  // a body once, so the generous parser has to be reached first — behind the
  // general 100kb one the image would be rejected before it was looked at.
  const COVER_IMAGE_PATH = /^\/api\/opportunities\/[^/]+\/image\/?$/;
  const imageJson = express.json({ limit: '2mb' });
  const generalJson = express.json({ limit: '100kb' });

  app.use((req, res, next) =>
    COVER_IMAGE_PATH.test(req.path) ? imageJson(req, res, next) : generalJson(req, res, next)
  );

  // Health check does not require MongoDB.
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      ai: process.env.GEMINI_API_KEY ? 'gemini' : 'mock'
    });
  });

  // Connect to MongoDB before handling database-dependent routes.
  app.use(async (_req, _res, next) => {
    try {
      await connectDB(process.env.MONGO_URI);
      next();
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/opportunities', opportunityRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/gigs', gigRoutes);
  app.use('/api/certificates', certificateRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

// Vercel requires the Express application as a default export.
const app = createApp();

export default app;
