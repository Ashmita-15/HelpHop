# VolunteerConnect

A volunteer opportunity board where local organizations post volunteer gigs and
volunteers discover and sign up for them.

**Stack:** React + Vite + Tailwind CSS · Node.js + Express · MongoDB (Mongoose) · JWT auth · Gemini API (with an offline fallback)

---

## Quick start

You need **Node.js 18+** (built and tested on Node 22) and **npm**.

MongoDB is required. If you don't have it installed, the project ships a
throwaway in-memory MongoDB — see [Option B](#option-b-no-mongodb-installed).

```bash
# 1. Backend dependencies
npm install --prefix server

# 2. Frontend dependencies
npm install --prefix client

# 3. Environment files
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Now open `server/.env` and set a `JWT_SECRET` (any long random string). The
defaults for everything else work out of the box.

### Option A — you have MongoDB running locally

The default `MONGO_URI` (`mongodb://127.0.0.1:27017/volunteerconnect`) already
points at a local MongoDB. Then, in **three terminals**:

```bash
npm run seed --prefix server
```

```bash
npm run dev --prefix server
```

```bash
npm run dev --prefix client
```

### Option B — no MongoDB installed

Start the bundled in-memory MongoDB in its own terminal and leave it running.
Data is discarded when you stop it.

```bash
npm run db:memory --prefix server
```

Then seed and start the two servers as in Option A.

### Open the app

| What | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:5000/api |
| Health check | http://localhost:5000/api/health |

Vite proxies `/api` to `http://localhost:5000`, so no CORS setup is needed in
development. If port 5173 is taken, Vite picks the next free port and prints it.

### Seeded demo accounts

Password for every seeded account: **`password123`**

| Role | Email |
| --- | --- |
| Organization | `green@volunteerconnect.dev` (Green Earth Collective) |
| Organization | `foodbank@volunteerconnect.dev` (City Food Bank) |
| Organization | `paws@volunteerconnect.dev` (Paws & Claws Shelter) |
| Volunteer | `asha@volunteerconnect.dev` |
| Volunteer | `liam@volunteerconnect.dev` |
| Volunteer | `maria@volunteerconnect.dev` |

The seed creates 8 opportunities across 8 categories and 6 sample registrations,
so both dashboards have content on first run.

---

## Environment variables

### `server/.env`

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | no | `5000` | Port the API listens on |
| `HOST` | no | _(127.0.0.1 and ::1)_ | Bind a single address instead of both loopback addresses |
| `MONGO_URI` | **yes** | `mongodb://127.0.0.1:27017/volunteerconnect` | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | **yes** | — | Secret used to sign JWTs. The server refuses to start without it |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime |
| `CLIENT_ORIGIN` | no | `http://localhost:5173` | Allowed CORS origin(s), comma-separated |
| `GEMINI_API_KEY` | no | _(empty)_ | Gemini key for AI descriptions. **Leave empty and the app still works** — it falls back to a built-in template |
| `GEMINI_MODEL` | no | `gemini-2.0-flash` | Gemini model id |

### `client/.env`

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_API_URL` | no | `/api` | API base URL. Keep the default locally (Vite proxies it); set a full URL when deploying the frontend separately |

Get a Gemini key at <https://aistudio.google.com/app/apikey>.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev --prefix server` | Start the API with file watching |
| `npm start --prefix server` | Start the API |
| `npm run seed --prefix server` | **Wipe** and reseed the database with sample data |
| `npm run smoke --prefix server` | Run the API test suite (51 checks, in-memory DB, no setup needed) |
| `npm run db:memory --prefix server` | Start a throwaway in-memory MongoDB on port 27017 |
| `npm run dev --prefix client` | Start the Vite dev server |
| `npm run build --prefix client` | Production build into `client/dist` |
| `npm run preview --prefix client` | Serve the production build |

---

## Folder structure

```
project/
├── README.md
├── .gitignore
│
├── server/                          # Express + MongoDB API
│   ├── package.json
│   ├── .env.example
│   ├── scripts/
│   │   ├── smoke-test.js            # End-to-end API tests (in-memory Mongo)
│   │   └── dev-db.js                # Throwaway in-memory MongoDB
│   └── src/
│       ├── index.js                 # Entry point: connect DB, start server
│       ├── app.js                   # Express app + route mounting
│       ├── seed.js                  # Sample data
│       ├── config/
│       │   └── db.js                # Mongoose connection
│       ├── models/
│       │   ├── User.js              # name, email, passwordHash, role, createdAt
│       │   ├── Opportunity.js       # + category enum, text index
│       │   └── Registration.js      # unique (volunteerId, opportunityId)
│       ├── middleware/
│       │   ├── auth.js              # signToken, requireAuth, requireRole, optionalAuth
│       │   └── error.js             # asyncHandler, httpError, 404 + error handler
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── opportunityController.js
│       │   └── userController.js
│       ├── routes/
│       │   ├── auth.js
│       │   ├── opportunities.js
│       │   ├── users.js
│       │   └── ai.js
│       └── utils/
│           └── ai.js                # Gemini call + template fallback
│
└── client/                          # React + Vite + Tailwind
    ├── package.json
    ├── .env.example
    ├── index.html
    ├── vite.config.js               # Dev proxy /api → :5000
    ├── tailwind.config.js           # Green/blue "brand"/"ocean" palette
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx                  # Routes
        ├── index.css                # Tailwind + .btn/.input/.card components
        ├── api/
        │   └── client.js            # fetch wrapper, token storage, ApiError
        ├── context/
        │   └── AuthContext.jsx      # Session state, login/register/logout
        ├── components/
        │   ├── Navbar.jsx           # Role-aware, responsive
        │   ├── ProtectedRoute.jsx   # Auth + role guard
        │   ├── OpportunityCard.jsx
        │   ├── OpportunityForm.jsx  # Shared create/edit + ✨ Generate
        │   ├── SearchFilters.jsx
        │   └── ui.jsx               # Spinner, Loading, Alert, EmptyState, Badge, StatCard, Modal
        └── pages/
            ├── Browse.jsx
            ├── Login.jsx
            ├── Register.jsx
            ├── OpportunityDetail.jsx
            ├── Dashboard.jsx        # Dispatches by role
            ├── VolunteerDashboard.jsx
            ├── OrganizationDashboard.jsx
            ├── CreateOpportunity.jsx
            ├── EditOpportunity.jsx
            └── NotFound.jsx
```

---

## API reference

Authenticated routes expect `Authorization: Bearer <token>`.

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create account (`role`: `volunteer` \| `organization`); returns token + user |
| `POST` | `/api/auth/login` | Public | Returns token + user |
| `GET` | `/api/auth/me` | Any user | Current user (used to restore sessions) |
| `GET` | `/api/opportunities` | Public | List. Query: `search`, `category`, `location`, `mine` |
| `GET` | `/api/opportunities/categories` | Public | Allowed category values |
| `GET` | `/api/opportunities/:id` | Public | Single opportunity |
| `POST` | `/api/opportunities` | Organization | Create |
| `PUT` | `/api/opportunities/:id` | Owner org | Update |
| `DELETE` | `/api/opportunities/:id` | Owner org | Delete (cascades registrations) |
| `POST` | `/api/opportunities/:id/join` | Volunteer | Sign up; 409 on duplicate or when full |
| `GET` | `/api/opportunities/:id/volunteers` | Owner org | Registered volunteers |
| `GET` | `/api/users/dashboard` | Any user | Role-aware dashboard payload |
| `POST` | `/api/ai/generate-description` | Organization | Generate a description from title/category/location |
| `GET` | `/api/health` | Public | Status + which AI mode is active |

List and detail responses decorate each opportunity with `registeredCount`,
`spotsLeft`, and (for a logged-in volunteer) `joined`.

---

## Features

**Authentication**
- Register as a volunteer or organization; role is picked with a card selector.
- Passwords hashed with bcrypt; the hash is never returned by any endpoint.
- JWT stored in `localStorage`; sessions are restored on refresh via `/auth/me`.
- Protected routes redirect anonymous users to login (remembering where they
  came from) and send wrong-role users to their own dashboard.
- Login errors are deliberately identical for unknown email and wrong password.

**Volunteer**
- Browse all opportunities, with a debounced keyword search over title and
  description plus category and location filters.
- Cards show title, organization, location, date, category and volunteer counts,
  with a fill-progress bar and a "Joined" / "Full" badge.
- Full detail page with a one-click **Join Opportunity**.
- Duplicate sign-ups blocked in the UI, at the API, and by a unique index in
  MongoDB (so concurrent requests can't slip through).
- Opportunities that are already full cannot be joined.
- Dashboard of joined opportunities with joined/upcoming stats.

**Organization**
- Dashboard with posted/volunteers/open-spots stats.
- Create, edit and delete opportunities; deleting cascades its registrations.
- View the volunteers registered for each opportunity (name, email, sign-up
  time) in a modal.
- Ownership is enforced server-side — one organization cannot touch another's
  opportunities.

**GenAI**
- **Generate Description ✨** in the create/edit form takes title, category and
  location and writes a description. The button stays disabled until those three
  fields are filled.
- Uses Gemini when `GEMINI_API_KEY` is set. With no key — or if the API call
  fails or times out — it falls back to a category-aware template and tells you
  which path produced the text. **The feature never breaks the app.**

**UI**
- Green/blue community palette, responsive from mobile to desktop.
- Loading, empty, success and error states throughout.
- Reusable `Spinner`, `Loading`, `Alert`, `EmptyState`, `Badge`, `StatCard`,
  `Modal`, `OpportunityCard`, `OpportunityForm`, `SearchFilters` components.
- Role-aware navbar with a mobile menu.

---

## Testing

```bash
npm run smoke --prefix server
```

Boots the real Express app against an in-memory MongoDB and runs 51 checks
covering auth, validation, role permissions, ownership, search/filters,
duplicate and over-capacity joins, cascade deletes and error handling. No
running database or API key required.

```bash
npm run build --prefix client
```

Verifies the frontend compiles for production.

---

## Troubleshooting

**`The 'text-ink-700' class does not exist`** (or any other custom colour) in the Vite
overlay — the dev server is holding a cached copy of `tailwind.config.js`. Tailwind
config changes are not hot-reloaded. Stop the client dev server and start it again:

```bash
npm run dev --prefix client
```

**Port 5173 already in use** — Vite falls back to the next free port and prints it.
If another project is already bound to `*:5173`, this one may bind `[::1]:5173`
instead, and both will answer on `localhost`. Set an explicit port to avoid the
clash:

```bash
PORT=5180 npm run dev --prefix client
```

**`EADDRINUSE` on port 5000 (macOS)** — macOS's AirPlay Receiver (process
`ControlCenter`, `Server: AirTunes`) listens on `*:5000`. The API therefore binds
`127.0.0.1:5000` and `[::1]:5000` rather than all interfaces; those more specific
addresses are free and win for local traffic, so `http://localhost:5000` reaches
the API without touching Control Center. If you still see `EADDRINUSE`, a
suspended dev server (from `Ctrl+Z`) is the usual culprit:

```bash
lsof -nP -iTCP:5000 -sTCP:LISTEN
```

Resume it with `fg` and stop it with `Ctrl+C`, or run `kill %1` from the same terminal.

---

## Notes and limitations

- The seed script **deletes all existing users, opportunities and
  registrations** before inserting sample data. Don't run it against data you
  care about.
- Volunteers cannot currently un-join an opportunity.
- `npm run db:memory` is a development convenience only — use a real MongoDB for
  anything you want to persist.
- The Gemini integration has been exercised against the live endpoint; a valid
  key is needed to see real model output rather than the fallback.
