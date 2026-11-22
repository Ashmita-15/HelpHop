import 'dotenv/config';
import http from 'node:http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

// Bind loopback explicitly instead of the wildcard (::). On macOS the AirPlay
// Receiver (ControlCenter) listens on *:5000, which makes a wildcard bind fail
// with EADDRINUSE, while the more specific loopback addresses are still free
// and take precedence for local traffic. Both families are needed because
// `localhost` resolves to ::1 first. Set HOST to bind a single address instead.
const HOSTS = process.env.HOST ? [process.env.HOST] : ['127.0.0.1', '::1'];

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is missing. Copy server/.env.example to server/.env');
  process.exit(1);
}

const listen = (app, host) =>
  new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.once('error', reject);
    server.listen(PORT, host, () => resolve(server));
  });

try {
  await connectDB(process.env.MONGO_URI);
} catch (err) {
  console.error('❌ Failed to start server:', err.message);
  console.error('   Is MongoDB running, and is MONGO_URI correct in server/.env?');
  process.exit(1);
}

const app = createApp();
const results = await Promise.allSettled(HOSTS.map((host) => listen(app, host)));
const failures = results
  .map((r, i) => ({ host: HOSTS[i], ...r }))
  .filter((r) => r.status === 'rejected');

if (failures.length === HOSTS.length) {
  const err = failures[0].reason;
  console.error(`❌ Failed to start server on port ${PORT}:`, err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`   Find the owner with: lsof -nP -iTCP:${PORT} -sTCP:LISTEN`);
    console.error('   A suspended (Ctrl+Z) dev server still holds the port — run `jobs`, then `kill %N`.');
  }
  process.exit(1);
}

for (const { host, reason } of failures) {
  console.warn(`⚠️  Could not bind ${host}:${PORT} (${reason.code || reason.message})`);
}
console.log(`🚀 VolunteerConnect API listening on http://localhost:${PORT}`);
console.log(`   AI descriptions: ${process.env.GEMINI_API_KEY ? 'Gemini' : 'mock fallback'}`);
