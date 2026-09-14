import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import OpportunityCard from '../components/OpportunityCard.jsx';
import { CardSkeleton, Icon, ProgressBar, formatDateShort } from '../components/ui.jsx';

const VOLUNTEER_STEPS = [
  {
    icon: 'search',
    title: 'Search what’s near you',
    body: 'Filter by cause, town or keyword. Every listing shows the date and how many spots are still open before you click.',
  },
  {
    icon: 'compass',
    title: 'Read the actual details',
    body: 'What you’ll be doing, what to bring, who’s running it. No vague “get involved” pages.',
  },
  {
    icon: 'check',
    title: 'Claim your spot',
    body: 'One click. It lands on your dashboard and the organizer gets your name straight away.',
  },
];

const ORG_STEPS = [
  {
    icon: 'edit',
    title: 'Describe the shift',
    body: 'Title, date, location and how many people you need. Stuck on the wording? Generate a first draft and edit it.',
  },
  {
    icon: 'arrowRight',
    title: 'Publish it',
    body: 'It’s on the board the moment you save — no review queue, no approval wait.',
  },
  {
    icon: 'users',
    title: 'See who’s coming',
    body: 'Names, emails and sign-up times for every shift, so you can plan around real numbers.',
  },
];

const BENEFITS = [
  {
    icon: 'clock',
    title: 'Nothing hidden behind a form',
    body: 'Date, location and remaining spots are on the card. You decide before you hand over an email address.',
  },
  {
    icon: 'shield',
    title: 'No double bookings',
    body: 'Duplicate sign-ups are blocked, and a shift stops accepting volunteers once it’s full.',
  },
  {
    icon: 'heart',
    title: 'Built for small teams',
    body: 'Most groups here run on a handful of volunteers and a shared spreadsheet. This replaces the spreadsheet.',
  },
];

