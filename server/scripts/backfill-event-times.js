/**
 * One-off migration: fills in startsAt / endsAt / tzOffsetMinutes for
 * opportunities written before those fields existed.
 *
 *   npm run backfill:times
 *
 * Safe to run more than once — rows that already have an endsAt are skipped
 * unless you pass --force. Nothing else about the document is touched.
 *
 * Existing rows carry no timezone of their own, so they are resolved against
 * this machine's offset, which is the offset they were created under. Set
 * EVENT_TZ_OFFSET_MINUTES (minutes east of UTC, e.g. 330 for IST) to override
 * that if the API now runs somewhere else than it used to.
 */
import 'dotenv/config';
import mongoose from 'mongoose';

import { connectDB } from '../src/config/db.js';
import Opportunity from '../src/models/Opportunity.js';
import { readOffsetMinutes, resolveEventWindow, serverOffsetMinutes } from '../src/utils/dates.js';

const force = process.argv.includes('--force');
const override = readOffsetMinutes(process.env.EVENT_TZ_OFFSET_MINUTES);

async function main() {
  await connectDB(process.env.MONGO_URI);

  const filter = force ? {} : { $or: [{ endsAt: null }, { endsAt: { $exists: false } }] };
  const docs = await Opportunity.find(filter).select(
    'date startTime endTime tzOffsetMinutes startsAt endsAt title'
  );

  console.log(`Found ${docs.length} opportunit${docs.length === 1 ? 'y' : 'ies'} to backfill.`);

  let updated = 0;
  for (const doc of docs) {
    const offset = override ?? readOffsetMinutes(doc.tzOffsetMinutes) ?? serverOffsetMinutes(doc.date);

    const { startsAt, endsAt } = resolveEventWindow({
      date: doc.date,
      startTime: doc.startTime,
      endTime: doc.endTime,
      tzOffsetMinutes: offset,
    });

    if (!endsAt) {
      console.warn(`  ! skipped "${doc.title}" (${doc._id}) — its date could not be read`);
      continue;
    }

    doc.tzOffsetMinutes = offset;
    doc.startsAt = startsAt;
    doc.endsAt = endsAt;
    await doc.save();
    updated += 1;
    console.log(`  ✓ ${doc.title} → ends ${endsAt.toISOString()}`);
  }

  console.log(`\nBackfilled ${updated} of ${docs.length}.`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Backfill failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
