import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { connectDB } from './config/db.js';
import User from './models/User.js';
import Opportunity from './models/Opportunity.js';
import Registration from './models/Registration.js';

/** Returns a Date `days` from today at the given hour. */
const daysFromNow = (days, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const ORGS = [
  { name: 'Green Earth Collective', email: 'green@volunteerconnect.dev' },
  { name: 'City Food Bank', email: 'foodbank@volunteerconnect.dev' },
  { name: 'Paws & Claws Shelter', email: 'paws@volunteerconnect.dev' },
];

const VOLUNTEERS = [
  { name: 'Asha Verma', email: 'asha@volunteerconnect.dev' },
  { name: 'Liam Chen', email: 'liam@volunteerconnect.dev' },
  { name: 'Maria Santos', email: 'maria@volunteerconnect.dev' },
];

const PASSWORD = 'password123';

const OPPORTUNITIES = [
  {
    org: 'green@volunteerconnect.dev',
    title: 'Riverside Park Clean-Up',
    description:
      'Help us restore the riverside trail before the summer season. Volunteers will collect litter, clear invasive weeds, and mulch newly planted saplings alongside our field team. Gloves, bags and tools are provided — you just need sturdy shoes and a water bottle. No experience needed, and our crew leads will show you exactly what to do. Every bag collected keeps plastic out of the river and makes the park safer for wildlife and families alike.',
    category: 'Environment',
    location: 'Portland, OR',
    date: daysFromNow(7, 9),
    requiredVolunteers: 20,
  },
  {
    org: 'green@volunteerconnect.dev',
    title: 'Community Garden Planting Day',
    description:
      'Spend a morning turning an empty lot into a thriving neighbourhood garden. You will help build raised beds, mix compost, and plant vegetables that go straight to local families. Gardening know-how is welcome but absolutely not required — we pair newcomers with experienced growers. Bring a hat and comfortable clothes you do not mind getting soil on. Come for an hour or stay all day!',
    category: 'Environment',
    location: 'Portland, OR',
    date: daysFromNow(14, 10),
    requiredVolunteers: 12,
  },
  {
    org: 'foodbank@volunteerconnect.dev',
    title: 'Weekend Meal Packing Shift',
    description:
      'Join our warehouse team to sort donations and pack weekend meal kits for families across the city. Volunteers work in small, friendly assembly lines — weighing produce, boxing staples, and labelling hampers. Training takes five minutes and no prior experience is needed. Each shift packs roughly 400 kits, so your few hours reach hundreds of neighbours. Sign up and bring a friend!',
    category: 'Food Security',
    location: 'Chicago, IL',
    date: daysFromNow(3, 13),
    requiredVolunteers: 15,
  },
  {
    org: 'foodbank@volunteerconnect.dev',
    title: 'Senior Grocery Delivery Drivers',
    description:
      'Deliver fresh grocery boxes to older neighbours who cannot easily leave home. Drivers collect pre-packed boxes from our depot, follow a short route of four to six homes, and share a friendly hello at the door. A valid licence and your own vehicle are required; fuel costs are reimbursed. It is a simple two-hour commitment that makes a real difference to someone’s week.',
    category: 'Seniors',
    location: 'Chicago, IL',
    date: daysFromNow(10, 11),
    requiredVolunteers: 8,
  },
  {
    org: 'paws@volunteerconnect.dev',
    title: 'Shelter Dog Walking Morning',
    description:
      'Our rescue dogs need exercise, fresh air and friendly company before they head to their forever homes. Volunteers walk dogs along our safe on-site trail, help with basic grooming, and spend time socialising the shyer pups. Staff match every walker with a dog that suits their comfort level, so first-timers are very welcome. Wear closed-toe shoes and prepare for plenty of tail wags.',
    category: 'Animals',
    location: 'Austin, TX',
    date: daysFromNow(5, 8),
    requiredVolunteers: 10,
  },
  {
    org: 'paws@volunteerconnect.dev',
    title: 'Adoption Fair Support Crew',
    description:
      'Help our biggest adoption event of the season run smoothly. Volunteers set up pens and signage, greet visitors, answer simple questions about our animals, and assist families filling in adoption paperwork. You will work next to experienced staff who handle anything complex. It is a lively, rewarding day — last year’s fair found homes for 38 animals. Come be part of the next one!',
    category: 'Community',
    location: 'Austin, TX',
    date: daysFromNow(21, 10),
    requiredVolunteers: 18,
  },
  {
    org: 'green@volunteerconnect.dev',
    title: 'After-School Reading Buddies',
    description:
      'Sit down with primary-school students for 45 minutes of reading, encouragement and confidence-building. Volunteers receive a short orientation, a book pack and a matched student who looks forward to seeing the same friendly face each week. No teaching background is needed — patience and warmth matter far more. Consistency helps most, so we ask for a four-week commitment where possible.',
    category: 'Education',
    location: 'Seattle, WA',
    date: daysFromNow(9, 15),
    requiredVolunteers: 14,
  },
  {
    org: 'foodbank@volunteerconnect.dev',
    title: 'Community Health Fair Helpers',
    description:
      'Support a free health fair offering screenings, vaccinations and wellness advice to anyone who walks in. Volunteers guide visitors between stations, manage the welcome desk, restock supplies and help keep queues moving. Clinical experience is not required — medical staff handle all care. Your role is to make every visitor feel welcome and unhurried on what can be a nerve-racking day.',
    category: 'Health',
    location: 'Seattle, WA',
    date: daysFromNow(17, 9),
    requiredVolunteers: 16,
  },
];

async function seed() {
  await connectDB(process.env.MONGO_URI);

  console.log('🧹 Clearing existing users, opportunities and registrations…');
  await Promise.all([
    User.deleteMany({}),
    Opportunity.deleteMany({}),
    Registration.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const orgs = await User.insertMany(
    ORGS.map((o) => ({ ...o, passwordHash, role: 'organization' }))
  );
  const volunteers = await User.insertMany(
    VOLUNTEERS.map((v) => ({ ...v, passwordHash, role: 'volunteer' }))
  );
  console.log(`👥 Created ${orgs.length} organizations and ${volunteers.length} volunteers`);

  const orgByEmail = new Map(orgs.map((o) => [o.email, o._id]));
  const opportunities = await Opportunity.insertMany(
    OPPORTUNITIES.map(({ org, ...rest }) => ({ ...rest, organizationId: orgByEmail.get(org) }))
  );
  console.log(`📋 Created ${opportunities.length} opportunities`);

  // A few sample sign-ups so the dashboards are not empty on first run.
  const registrations = [
    { volunteerId: volunteers[0]._id, opportunityId: opportunities[0]._id },
    { volunteerId: volunteers[0]._id, opportunityId: opportunities[2]._id },
    { volunteerId: volunteers[1]._id, opportunityId: opportunities[0]._id },
    { volunteerId: volunteers[1]._id, opportunityId: opportunities[4]._id },
    { volunteerId: volunteers[2]._id, opportunityId: opportunities[2]._id },
    { volunteerId: volunteers[2]._id, opportunityId: opportunities[6]._id },
  ];
  await Registration.insertMany(registrations);
  console.log(`✍️  Created ${registrations.length} registrations`);

  console.log('\n✅ Seed complete. Sample logins (password for all: %s)\n', PASSWORD);
  console.log('   Organizations:');
  ORGS.forEach((o) => console.log(`     ${o.email}  — ${o.name}`));
  console.log('   Volunteers:');
  VOLUNTEERS.forEach((v) => console.log(`     ${v.email}  — ${v.name}`));

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('❌ Seed failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
