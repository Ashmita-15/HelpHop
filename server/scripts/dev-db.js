/**
 * Convenience: starts a throwaway in-memory MongoDB on port 27017 so you can
 * run the app without installing MongoDB.
 *
 *   npm run db:memory
 *
 * Data is lost when you stop it (Ctrl+C). For anything you want to keep, use a
 * real MongoDB (local or Atlas) and set MONGO_URI in server/.env.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create({
  instance: { port: 27017, dbName: 'volunteerconnect' },
});

console.log(`🗄️  In-memory MongoDB running at ${mongo.getUri('volunteerconnect')}`);
console.log('   Leave this running. Seed with:  npm run seed');
console.log('   Press Ctrl+C to stop (all data is discarded).');

const shutdown = async () => {
  await mongo.stop();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