export default function Landing() {
  const { user, isOrganization } = useAuth();
  const [opportunities, setOpportunities] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listOpportunities()
      .then(({ opportunities: list }) => !cancelled && setOpportunities(list))
      .catch(() => !cancelled && setOpportunities([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = opportunities === null;
  const featured = (opportunities || []).slice(0, 3);

  // Headline figures, derived from the same data the board shows.
  const stats = {
    open: (opportunities || []).length,
    orgs: new Set((opportunities || []).map((o) => o.organizationId?._id).filter(Boolean)).size,
    spots: (opportunities || []).reduce(
      (sum, o) => sum + Math.max(0, o.requiredVolunteers - (o.registeredCount || 0)),
      0
    ),
  };

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden bg-hero-glow">
        <div className="shell relative pb-16 pt-14 sm:pb-20 sm:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
                </span>
                {loading ? 'Loading the board…' : `${stats.spots} spots open right now`}
              </span>

              <h1 className="h-display mt-5">
                Find volunteer work that
                <span className="text-brand-600"> fits your week.</span>
              </h1>

              <p className="lede mt-5 max-w-xl">
                VolunteerConnect lists real shifts from local organizations — with the date, the
                place and exactly how many people they still need. Pick one, turn up, help out.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/opportunities" className="btn-primary btn-lg">
                  Find an opportunity
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
                <Link
                  to={isOrganization ? '/opportunities/new' : '/register'}
                  className="btn-outline btn-lg"
                >
                  <Icon name="building" className="h-4 w-4" />
                  Post an opportunity
                </Link>
              </div>

              <p className="mt-4 text-xs text-ink-400">
                {user ? (
                  <>
                    Signed in as <span className="font-medium text-ink-600">{user.name}</span>.
                  </>
                ) : (
                  'Free for volunteers and organizations. No approval queue.'
                )}
              </p>
            </div>

            {/* Preview card — a real listing when we have one. */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-6 rounded-3xl bg-brand-gradient opacity-[0.07] blur-2xl" />
              <HeroPreview opportunity={featured[0]} loading={loading} />
            </div>
          </div>

          <dl className="mt-16 grid grid-cols-3 gap-4 border-t border-ink-200/70 pt-8">
            {[
              { label: 'Opportunities live', value: stats.open },
              { label: 'Organizations posting', value: stats.orgs },
              { label: 'Volunteer spots open', value: stats.spots },
            ].map((s) => (
              <div key={s.label}>
                <dt className="text-xs font-medium text-ink-400 sm:text-sm">{s.label}</dt>
                <dd className="mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                  {loading ? '—' : s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------- how it works */}
      <section id="how-it-works" className="section scroll-mt-20 border-t border-ink-200/70 bg-ink-50/50">
        <div className="shell">
          <div className="max-w-2xl">
            <p className="eyebrow">How it works</p>
            <h2 className="h-section mt-2">Two sides, both straightforward</h2>
            <p className="lede mt-3">
              No onboarding calls, no membership tiers. Volunteers browse and claim; organizations
              post and track.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <StepColumn
              tag="For volunteers"
              tone="brand"
              steps={VOLUNTEER_STEPS}
              cta={
                <Link to="/opportunities" className="btn-primary">
                  Browse the board
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
              }
            />
            <StepColumn
              tag="For organizations"
              tone="ocean"
              steps={ORG_STEPS}
              cta={
                <Link
                  to={isOrganization ? '/opportunities/new' : '/register'}
                  className="btn-secondary"
                >
                  {isOrganization ? 'Post an opportunity' : 'Create an organization account'}
                </Link>
              }
            />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- featured */}
      <section className="section">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="eyebrow">Open now</p>
              <h2 className="h-section mt-2">Shifts that still need people</h2>
              <p className="lede mt-3">
                Pulled straight from the board, soonest first.
              </p>
            </div>
            <Link to="/opportunities" className="btn-outline">
              See all opportunities
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              [0, 1, 2].map((i) => <CardSkeleton key={i} />)
            ) : featured.length === 0 ? (
              <div className="card col-span-full px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon name="compass" className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-ink-900">
                  The board is empty right now
                </h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-ink-500">
                  Nothing has been posted yet. If you run a local group, yours would be the first.
                </p>
                <Link to="/register" className="btn-primary mt-5">
                  Post the first opportunity
                </Link>
              </div>
            ) : (
              featured.map((o) => <OpportunityCard key={o._id} opportunity={o} />)
            )}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- impact */}
      <section id="impact" className="section scroll-mt-20 border-t border-ink-200/70 bg-ink-50/50">
        <div className="shell">
          <div className="max-w-2xl">
            <p className="eyebrow">Why it works</p>
            <h2 className="h-section mt-2">Built around the boring problems</h2>
            <p className="lede mt-3">
              Most volunteering falls apart on logistics, not goodwill. These are the parts we
              actually fixed.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="card p-6 transition-shadow duration-300 hover:shadow-card">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon name={b.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink-900">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- CTA */}
      <section className="section pt-0">
        <div className="shell">
          <div className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-14 text-center sm:px-12">
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Somebody nearby needs a hand this week
              </h2>
              <p className="mt-3 text-base leading-relaxed text-white/85">
                It takes about a minute to make an account, and the board is open to everyone.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/opportunities"
                  className="btn btn-lg bg-white text-brand-700 shadow-soft hover:-translate-y-px hover:bg-brand-50"
                >
                  Find an opportunity
                </Link>
                {!user && (
                  <Link
                    to="/register"
                    className="btn btn-lg border border-white/40 text-white hover:bg-white/10"
                  >
                    Create an account
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** One of the two "How it works" columns. */
function StepColumn({ tag, tone, steps, cta }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700 ring-brand-200/70',
    ocean: 'bg-ocean-50 text-ocean-700 ring-ocean-200/70',
  };

  return (
    <div className="card flex flex-col p-6 sm:p-8">
      <span
        className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}
      >
        {tag}
      </span>

      <ol className="mt-6 flex-1 space-y-6">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-white text-sm font-semibold text-ink-500">
              {i + 1}
            </span>
            <div>
              <h3 className="text-base font-semibold text-ink-900">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8">{cta}</div>
    </div>
  );
}

/** Decorative-but-real preview beside the hero copy. */
function HeroPreview({ opportunity, loading }) {
  if (loading) {
    return (
      <div className="card relative animate-pulse p-6">
        <div className="h-5 w-28 rounded-full bg-ink-100" />
        <div className="mt-4 h-6 w-4/5 rounded bg-ink-100" />
        <div className="mt-2 h-4 w-1/2 rounded bg-ink-100" />
        <div className="mt-6 space-y-3">
          <div className="h-3 w-2/3 rounded bg-ink-100" />
          <div className="h-3 w-1/2 rounded bg-ink-100" />
        </div>
        <div className="mt-6 h-1.5 w-full rounded-full bg-ink-100" />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="card relative p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon name="compass" className="h-6 w-6" />
        </div>
        <p className="mt-4 font-semibold text-ink-900">Nothing posted yet</p>
        <p className="mt-1 text-sm text-ink-500">
          New opportunities show up here the moment they go live.
        </p>
      </div>
    );
  }

  const { title, category, location, date, requiredVolunteers, registeredCount = 0, organizationId } =
    opportunity;
  const spotsLeft = Math.max(0, requiredVolunteers - registeredCount);

  return (
    <div className="card relative p-6 shadow-lift">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200/70">
          {category}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-ink-400">
          <Icon name="calendar" className="h-3.5 w-3.5" />
          {formatDateShort(date)}
        </span>
      </div>

      <h3 className="mt-4 text-xl font-semibold tracking-tight text-ink-900">{title}</h3>
      <p className="mt-1 text-sm font-medium text-ink-500">
        {organizationId?.name || 'A local organization'}
      </p>

      <div className="mt-5 flex items-center gap-2 text-sm text-ink-600">
        <Icon name="pin" className="h-4 w-4 text-ink-400" />
        {location}
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs font-medium">
          <span className="text-ink-500">
            {registeredCount} of {requiredVolunteers} signed up
          </span>
          <span className="text-brand-700">{spotsLeft} left</span>
        </div>
        <ProgressBar value={registeredCount} max={requiredVolunteers} className="h-2" />
      </div>

      <Link
        to={`/opportunities/${opportunity._id}`}
        className="btn-primary mt-6 w-full"
      >
        View details
        <Icon name="arrowRight" className="h-4 w-4" />
      </Link>
    </div>
  );
}
