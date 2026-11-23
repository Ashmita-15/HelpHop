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


let passed = 0;
let failed = 0;

/** 'YYYY-MM-DD', exactly what an <input type="date"> sends. */
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const serverOffset = -new Date().getTimezoneOffset();

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
// app.js connects lazily per request from MONGO_URI, so the in-memory server
// has to be in the environment before the app is imported.
process.env.MONGO_URI = mongo.getUri('volunteerconnect_test');
await mongoose.connect(process.env.MONGO_URI);

const { createApp } = await import('../src/app.js');

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

  console.log('\n▶ Attendance (QR + manual)');
  const org2 = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Other Org', email: 'org2@test.dev', password: 'password123', role: 'organization' },
  });
  // A fresh event dated today, so the check-in window is open.
  const today = new Date();
  const evt = await call('/opportunities', {
    method: 'POST',
    token: orgToken,
    body: {
      title: 'Park Clean-Up Day',
      description: 'x'.repeat(60),
      category: 'Environment',
      location: 'Kolkata',
      date: today.toISOString(),
      requiredVolunteers: 5,
      gig: { mode: 'paid', amount: 500, currency: 'INR' },
    },
  });
  check('create event with a paid gig → 201', evt.status === 201, `got ${evt.status}`);
  check('gig is persisted', evt.body?.opportunity?.gig?.amount === 500 && evt.body.opportunity.gig.mode === 'paid');
  check('checkinSecret is never exposed', !JSON.stringify(evt.body).includes('checkinSecret'));
  const evtId = evt.body.opportunity._id;

  const badGig = await call('/opportunities', {
    method: 'POST',
    token: orgToken,
    body: {
      title: 'Bad gig', description: 'x'.repeat(60), category: 'Environment', location: 'Kolkata',
      date: today.toISOString(), requiredVolunteers: 2, gig: { mode: 'paid' },
    },
  });
  check('paid gig without an amount → 400', badGig.status === 400, `got ${badGig.status}`);

  const badPerk = await call('/opportunities', {
    method: 'POST',
    token: orgToken,
    body: {
      title: 'Bad perk', description: 'x'.repeat(60), category: 'Environment', location: 'Kolkata',
      date: today.toISOString(), requiredVolunteers: 2, gig: { mode: 'perk' },
    },
  });
  check('perk gig without a title → 400', badPerk.status === 400, `got ${badPerk.status}`);

  // vol and vol2 join; vol3 stays away so we can prove absentees get nothing.
  await call(`/opportunities/${evtId}/join`, { method: 'POST', token: volToken });
  await call(`/opportunities/${evtId}/join`, { method: 'POST', token: vol2.body.token });

  const tok = await call(`/opportunities/${evtId}/checkin-token`, { method: 'POST', token: orgToken });
  check('org can mint a check-in token → 200', tok.status === 200, `got ${tok.status}`);
  check('token response carries a QR data URL', (tok.body?.qrDataUrl || '').startsWith('data:image/png;base64,'));

  const tokAsVol = await call(`/opportunities/${evtId}/checkin-token`, { method: 'POST', token: volToken });
  check('volunteer cannot mint a token → 403', tokAsVol.status === 403, `got ${tokAsVol.status}`);

  const foreignTok = await call(`/opportunities/${evtId}/checkin-token`, { method: 'POST', token: org2.body.token });
  check('another org cannot mint a token → 403', foreignTok.status === 403, `got ${foreignTok.status}`);

  check('token response includes a 6-digit typed code', /^\d{6}$/.test(tok.body?.code || ''),
    `got ${tok.body?.code}`);

  const scan = await call(`/opportunities/${evtId}/checkin`, {
    method: 'POST', token: volToken, body: { token: tok.body.token },
  });
  check('valid QR check-in → 201', scan.status === 201, `got ${scan.status}`);
  check('check-in is recorded as qr', scan.body?.attendance?.method === 'qr');

  const scanAgain = await call(`/opportunities/${evtId}/checkin`, {
    method: 'POST', token: volToken, body: { token: tok.body.token },
  });
  check('duplicate check-in → 409', scanAgain.status === 409, `got ${scanAgain.status}`);

  const forged = await call(`/opportunities/${evtId}/checkin`, {
    method: 'POST', token: vol2.body.token, body: { token: 'bm90LWEtdG9rZW4' },
  });
  check('forged token → 401', forged.status === 401, `got ${forged.status}`);

  const noTok = await call(`/opportunities/${evtId}/checkin`, { method: 'POST', token: vol2.body.token, body: {} });
  check('missing token → 401', noTok.status === 401, `got ${noTok.status}`);

  // A token minted for one event must not work on another.
  const otherEvt = await call('/opportunities', {
    method: 'POST', token: orgToken,
    body: {
      title: 'Other event', description: 'x'.repeat(60), category: 'Health', location: 'Pune',
      date: today.toISOString(), requiredVolunteers: 3, gig: { mode: 'none' },
    },
  });
  await call(`/opportunities/${otherEvt.body.opportunity._id}/join`, { method: 'POST', token: vol2.body.token });
  const crossEvent = await call(`/opportunities/${otherEvt.body.opportunity._id}/checkin`, {
    method: 'POST', token: vol2.body.token, body: { token: tok.body.token },
  });
  check("another event's token is rejected → 401", crossEvent.status === 401, `got ${crossEvent.status}`);

  const unregistered = await call(`/opportunities/${evtId}/checkin`, {
    method: 'POST', token: vol3.body.token, body: { token: tok.body.token },
  });
  check('unregistered volunteer cannot check in → 403', unregistered.status === 403, `got ${unregistered.status}`);

  // The typed code is the no-camera path: it must behave exactly like the QR.
  const codeEvt = await call('/opportunities', {
    method: 'POST', token: orgToken,
    body: {
      title: 'Typed code drill', description: 'x'.repeat(60), category: 'Community',
      location: 'Kolkata', date: today.toISOString(), requiredVolunteers: 4, gig: { mode: 'none' },
    },
  });
  const codeEvtId = codeEvt.body.opportunity._id;
  await call(`/opportunities/${codeEvtId}/join`, { method: 'POST', token: volToken });
  const codeTok = await call(`/opportunities/${codeEvtId}/checkin-token`, { method: 'POST', token: orgToken });

  const byCode = await call(`/opportunities/${codeEvtId}/checkin`, {
    method: 'POST', token: volToken, body: { token: codeTok.body.code },
  });
  check('checking in with the typed code → 201', byCode.status === 201, `got ${byCode.status}`);
  check('a typed-code check-in still counts as qr', byCode.body?.attendance?.method === 'qr');

  const wrongCode = await call(`/opportunities/${codeEvtId}/checkin`, {
    method: 'POST', token: vol2.body.token, body: { token: '000000' },
  });
  check('a wrong 6-digit code → 401 (not accepted)', [401, 403].includes(wrongCode.status), `got ${wrongCode.status}`);

  const shortCode = await call(`/opportunities/${codeEvtId}/checkin`, {
    method: 'POST', token: vol2.body.token, body: { token: '12345' },
  });
  check('a 5-digit code → 401', [401, 403].includes(shortCode.status), `got ${shortCode.status}`);

  // Another event's code must not work here.
  const crossCode = await call(`/opportunities/${codeEvtId}/checkin`, {
    method: 'POST', token: vol2.body.token, body: { token: tok.body.code },
  });
  check("another event's typed code is rejected", [401, 403].includes(crossCode.status), `got ${crossCode.status}`);

  // Brute-force guard: the code is only 6 digits, so repeated failures lock out.
  const guinea = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Brute Force', email: 'brute@test.dev', password: 'password123', role: 'volunteer' },
  });
  await call(`/opportunities/${codeEvtId}/join`, { method: 'POST', token: guinea.body.token });
  let lockedStatus = 0;
  for (let i = 0; i < 12; i++) {
    const r = await call(`/opportunities/${codeEvtId}/checkin`, {
      method: 'POST', token: guinea.body.token, body: { token: '999999' },
    });
    lockedStatus = r.status;
    if (r.status === 429) break;
  }
  check('repeated wrong codes get throttled → 429', lockedStatus === 429, `got ${lockedStatus}`);

  const futureEvt = await call('/opportunities', {
    method: 'POST', token: orgToken,
    body: {
      title: 'Next month', description: 'x'.repeat(60), category: 'Education', location: 'Delhi',
      date: new Date(Date.now() + 30 * 864e5).toISOString(), requiredVolunteers: 2, gig: { mode: 'none' },
    },
  });
  const futureId = futureEvt.body.opportunity._id;
  await call(`/opportunities/${futureId}/join`, { method: 'POST', token: volToken });

  // The organisation used to be handed a working QR for an event weeks away,
  // which the volunteer's scan then refused — so the person who saw the error
  // was the one who had done nothing wrong. Minting is now refused up front.
  const futureTok = await call(`/opportunities/${futureId}/checkin-token`, { method: 'POST', token: orgToken });
  check('minting a QR before the window → 409', futureTok.status === 409, `got ${futureTok.status}`);
  check(
    'the refusal says when check-in opens',
    /opens on/i.test(futureTok.body?.message || ''),
    futureTok.body?.message
  );
  const earlyScan = await call(`/opportunities/${futureId}/checkin`, {
    method: 'POST', token: volToken, body: { token: 'x'.repeat(12) },
  });
  check('check-in before the event day is refused', [401, 409].includes(earlyScan.status), `got ${earlyScan.status}`);

  // The window has to be read in the event's own timezone. `date` is stored at
  // exact UTC midnight, so a server that reads it with local getters opens the
  // door at a different instant than the browser does — which is how a
  // same-day event could be offered and then refused.
  for (const [label, offset] of [['Kolkata', 330], ['Chicago', -360], ['UTC', 0]]) {
    const tzEvt = await call('/opportunities', {
      method: 'POST', token: orgToken,
      body: {
        title: `Today in ${label}`, description: 'x'.repeat(60), category: 'Community',
        location: label, date: ymd(new Date()), startTime: '09:00', endTime: '17:00',
        tzOffsetMinutes: offset, requiredVolunteers: 3, gig: { mode: 'none' },
      },
    });
    const tzId = tzEvt.body?.opportunity?._id;
    const tzTok = await call(`/opportunities/${tzId}/checkin-token`, { method: 'POST', token: orgToken });
    check(`an event dated today in ${label} can mint a code → 200`, tzTok.status === 200, `got ${tzTok.status} ${tzTok.body?.message || ''}`);

    await call(`/opportunities/${tzId}/join`, { method: 'POST', token: volToken });
    const tzScan = await call(`/opportunities/${tzId}/checkin`, {
      method: 'POST', token: volToken, body: { token: tzTok.body?.token },
    });
    check(`a volunteer can check in to today's ${label} event → 201`, tzScan.status === 201, `got ${tzScan.status} ${tzScan.body?.message || ''}`);
  }

  console.log('\n▶ Manual attendance');
  const manual = await call(`/opportunities/${evtId}/attendance/${vol2.body.user?.id || vol2.body.user?._id}`, {
    method: 'PATCH', token: orgToken, body: { present: true },
  });
  check('org can mark a volunteer present → 200', manual.status === 200, `got ${manual.status}`);

  const roster = await call(`/opportunities/${evtId}/attendance`, { token: orgToken });
  check('roster lists both registrants', roster.body?.roster?.length === 2, `got ${roster.body?.roster?.length}`);
  check('roster counts 2 present', roster.body?.counts?.present === 2, `got ${roster.body?.counts?.present}`);
  check('roster records both methods',
    roster.body.roster.some((r) => r.method === 'qr') && roster.body.roster.some((r) => r.method === 'manual'));

  const rosterAsVol = await call(`/opportunities/${evtId}/attendance`, { token: volToken });
  check('volunteer cannot read the roster → 403', rosterAsVol.status === 403, `got ${rosterAsVol.status}`);

  const unmark = await call(`/opportunities/${evtId}/attendance/${vol2.body.user?.id || vol2.body.user?._id}`, {
    method: 'PATCH', token: orgToken, body: { present: false },
  });
  check('org can un-mark a volunteer → 200', unmark.status === 200, `got ${unmark.status}`);
  check('un-marking drops the count to 1', unmark.body?.counts?.present === 1, `got ${unmark.body?.counts?.present}`);

  // Put them back for the completion tests.
  await call(`/opportunities/${evtId}/attendance/${vol2.body.user?.id || vol2.body.user?._id}`, {
    method: 'PATCH', token: orgToken, body: { present: true },
  });

  const markAbsentee = await call(`/opportunities/${evtId}/attendance/${vol3.body.user?.id || vol3.body.user?._id}`, {
    method: 'PATCH', token: orgToken, body: { present: true },
  });
  check('cannot mark someone who never joined → 404', markAbsentee.status === 404, `got ${markAbsentee.status}`);

  const badBody = await call(`/opportunities/${evtId}/attendance/${vol2.body.user?.id || vol2.body.user?._id}`, {
    method: 'PATCH', token: orgToken, body: { present: 'yes' },
  });
  check('non-boolean present → 400', badBody.status === 400, `got ${badBody.status}`);

  console.log('\n▶ Completion → gigs + certificates');
  const earlyComplete = await call(`/opportunities/${futureId}/complete`, { method: 'POST', token: orgToken });
  check('completing before the event day → 409', earlyComplete.status === 409, `got ${earlyComplete.status}`);

  const foreignComplete = await call(`/opportunities/${evtId}/complete`, { method: 'POST', token: org2.body.token });
  check('another org cannot complete → 403', foreignComplete.status === 403, `got ${foreignComplete.status}`);

  // Completion is gated on the event's real scheduled end, so the fixture has
  // to have actually finished. It was created dated today with no end time,
  // which means it runs until midnight — give it a window that has closed.
  const windUp = await call(`/opportunities/${evtId}`, {
    method: 'PUT', token: orgToken,
    body: {
      title: 'Park Clean-Up Day', description: 'x'.repeat(60), category: 'Environment',
      location: 'Kolkata', date: ymd(new Date()), startTime: '00:00', endTime: '00:30',
      tzOffsetMinutes: serverOffset, requiredVolunteers: 5,
      gig: { mode: 'paid', amount: 500, currency: 'INR' },
    },
  });
  check('the event can be given a window that has closed → 200', windUp.status === 200, `got ${windUp.status} ${windUp.body?.message || ''}`);
  check('that event now reads as finished', new Date(windUp.body?.opportunity?.endsAt).getTime() < Date.now());

  const done = await call(`/opportunities/${evtId}/complete`, { method: 'POST', token: orgToken });
  check('owner can complete → 200', done.status === 200, `got ${done.status}`);
  check('one award per attendee', done.body?.awards === 2, `got ${done.body?.awards}`);
  check('one certificate per attendee', done.body?.certificates === 2, `got ${done.body?.certificates}`);

  const again = await call(`/opportunities/${evtId}/complete`, { method: 'POST', token: orgToken });
  check('completing twice is idempotent', again.status === 200 && again.body.awards === 2 && again.body.certificates === 2,
    `got ${again.status} awards=${again.body?.awards} certs=${again.body?.certificates}`);
  check('completedAt does not move', again.body.completedAt === done.body.completedAt);

  const lateEdit = await call(`/opportunities/${evtId}`, {
    method: 'PUT', token: orgToken,
    body: {
      title: 'Renamed', description: 'x'.repeat(60), category: 'Environment', location: 'Kolkata',
      date: today.toISOString(), requiredVolunteers: 5, gig: { mode: 'paid', amount: 999 },
    },
  });
  check('a completed event cannot be edited → 409', lateEdit.status === 409, `got ${lateEdit.status}`);

  const lockedMark = await call(`/opportunities/${evtId}/attendance/${vol2.body.user?.id || vol2.body.user?._id}`, {
    method: 'PATCH', token: orgToken, body: { present: false },
  });
  check('attendance locks after completion → 409', lockedMark.status === 409, `got ${lockedMark.status}`);

  const lateScan = await call(`/opportunities/${evtId}/checkin`, {
    method: 'POST', token: volToken, body: { token: tok.body.token },
  });
  check('check-in closes after completion → 409 or 401', [409, 401].includes(lateScan.status), `got ${lateScan.status}`);

  // gig.mode 'none' → certificates but no awards.
  await call(`/opportunities/${otherEvt.body.opportunity._id}/attendance/${vol2.body.user?.id || vol2.body.user?._id}`, {
    method: 'PATCH', token: orgToken, body: { present: true },
  });
  const windUpOther = await call(`/opportunities/${otherEvt.body.opportunity._id}`, {
    method: 'PUT', token: orgToken,
    body: {
      title: 'Other event', description: 'x'.repeat(60), category: 'Health', location: 'Pune',
      date: ymd(new Date()), startTime: '00:00', endTime: '00:30',
      tzOffsetMinutes: serverOffset, requiredVolunteers: 3, gig: { mode: 'none' },
    },
  });
  check('the no-gig event can be wound up → 200', windUpOther.status === 200, `got ${windUpOther.status}`);
  const noneDone = await call(`/opportunities/${otherEvt.body.opportunity._id}/complete`, { method: 'POST', token: orgToken });
  check("gig.mode 'none' issues no awards", noneDone.body?.awards === 0, `got ${noneDone.body?.awards}`);
  check("gig.mode 'none' still issues certificates", noneDone.body?.certificates === 1, `got ${noneDone.body?.certificates}`);

  console.log('\n▶ Gigs');
  const myGigs = await call('/users/me/gigs', { token: volToken });
  check('volunteer sees their gig', myGigs.body?.gigs?.length === 1, `got ${myGigs.body?.gigs?.length}`);
  check('gig snapshots the amount', myGigs.body.gigs[0].amount === 500);
  check('gig starts pending', myGigs.body.gigs[0].status === 'pending');
  check('gig carries the event title', myGigs.body.gigs[0].opportunity?.title === 'Park Clean-Up Day');

  const absenteeGigs = await call('/users/me/gigs', { token: vol3.body.token });
  check('an absentee receives no gig', absenteeGigs.body?.gigs?.length === 0, `got ${absenteeGigs.body?.gigs?.length}`);

  const orgGigs = await call(`/opportunities/${evtId}/gigs`, { token: orgToken });
  check('org sees both gigs', orgGigs.body?.gigs?.length === 2, `got ${orgGigs.body?.gigs?.length}`);
  const gigId = orgGigs.body.gigs[0].id;

  const foreignSettle = await call(`/gigs/${gigId}`, {
    method: 'PATCH', token: org2.body.token, body: { status: 'settled' },
  });
  check('another org cannot settle a gig → 403', foreignSettle.status === 403, `got ${foreignSettle.status}`);

  const volSettle = await call(`/gigs/${gigId}`, { method: 'PATCH', token: volToken, body: { status: 'settled' } });
  check('volunteer cannot settle their own gig → 403', volSettle.status === 403, `got ${volSettle.status}`);

  const badStatus = await call(`/gigs/${gigId}`, { method: 'PATCH', token: orgToken, body: { status: 'paid-ish' } });
  check('invalid gig status → 400', badStatus.status === 400, `got ${badStatus.status}`);

  const settled = await call(`/gigs/${gigId}`, {
    method: 'PATCH', token: orgToken, body: { status: 'settled', reference: 'UPI 8821' },
  });
  check('org can settle a gig → 200', settled.status === 200, `got ${settled.status}`);
  check('settledAt is stamped', !!settled.body?.gig?.settledAt);
  check('reference is stored', settled.body.gig.reference === 'UPI 8821');

  console.log('\n▶ Certificates');
  const myCerts = await call('/users/me/certificates', { token: volToken });
  check('volunteer has 1 certificate', myCerts.body?.certificates?.length === 1, `got ${myCerts.body?.certificates?.length}`);
  const cert = myCerts.body.certificates[0];
  check('certificate code is 10 chars', cert?.code?.length === 10, `got ${cert?.code}`);
  check('code avoids ambiguous letters', !/[ILOU]/.test(cert.code));
  check('certificate carries a verify URL', (cert.verifyUrl || '').includes(cert.code));

  const verified = await call(`/certificates/verify/${cert.code}`);
  check('verify works with no token at all', verified.status === 200 && verified.body.valid === true, `got ${verified.status}`);
  check('verify returns the volunteer name', verified.body.volunteerName === 'Test Volunteer');
  check('verify returns the event title', verified.body.eventTitle === 'Park Clean-Up Day');
  check('verify is case-insensitive', (await call(`/certificates/verify/${cert.code.toLowerCase()}`)).body?.valid === true);

  const bogus = await call('/certificates/verify/ZZZZZZZZZZ');
  check('unknown code → valid:false (not an error)', bogus.status === 200 && bogus.body.valid === false, `got ${bogus.status}`);
  check('unknown code leaks no data', !bogus.body.volunteerName);

  const pdfRes = await fetch(`${BASE}/certificates/${cert.id}/download`, {
    headers: { Authorization: `Bearer ${volToken}` },
  });
  const pdfBuf = Buffer.from(await pdfRes.arrayBuffer());
  check('certificate downloads → 200', pdfRes.status === 200, `got ${pdfRes.status}`);
  check('response is a PDF', pdfRes.headers.get('content-type') === 'application/pdf');
  check('PDF has a real header', pdfBuf.subarray(0, 5).toString() === '%PDF-');
  check('PDF is non-trivial in size', pdfBuf.length > 2000, `got ${pdfBuf.length} bytes`);

  const issuerPdf = await fetch(`${BASE}/certificates/${cert.id}/download`, {
    headers: { Authorization: `Bearer ${orgToken}` },
  });
  check('issuing org can download it too', issuerPdf.status === 200, `got ${issuerPdf.status}`);

  const strangerPdf = await fetch(`${BASE}/certificates/${cert.id}/download`, {
    headers: { Authorization: `Bearer ${vol3.body.token}` },
  });
  check("a stranger cannot download someone's certificate → 403", strangerPdf.status === 403, `got ${strangerPdf.status}`);

  const anonPdf = await fetch(`${BASE}/certificates/${cert.id}/download`);
  check('anonymous download → 401', anonPdf.status === 401, `got ${anonPdf.status}`);

  console.log('\n▶ Time and venue');
  const mkWhen = (overrides) => ({
    title: 'Timed shift', description: 'x'.repeat(60), category: 'Community',
    location: 'Kolkata', date: new Date().toISOString(), requiredVolunteers: 3,
    gig: { mode: 'none' }, ...overrides,
  });

  const timed = await call('/opportunities', {
    method: 'POST', token: orgToken,
    body: mkWhen({ venue: 'Gate 3, Riverside Park', startTime: '09:00', endTime: '13:00' }),
  });
  check('create with venue + times → 201', timed.status === 201, `got ${timed.status}`);
  check('venue persists', timed.body?.opportunity?.venue === 'Gate 3, Riverside Park');
  check('startTime persists', timed.body?.opportunity?.startTime === '09:00');
  check('endTime persists', timed.body?.opportunity?.endTime === '13:00');
  const timedId = timed.body.opportunity._id;

  const bare = await call('/opportunities', { method: 'POST', token: orgToken, body: mkWhen({}) });
  check('create with none of them still works → 201 (back-compat)', bare.status === 201, `got ${bare.status}`);
  check('absent venue is not invented', !bare.body.opportunity.venue);
  check('absent times are not invented', !bare.body.opportunity.startTime && !bare.body.opportunity.endTime);

  const badTime = await call('/opportunities', {
    method: 'POST', token: orgToken, body: mkWhen({ startTime: '9am' }),
  });
  check('malformed time → 400', badTime.status === 400, `got ${badTime.status}`);

  const outOfRange = await call('/opportunities', {
    method: 'POST', token: orgToken, body: mkWhen({ startTime: '25:00' }),
  });
  check('out-of-range hour → 400', outOfRange.status === 400, `got ${outOfRange.status}`);

  const backwards = await call('/opportunities', {
    method: 'POST', token: orgToken, body: mkWhen({ startTime: '14:00', endTime: '09:00' }),
  });
  check('end before start → 400', backwards.status === 400, `got ${backwards.status}`);

  const equalTimes = await call('/opportunities', {
    method: 'POST', token: orgToken, body: mkWhen({ startTime: '09:00', endTime: '09:00' }),
  });
  check('end equal to start → 400', equalTimes.status === 400, `got ${equalTimes.status}`);

  const endOnly = await call('/opportunities', {
    method: 'POST', token: orgToken, body: mkWhen({ endTime: '17:00' }),
  });
  check('end time without a start → 400', endOnly.status === 400, `got ${endOnly.status}`);

  // These two checks previously asserted the opposite: that a 06:00-08:00
  // event stayed live all day, because the past rule was day-based. Adding
  // start and end times replaced that with a time-based rule — an event that
  // finished at breakfast should not still be advertised at lunchtime — so
  // the assertions now follow the end time. Changed deliberately, not relaxed.
  const earlyToday = await call('/opportunities', {
    method: 'POST', token: orgToken,
    body: mkWhen({ title: 'Dawn shift', startTime: '06:00', endTime: '08:00' }),
  });
  const earlyId = earlyToday.body.opportunity._id;
  const liveList = await call('/opportunities');
  check(
    'an event that finished at 08:00 today is no longer listed',
    !liveList.body.opportunities.some((o) => o._id === earlyId),
    'the past rule is time-based: it should drop out once endTime passes'
  );
  const laterToday = await call('/opportunities', {
    method: 'POST', token: orgToken,
    body: mkWhen({ title: 'Evening shift', startTime: '23:00', endTime: '23:59' }),
  });
  const laterId = laterToday.body.opportunity._id;
  const laterList = await call('/opportunities');
  check(
    'an event still to come later today is listed',
    laterList.body.opportunities.some((o) => o._id === laterId),
    'an event whose end time has not passed must stay live'
  );
  const joinLater = await call(`/opportunities/${laterId}/join`, { method: 'POST', token: vol3.body.token });
  check('…and is joinable → 201', joinLater.status === 201, `got ${joinLater.status}`);
  const joinEarly = await call(`/opportunities/${earlyId}/join`, { method: 'POST', token: vol2.body.token });
  check('the finished dawn shift is no longer joinable → 409', joinEarly.status === 409, `got ${joinEarly.status}`);

  const timedDetail = await call(`/opportunities/${timedId}`);
  check('detail returns venue and times', timedDetail.body.opportunity.venue === 'Gate 3, Riverside Park'
    && timedDetail.body.opportunity.startTime === '09:00');

  const attendanceWhen = await call(`/opportunities/${timedId}/attendance`, { token: orgToken });
  check('attendance payload carries the times for the manage screen',
    attendanceWhen.body?.opportunity?.startTime === '09:00');

  console.log('\n▶ AI description falls back safely with no key');
  check('suite runs with no Gemini key', !process.env.GEMINI_API_KEY);
  const aiWhen = await call('/ai/generate-description', {
    method: 'POST', token: orgToken,
    body: { title: 'Dawn shift', category: 'Community', location: 'Kolkata',
            venue: 'Gate 3', startTime: '06:00', endTime: '08:00' },
  });
  check('generate still returns a description → 200', aiWhen.status === 200, `got ${aiWhen.status}`);
  check('it is the offline template', aiWhen.body.source === 'mock');
  check('the note explains why', /GEMINI_API_KEY/.test(aiWhen.body.note || ''));
  check('no key is ever echoed back', !JSON.stringify(aiWhen.body).includes('AIza'));

  console.log('\n▶ Past events are hidden from discovery');
  const yesterday = new Date(Date.now() - 864e5);
  const pastEvt = await call('/opportunities', {
    method: 'POST', token: orgToken,
    body: {
      title: 'Last week litter pick', description: 'x'.repeat(60), category: 'Environment',
      location: 'Howrah', date: yesterday.toISOString(), requiredVolunteers: 4, gig: { mode: 'none' },
    },
  });
  check('an organization can still post a past-dated event → 201', pastEvt.status === 201, `got ${pastEvt.status}`);
  const pastId = pastEvt.body.opportunity._id;

  const defaultList = await call('/opportunities');
  const defaultIds = defaultList.body.opportunities.map((o) => o._id);
  check('default list hides a past event', !defaultIds.includes(pastId));
  check('default list hides a completed event', !defaultIds.includes(evtId));

  check(
    'a future-dated event is still listed',
    defaultIds.includes(futureId),
    'the upcoming filter is excluding future events'
  );

  // The boundary that matters: an event dated TODAY must still be listed.
  const todayEvt = await call('/opportunities', {
    method: 'POST', token: orgToken,
    body: {
      title: 'Today at the shelter', description: 'x'.repeat(60), category: 'Animals',
      location: 'Kolkata', date: new Date().toISOString(), requiredVolunteers: 4, gig: { mode: 'none' },
    },
  });
  const todayId = todayEvt.body.opportunity._id;
  const listWithToday = await call('/opportunities');
  check(
    "an event dated today is NOT treated as past",
    listWithToday.body.opportunities.some((o) => o._id === todayId),
    'today’s event vanished from the board'
  );

  const pastOnly = await call('/opportunities?when=past');
  const pastIds = pastOnly.body.opportunities.map((o) => o._id);
  check('?when=past returns the past event', pastIds.includes(pastId));
  check('?when=past excludes upcoming events', !pastIds.includes(todayId));

  const allList = await call('/opportunities?when=all');
  const allIds = allList.body.opportunities.map((o) => o._id);
  check('?when=all returns both', allIds.includes(pastId) && allIds.includes(todayId));

  const mineList = await call('/opportunities?mine=true', { token: orgToken });
  const mineIds = mineList.body.opportunities.map((o) => o._id);
  check('mine=true still shows an org its past events', mineIds.includes(pastId));
  check('mine=true still shows an org its completed events', mineIds.includes(evtId));

  console.log('\n▶ Joining a finished event');
  const joinPast = await call(`/opportunities/${pastId}/join`, { method: 'POST', token: volToken });
  check('joining a past event → 409', joinPast.status === 409, `got ${joinPast.status}`);

  const joinCompleted = await call(`/opportunities/${evtId}/join`, { method: 'POST', token: vol3.body.token });
  check('joining a completed event → 409', joinCompleted.status === 409, `got ${joinCompleted.status}`);

  const joinToday = await call(`/opportunities/${todayId}/join`, { method: 'POST', token: volToken });
  check("an event dated today is still joinable → 201", joinToday.status === 201, `got ${joinToday.status}`);

  console.log('\n▶ Volunteer dashboard splits upcoming from previous');
  const split = await call('/users/dashboard', { token: volToken });
  const upcomingIds = split.body.opportunities.map((o) => o._id);
  const previousIds = (split.body.previous || []).map((o) => o._id);
  check('today’s event is in `opportunities`', upcomingIds.includes(todayId));
  check('a completed event moves to `previous`', previousIds.includes(evtId));
  check('`opportunities` no longer contains finished events', !upcomingIds.includes(evtId));
  check('stats.completed counts the previous list', split.body.stats.completed === previousIds.length,
    `got ${split.body.stats.completed} vs ${previousIds.length}`);
  check('stats.upcoming counts the upcoming list', split.body.stats.upcoming === upcomingIds.length);
  check('totalJoined still counts everything',
    split.body.stats.totalJoined === upcomingIds.length + previousIds.length);

  const attendedEntry = (split.body.previous || []).find((o) => o._id === evtId);
  check('a previous entry records attendance', attendedEntry?.attended === true);
  check('a previous entry carries its certificate code', (attendedEntry?.certificateCode || '').length === 10,
    `got ${attendedEntry?.certificateCode}`);
  check('a previous entry carries its certificate id', !!attendedEntry?.certificateId);
  check('a previous entry carries the gig and its status', attendedEntry?.gig?.amount === 500 && !!attendedEntry?.gig?.status);

  // An absentee: join while the event is still open, then let it slip into the
  // past (the only way a registration on a past event can legitimately exist).
  const slipEvt = await call('/opportunities', {
    method: 'POST', token: orgToken,
    body: {
      title: 'Shift that came and went', description: 'x'.repeat(60), category: 'Community',
      location: 'Kolkata', date: new Date().toISOString(), requiredVolunteers: 4, gig: { mode: 'none' },
    },
  });
  const slipId = slipEvt.body.opportunity._id;
  const slipJoin = await call(`/opportunities/${slipId}/join`, { method: 'POST', token: vol3.body.token });
  check('a volunteer can join it while it is still today → 201', slipJoin.status === 201, `got ${slipJoin.status}`);

  const slipBack = await call(`/opportunities/${slipId}`, {
    method: 'PUT', token: orgToken,
    body: {
      title: 'Shift that came and went', description: 'x'.repeat(60), category: 'Community',
      location: 'Kolkata', date: new Date(Date.now() - 2 * 864e5).toISOString(),
      requiredVolunteers: 4, gig: { mode: 'none' },
    },
  });
  check('the organizer can move it into the past → 200', slipBack.status === 200, `got ${slipBack.status}`);

  const absenteeDash = await call('/users/dashboard', { token: vol3.body.token });
  const absenteeIds = absenteeDash.body.opportunities.map((o) => o._id);
  check('a now-past event leaves the volunteer\u2019s upcoming list', !absenteeIds.includes(slipId));
  const absenteeEntry = (absenteeDash.body.previous || []).find((o) => o._id === slipId);
  check('an absentee’s previous entry says attended:false', absenteeEntry?.attended === false);
  check('an absentee’s previous entry has no certificate', absenteeEntry?.certificateCode === null);

  const orgDash2 = await call('/users/dashboard', { token: orgToken });
  check('the organization dashboard still lists its past events',
    orgDash2.body.opportunities.some((o) => o._id === pastId));

  console.log('\n▶ Ownership & deletion');
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
  check(
    'cascade removed the volunteer registration',
    !afterDelete.body.opportunities.some((o) => o._id === oppId),
    'the deleted opportunity still shows on the dashboard'
  );

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
