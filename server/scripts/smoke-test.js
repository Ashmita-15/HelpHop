/**
 * End-to-end API smoke test.
 *
 * Spins up an in-memory MongoDB (no local mongod required), boots the real
 * Express app, and exercises every route the frontend calls.
 *
 *   npm run smoke
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-test-secret';
process.env.GEMINI_API_KEY = ''; // force the mock path so the test is offline-safe

const { createApp } = await import('../src/app.js');

let passed = 0;
let failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const mongo = await MongoMemoryServer.create();
await mongoose.connect(mongo.getUri('volunteerconnect_test'));

const server = createApp().listen(0);
const { port } = server.address();
const BASE = `http://127.0.0.1:${port}/api`;

async function call(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

try {
  console.log('\n▶ Health');
  const health = await call('/health');
  check('GET /api/health returns ok', health.body?.status === 'ok');

  console.log('\n▶ Auth');
  const org = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Test Org', email: 'org@test.dev', password: 'password123', role: 'organization' },
  });
  check('register organization → 201 + token', org.status === 201 && !!org.body.token, `got ${org.status}`);
  check('password hash is never returned', !JSON.stringify(org.body).includes('passwordHash'));
  const orgToken = org.body.token;

  const vol = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Test Volunteer', email: 'vol@test.dev', password: 'password123', role: 'volunteer' },
  });
  check('register volunteer → 201', vol.status === 201, `got ${vol.status}`);
  const volToken = vol.body.token;

  const dupe = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Dup', email: 'org@test.dev', password: 'password123', role: 'volunteer' },
  });
  check('duplicate email → 409', dupe.status === 409, `got ${dupe.status}`);

  const badRole = await call('/auth/register', {
    method: 'POST',
    body: { name: 'X', email: 'x@test.dev', password: 'password123', role: 'admin' },
  });
  check('invalid role → 400', badRole.status === 400, `got ${badRole.status}`);

  const shortPw = await call('/auth/register', {
    method: 'POST',
    body: { name: 'X', email: 'y@test.dev', password: '123', role: 'volunteer' },
  });
  check('short password → 400', shortPw.status === 400, `got ${shortPw.status}`);

  const login = await call('/auth/login', {
    method: 'POST',
    body: { email: 'org@test.dev', password: 'password123' },
  });
  check('login with correct password → 200', login.status === 200, `got ${login.status}`);

  const badLogin = await call('/auth/login', {
    method: 'POST',
    body: { email: 'org@test.dev', password: 'wrong' },
  });
  check('login with wrong password → 401', badLogin.status === 401, `got ${badLogin.status}`);

  const me = await call('/auth/me', { token: orgToken });
  check('GET /auth/me returns the user', me.body?.user?.email === 'org@test.dev');

  const noAuth = await call('/auth/me');
  check('GET /auth/me without token → 401', noAuth.status === 401, `got ${noAuth.status}`);

  console.log('\n▶ AI description');
  const ai = await call('/ai/generate-description', {
    method: 'POST',
    token: orgToken,
    body: { title: 'Beach Clean-Up', category: 'Environment', location: 'Goa' },
  });
  check('mock fallback returns a description', ai.status === 200 && ai.body.description.length > 80, `got ${ai.status}`);
  check('fallback is labelled as mock', ai.body?.source === 'mock');

  const aiAsVolunteer = await call('/ai/generate-description', {
    method: 'POST',
    token: volToken,
    body: { title: 'X', category: 'Environment', location: 'Y' },
  });
  check('volunteer cannot use AI endpoint → 403', aiAsVolunteer.status === 403, `got ${aiAsVolunteer.status}`);

  console.log('\n▶ Opportunities CRUD');
  const created = await call('/opportunities', {
    method: 'POST',
    token: orgToken,
    body: {
      title: 'Beach Clean-Up',
      description: ai.body.description,
      category: 'Environment',
      location: 'Goa',
      date: new Date(Date.now() + 7 * 864e5).toISOString(),
      requiredVolunteers: 2,
    },
  });
  check('organization can create → 201', created.status === 201, `got ${created.status}`);
  const oppId = created.body?.opportunity?._id;

  const volCreate = await call('/opportunities', {
    method: 'POST',
    token: volToken,
    body: {
      title: 'Nope',
      description: 'x',
      category: 'Environment',
      location: 'Goa',
      date: new Date().toISOString(),
      requiredVolunteers: 1,
    },
  });
  check('volunteer cannot create → 403', volCreate.status === 403, `got ${volCreate.status}`);

  const badCategory = await call('/opportunities', {
    method: 'POST',
    token: orgToken,
    body: {
      title: 'Bad',
      description: 'x',
      category: 'Nonsense',
      location: 'Goa',
      date: new Date().toISOString(),
      requiredVolunteers: 1,
    },
  });
  check('invalid category → 400', badCategory.status === 400, `got ${badCategory.status}`);

  const list = await call('/opportunities');
  check('public list works without a token', list.status === 200 && list.body.opportunities.length === 1);
  check('list populates the organization name', list.body.opportunities[0].organizationId?.name === 'Test Org');

  const bySearch = await call('/opportunities?search=beach');
  check('search is case-insensitive', bySearch.body.opportunities.length === 1);

  const byBadSearch = await call('/opportunities?search=zzzz');
  check('search with no match returns []', byBadSearch.body.opportunities.length === 0);

  const byCategory = await call('/opportunities?category=Education');
  check('category filter excludes non-matches', byCategory.body.opportunities.length === 0);

  const byLocation = await call('/opportunities?location=goa');
  check('location filter is case-insensitive', byLocation.body.opportunities.length === 1);

  const one = await call(`/opportunities/${oppId}`);
  check('GET /opportunities/:id → 200', one.status === 200, `got ${one.status}`);

  const missing = await call('/opportunities/507f1f77bcf86cd799439011');
  check('unknown id → 404', missing.status === 404, `got ${missing.status}`);

  const malformed = await call('/opportunities/not-an-id');
  check('malformed id → 404 (not a 500)', malformed.status === 404, `got ${malformed.status}`);

  const updated = await call(`/opportunities/${oppId}`, {
    method: 'PUT',
    token: orgToken,
    body: {
      title: 'Beach Clean-Up (updated)',
      description: created.body.opportunity.description,
      category: 'Environment',
      location: 'Goa',
      date: new Date(Date.now() + 8 * 864e5).toISOString(),
      requiredVolunteers: 2,
    },
  });
  check('owner can update → 200', updated.status === 200, `got ${updated.status}`);
  check('update persisted', updated.body.opportunity.title === 'Beach Clean-Up (updated)');

  console.log('\n▶ Joining');
  const join = await call(`/opportunities/${oppId}/join`, { method: 'POST', token: volToken });
  check('volunteer can join → 201', join.status === 201, `got ${join.status}`);

  const joinAgain = await call(`/opportunities/${oppId}/join`, { method: 'POST', token: volToken });
  check('duplicate join → 409', joinAgain.status === 409, `got ${joinAgain.status}`);

  const orgJoin = await call(`/opportunities/${oppId}/join`, { method: 'POST', token: orgToken });
  check('organization cannot join → 403', orgJoin.status === 403, `got ${orgJoin.status}`);

  const anonJoin = await call(`/opportunities/${oppId}/join`, { method: 'POST' });
  check('anonymous cannot join → 401', anonJoin.status === 401, `got ${anonJoin.status}`);

  const seen = await call(`/opportunities/${oppId}`, { token: volToken });
  check('joined flag is true for that volunteer', seen.body.opportunity.joined === true);
  check('registeredCount is 1', seen.body.opportunity.registeredCount === 1);
  check('spotsLeft is 1', seen.body.opportunity.spotsLeft === 1);

  // Fill the last spot, then confirm capacity is enforced.
  const vol2 = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Vol Two', email: 'vol2@test.dev', password: 'password123', role: 'volunteer' },
  });
  await call(`/opportunities/${oppId}/join`, { method: 'POST', token: vol2.body.token });

  const vol3 = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Vol Three', email: 'vol3@test.dev', password: 'password123', role: 'volunteer' },
  });
  const overflow = await call(`/opportunities/${oppId}/join`, { method: 'POST', token: vol3.body.token });
  check('joining a full opportunity → 409', overflow.status === 409, `got ${overflow.status}`);

  console.log('\n▶ Volunteers list & dashboards');
  const volunteers = await call(`/opportunities/${oppId}/volunteers`, { token: orgToken });
  check('owner sees both registered volunteers', volunteers.body?.volunteers?.length === 2);
  check('volunteer emails are included', volunteers.body.volunteers.some((v) => v.email === 'vol@test.dev'));

  const volunteersAsVolunteer = await call(`/opportunities/${oppId}/volunteers`, { token: volToken });
  check('volunteer cannot list volunteers → 403', volunteersAsVolunteer.status === 403, `got ${volunteersAsVolunteer.status}`);

  const volDash = await call('/users/dashboard', { token: volToken });
  check('volunteer dashboard lists joined opportunity', volDash.body?.opportunities?.length === 1);
  check('volunteer dashboard stats', volDash.body?.stats?.totalJoined === 1);
  check(
    'volunteer dashboard includes registeredCount',
    volDash.body?.opportunities?.[0]?.registeredCount === 2,
    `got ${volDash.body?.opportunities?.[0]?.registeredCount}`
  );
  check('volunteer dashboard includes spotsLeft', volDash.body?.opportunities?.[0]?.spotsLeft === 0);

  const orgDash = await call('/users/dashboard', { token: orgToken });
  check('organization dashboard lists own opportunity', orgDash.body?.opportunities?.length === 1);
  check('organization dashboard counts volunteers', orgDash.body?.stats?.totalVolunteers === 2);

  console.log('\n▶ Ownership & deletion');
  const org2 = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Other Org', email: 'org2@test.dev', password: 'password123', role: 'organization' },
  });
  const foreignEdit = await call(`/opportunities/${oppId}`, {
    method: 'PUT',
    token: org2.body.token,
    body: {
      title: 'Hijacked',
      description: 'x'.repeat(50),
      category: 'Environment',
      location: 'Goa',
      date: new Date().toISOString(),
      requiredVolunteers: 5,
    },
  });
  check('another org cannot edit → 403', foreignEdit.status === 403, `got ${foreignEdit.status}`);

  const foreignDelete = await call(`/opportunities/${oppId}`, { method: 'DELETE', token: org2.body.token });
  check('another org cannot delete → 403', foreignDelete.status === 403, `got ${foreignDelete.status}`);

  const del = await call(`/opportunities/${oppId}`, { method: 'DELETE', token: orgToken });
  check('owner can delete → 200', del.status === 200, `got ${del.status}`);

  const afterDelete = await call('/users/dashboard', { token: volToken });
  check('cascade removed the volunteer registration', afterDelete.body.opportunities.length === 0);

  const badToken = await call('/users/dashboard', { token: 'not.a.real.token' });
  check('garbage token → 401', badToken.status === 401, `got ${badToken.status}`);

  const unknownRoute = await call('/does-not-exist');
  check('unknown route → 404 JSON', unknownRoute.status === 404 && !!unknownRoute.body.message);
} catch (err) {
  failed++;
  console.error('\n💥 Unexpected error:', err);
} finally {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
}

console.log(`\n${'─'.repeat(48)}`);
console.log(failed === 0 ? `🎉 All ${passed} checks passed` : `⚠️  ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
