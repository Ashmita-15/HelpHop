import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import OpportunityCard from '../components/OpportunityCard.jsx';
import { Sprig, Underline, Wave } from '../components/Ornament.jsx';
import {
  Avatar,
  CardSkeleton,
  Figure,
  Icon,
  Photo,
  SectionHeading,
} from '../components/ui.jsx';
import { CAUSES, PHOTOS, PORTRAITS } from '../lib/imagery.js';

const STEPS = [
  {
    title: 'Look around',
    body: 'Browse what is happening nearby. Every listing says where it is, when it starts and how many people are still needed — before you give anyone your name.',
  },
  {
    title: 'Put your hand up',
    body: 'One click and the place is yours. The organiser sees your name straight away, and the date lands on your shelf so you don’t forget it.',
  },
  {
    title: 'Turn up',
    body: 'Check in when you arrive. Afterwards you keep a record of the hours you gave, and a certificate anyone can verify.',
  },
];

const STORIES = [
  {
    quote:
      'I moved here knowing nobody. Three Saturdays in the garden and now I can’t walk down the road without stopping to talk to someone.',
    name: 'Mira',
    role: 'Volunteers at Fairfield Allotments',
    portrait: PORTRAITS.mira,
  },
  {
    quote:
      'We used to chase people on a group chat and hope enough turned up. Now I post the shift and watch the places fill. It gave me my Sundays back.',
    name: 'Daniel',
    role: 'Runs a weekend food pantry',
    portrait: PORTRAITS.daniel,
  },
  {
    quote:
      'Two hours of reading with the same child every week. It is the smallest thing in my calendar and the one I would never give up.',
    name: 'Anya',
    role: 'Reading partner, Eastside Library',
    portrait: PORTRAITS.anya,
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
  const list = opportunities || [];
  const featured = list.slice(0, 3);

  // Figures taken from the same board the listings come from — never invented.
  const stats = useMemo(
    () => ({
      open: list.length,
      orgs: new Set(list.map((o) => o.organizationId?._id).filter(Boolean)).size,
      places: list.reduce(
        (sum, o) => sum + Math.max(0, o.requiredVolunteers - (o.registeredCount || 0)),
        0
      ),
    }),
    [list]
  );

  // The organisations currently posting, most active first.
  const organisations = useMemo(() => {
    const byId = new Map();
    list.forEach((o) => {
      const org = o.organizationId;
      if (!org?._id) return;
      const entry = byId.get(org._id) || { id: org._id, name: org.name, count: 0, causes: new Set() };
      entry.count += 1;
      entry.causes.add(o.category);
      byId.set(org._id, entry);
    });
    return [...byId.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  }, [list]);

  return (
    <>
      {/* ============================================================ hero */}
      <section className="relative overflow-hidden">
        <div className="shell relative grid items-center gap-12 pb-20 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:pb-28">
          <div className="animate-rise">
            <p className="eyebrow flex items-center gap-2">
              <Sprig className="h-4 w-4 text-sage-500" />
              Neighbourhood volunteering
            </p>

            <h1 className="h-display mt-6">
              A little help can
              <br className="hidden sm:block" /> go a{' '}
              <span className="relative inline-block">
                long way.
                <Underline
                  className="absolute -bottom-1 left-0 h-3 w-full text-sage-400"
                  animate
                />
              </span>
            </h1>

            <p className="lede mt-8">
              Good things happen when people show up for each other. Find a cause close to your
              heart and be part of something meaningful.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/opportunities" className="btn-primary btn-lg">
                Find your volunteering opportunity
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
              <Link
                to={isOrganization ? '/opportunities/new' : '/register'}
                className="btn-outline btn-lg"
              >
                Organisations, join us
              </Link>
            </div>

            <p className="mt-6 text-sm text-bark-400">
              {user ? (
                <>
                  Welcome back, <span className="text-bark-600">{user.name.split(' ')[0]}</span>.
                </>
              ) : loading ? (
                'Free for volunteers and for the groups who need them.'
              ) : stats.places > 0 ? (
                <>
                  <span className="text-bark-600">{stats.places} places</span> are open across{' '}
                  {stats.orgs} {stats.orgs === 1 ? 'organisation' : 'organisations'} today.
                </>
              ) : (
                'Free for volunteers and for the groups who need them.'
              )}
            </p>
          </div>

          {/* Editorial photograph, offset so the column edges don't line up */}
          <div className="relative lg:pt-10">
            <div className="photo-frame aspect-[4/5] sm:aspect-[3/2] lg:aspect-[4/5]">
              <Photo
                id={PHOTOS.heroGarden}
                alt="A teenager and an older neighbour planting together in a raised garden bed"
                width={760}
                ratio={4 / 5}
                eager
              />
            </div>
            <p className="mt-4 max-w-xs font-serif text-sm italic leading-relaxed text-bark-500">
              Thursday mornings at the allotment, where two generations have been growing
              vegetables for the street kitchen since spring.
            </p>
          </div>
        </div>

        {/* Figures, set as a ruled strip rather than as metric tiles */}
        <div className="shell">
          <dl className="grid grid-cols-3 gap-6 border-t border-bark-200/70 py-8 sm:gap-12">
            {[
              { label: 'Opportunities open', value: stats.open },
              { label: 'Organisations posting', value: stats.orgs },
              { label: 'Places still to fill', value: stats.places },
            ].map((s) => (
              <div key={s.label}>
                <dd className="font-serif text-3xl text-bark-700 sm:text-4xl">
                  {loading ? '—' : s.value}
                </dd>
                <dt className="mt-1.5 text-xs leading-snug text-bark-500 sm:text-sm">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ============================================ discover opportunities */}
      <section className="section bg-paper">
        <div className="shell">
          <SectionHeading
            eyebrow="Open now"
            title="Discover opportunities around you"
            description="Pulled from the board as organisations post them, soonest first."
            action={
              <Link to="/opportunities" className="btn-outline">
                See everything
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
            }
          />

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              [0, 1, 2].map((i) => <CardSkeleton key={i} />)
            ) : featured.length === 0 ? (
              <div className="panel col-span-full flex flex-col items-center gap-4 px-6 py-16 text-center">
                <Sprig className="h-8 w-8 text-sage-400" />
                <h3 className="font-serif text-xl text-bark-700">The board is quiet today</h3>
                <p className="max-w-md text-sm leading-[1.75] text-bark-500">
                  Nothing has been posted yet. If you run a local group, yours would be the first
                  thing people see here.
                </p>
                <Link to="/register" className="btn-primary mt-1">
                  Post the first opportunity
                </Link>
              </div>
            ) : (
              featured.map((o) => <OpportunityCard key={o._id} opportunity={o} />)
            )}
          </div>
        </div>
      </section>

      {/* ============================================== a place for everyone */}
      <section className="section">
        <div className="shell">
          <SectionHeading
            eyebrow="Causes"
            title="There’s a place for everyone"
            description="You don’t need a skill, a uniform or a free weekend every week. Most of what gets asked for here is simply someone turning up."
          />

          <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {CAUSES.map((cause) => (
              <Link
                key={cause.name}
                to={`/opportunities?cause=${encodeURIComponent(cause.name)}`}
                className="group"
              >
                <div className="photo-frame aspect-[4/3]">
                  <Photo
                    id={cause.photo}
                    alt={`${cause.name} volunteering`}
                    width={420}
                    ratio={4 / 3}
                    className="transition-transform duration-[900ms] ease-natural group-hover:scale-[1.04]"
                  />
                </div>
                <h3 className="mt-4 font-serif text-lg text-bark-700 transition-colors group-hover:text-sage-700">
                  {cause.name}
                </h3>
                <p className="mt-1.5 text-sm leading-[1.7] text-bark-500">{cause.blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================== how HelpHop works */}
      <section id="how-it-works" className="section scroll-mt-24 bg-oat-50">
        <div className="shell grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <Figure
              id={PHOTOS.organising}
              alt="A volunteer with a clipboard talking to the group before a park clean-up"
              ratio={4 / 5}
              width={620}
              caption="Every shift has someone holding the clipboard. HelpHop just makes sure enough people are standing in front of them."
            />
          </div>

          <div>
            <SectionHeading
              eyebrow="How it works"
              title="How HelpHop works"
              description="Two sides, both plain. Organisations post what they need; people nearby claim it."
            />

            <ol className="mt-10">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-6 border-t border-bark-200/70 py-7">
                  <span className="shrink-0 font-serif text-2xl italic text-sage-500">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-serif text-xl text-bark-700">{step.title}</h3>
                    <p className="mt-2 text-sm leading-[1.8] text-bark-500">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/opportunities" className="btn-primary">
                Find your volunteering opportunity
              </Link>
              <Link to="/about" className="btn-ghost">
                More about us
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== the stories */}
      <section className="section bg-paper">
        <div className="shell">
          <SectionHeading
            eyebrow="In their words"
            title="Stories from the community"
            align="center"
          />

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {STORIES.map((s) => (
              <figure key={s.name} className="flex flex-col">
                <Sprig className="h-5 w-5 text-oat-500" />
                <blockquote className="mt-4 flex-1 font-serif text-[1.15rem] leading-[1.65] text-bark-700">
                  “{s.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-bark-200/70 pt-5">
                  <Avatar name={s.name} photoId={s.portrait} className="h-11 w-11" />
                  <div>
                    <p className="text-sm text-bark-700">{s.name}</p>
                    <p className="text-xs text-bark-400">{s.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================== the organisations */}
      <section className="section">
        <div className="shell">
          <SectionHeading
            eyebrow="Who is posting"
            title="Organisations making a difference"
            description="Small groups, mostly. Allotments, pantries, shelters, libraries — the kind of places that run on a handful of regulars and whoever else turns up."
          />

          {loading ? (
            <div className="mt-12 grid gap-px overflow-hidden rounded-card border border-bark-200/70 bg-bark-200/70 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-28 animate-pulse bg-paper" />
              ))}
            </div>
          ) : organisations.length === 0 ? (
            <div className="mt-10 grid gap-10 sm:grid-cols-[1.1fr_1fr] sm:items-center">
              <p className="prose-warm">
                No organisations have posted yet. If you run one — a shelter, a pantry, a reading
                group, a tidy-up crew — this page is waiting for you, and it takes about a minute
                to put your first shift on the board.
              </p>
              <Figure
                id={PHOTOS.gardenBeds}
                alt="Volunteers working among raised beds in a community garden"
                ratio={3 / 2}
                width={560}
              />
            </div>
          ) : (
            <ul className="mt-12 grid gap-px overflow-hidden rounded-card border border-bark-200/70 bg-bark-200/70 sm:grid-cols-2 lg:grid-cols-3">
              {organisations.map((org) => (
                <li key={org.id} className="bg-paper p-6">
                  <div className="flex items-start gap-3">
                    <Avatar name={org.name} className="h-10 w-10" />
                    <div className="min-w-0">
                      <p className="truncate font-serif text-lg text-bark-700">{org.name}</p>
                      <p className="mt-1 text-xs text-bark-500">
                        {org.count} open {org.count === 1 ? 'opportunity' : 'opportunities'} ·{' '}
                        {[...org.causes].slice(0, 2).join(', ')}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ============================================== a gentle final word */}
      <section className="pb-24">
        <div className="shell">
          <div className="relative overflow-hidden rounded-card">
            <div className="absolute inset-0">
              <Photo
                id={PHOTOS.gathering}
                alt="Neighbours gathered together under strings of lights at an evening event"
                width={1400}
                ratio={21 / 9}
              />
              <div className="absolute inset-0 bg-bark-900/60" />
            </div>

            <div className="relative px-6 py-20 text-center sm:px-12 sm:py-24">
              <Wave className="mx-auto h-4 w-20 text-oat-300" />
              <h2 className="mx-auto mt-6 max-w-2xl font-serif text-[clamp(1.8rem,1.2rem+2vw,2.6rem)] leading-[1.2] text-paper">
                Somebody near you could use a hand this week.
              </h2>
              <p className="mx-auto mt-5 max-w-xl leading-[1.8] text-oat-100">
                It takes a minute to join, it costs nothing, and you can start with one morning.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/opportunities"
                  className="btn btn-lg bg-paper text-bark-800 hover:bg-oat-100"
                >
                  Find your volunteering opportunity
                </Link>
                {!user && (
                  <Link
                    to="/register"
                    className="btn btn-lg border border-oat-100/50 text-paper hover:bg-paper/10"
                  >
                    Organisations, join us
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
