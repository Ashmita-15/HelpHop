import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is missing. Copy server/.env.example to server/.env');
  process.exit(1);
}

try {
  await connectDB(process.env.MONGO_URI);
  createApp().listen(PORT, () => {
    console.log(`🚀 VolunteerConnect API listening on http://localhost:${PORT}`);
    console.log(`   AI descriptions: ${process.env.GEMINI_API_KEY ? 'Gemini' : 'mock fallback'}`);
  });
} catch (err) {
  console.error('❌ Failed to start server:', err.message);
  console.error('   Is MongoDB running, and is MONGO_URI correct in server/.env?');
  process.exit(1);
}
