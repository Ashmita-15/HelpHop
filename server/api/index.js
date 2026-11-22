
import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/db.js';

const app = createApp();

export default async function handler(req, res) {
  try {
    await connectDB(process.env.MONGO_URI);
    return app(req, res);
  } catch (error) {
    console.error('API initialization failed:', error);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
}
