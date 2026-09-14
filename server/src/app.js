import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import opportunityRoutes from './routes/opportunities.js';
import userRoutes from './routes/users.js';
import aiRoutes from './routes/ai.js';
import { notFound, errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(cors({ origin: origins }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) =>
    res.json({ status: 'ok', ai: process.env.GEMINI_API_KEY ? 'gemini' : 'mock' })
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/opportunities', opportunityRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/ai', aiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
