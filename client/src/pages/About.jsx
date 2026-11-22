import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { Sprig, Underline, Wave } from '../components/Ornament.jsx';
import { Figure, Icon, Photo, SectionHeading } from '../components/ui.jsx';
import { PHOTOS } from '../lib/imagery.js';

const BELIEFS = [
  {
    title: 'Show the details first',
    body: 'Where it is, when it starts, how many people are still needed. Nobody should have to hand over an email address to find out whether they can make it.',
  },
  {
    title: 'Small groups deserve good tools',
    body: 'Most of the organisations here run on a handful of regulars and a shared spreadsheet. HelpHop replaces the spreadsheet, not the people.',
  },
  {
    title: 'An hour is worth posting',
    body: 'Not every contribution is a weekly commitment. One morning, once, still counts — and a lot of what gets asked for here is exactly that size.',
  },
  {
    title: 'Keep the record honest',
    body: 'Hours are logged when you check in, not when you intend to. Every certificate carries a code anyone can verify for themselves.',
  },
];

export default function About() {
  const { user, isOrganization } = useAuth();

  return (
    <>
      {/* ============================================================ opening */}
      <section className="shell pb-16 pt-12 sm:pt-16">
        <div className="max-w-3xl">
          <p className="eyebrow flex items-center gap-2">
            <Sprig className="h-4 w-4 text-sage-500" />
            About HelpHop
          </p>
          <h1 className="h-display mt-6">
            Built around the people
            <br className="hidden sm:block" /> who{' '}
            <span className="relative inline-block">
              turn up.
              <Underline className="absolute -bottom-1 left-0 h-3 w-full text-sage-400" animate />
            </span>
          </h1>
          <p className="lede mt-8">
            HelpHop began with a noticeboard in a community hall that nobody ever read. The shifts
            that needed filling were pinned to it, and the people who would gladly have filled them
            walked straight past on their way to the hall’s other door.
          </p>
        </div>
      </section>

      <section className="shell pb-20">
        <div className="photo-frame aspect-[16/9] sm:aspect-[21/9]">
          <Photo
            id={PHOTOS.cleanup}
            alt="A group of volunteers in matching shirts clearing litter from woodland on a bright morning"
            width={1400}
            ratio={21 / 9}
            eager
          />
        </div>
        <p className="mt-4 max-w-md font-serif text-sm italic leading-relaxed text-bark-500">
          Saturday morning in Whitley Woods — forty-one bags, eleven people, most of whom had never
          met before nine o’clock.
        </p>
      </section>

      {/* ============================================================= story */}
      <section className="section border-t border-bark-200/70 bg-paper">
        <div className="shell grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div>
            <SectionHeading eyebrow="Why we made it" title="Goodwill is rarely the problem" />
            <div className="prose-warm mt-8">
              <p>
                Almost nobody refuses to help. What stops people is not knowing what is needed,
                where, or whether they would be in the way. Meanwhile the groups who need hands
                spend their evenings chasing the same twelve regulars on a group chat.
              </p>
              <p>
                So HelpHop does one plain thing well. Organisations write down what they need —
                the date, the place, how many people, what the afternoon actually involves. It goes
                up immediately, with no approval queue and no membership tier. Anyone can read it,
                and anyone with an account can claim a place in a single click.
              </p>
              <p>
                There is no matching algorithm here and no feed deciding what you should care
                about. There is a board, and the things on it are real, and the people who posted
                them are waiting to see who comes.
              </p>
            </div>
          </div>

          <div className="space-y-10">
            <Figure
              id={PHOTOS.foodBags}
              alt="Two volunteers packing paper grocery bags under a canopy"
              ratio={4 / 5}
              width={560}
              caption="Packing day at a weekend pantry. Eighty bags, three hours, six pairs of hands."
            />
          </div>
        </div>
      </section>

      {/* ========================================================== beliefs */}
      <section id="beliefs" className="section scroll-mt-24 bg-oat-50">
        <div className="shell">
          <SectionHeading
            eyebrow="What we believe"
            title="Four things we won’t compromise on"
            description="They are small commitments, and they are the reason the product looks the way it does."
          />

          <div className="mt-12 grid gap-x-12 gap-y-2 sm:grid-cols-2">
            {BELIEFS.map((b, i) => (
              <div key={b.title} className="flex gap-6 border-t border-bark-200/70 py-8">
                <span className="shrink-0 font-serif text-xl italic text-sage-500">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-serif text-xl text-bark-700">{b.title}</h3>
                  <p className="mt-2 text-sm leading-[1.8] text-bark-500">{b.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================== how it works */}
      <section id="how-it-works" className="section scroll-mt-24 bg-paper">
        <div className="shell grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading eyebrow="If you volunteer" title="What it looks like for you" />
            <ul className="mt-8 space-y-6">
              {[
                'Browse the board without an account. Nothing is hidden behind a sign-up form.',
                'Claim a place in one click once you have joined. No application, no waiting to be approved.',
                'Everything you have claimed sits on your shelf, with the next date at the top.',
                'Check in on the day with a QR code or a six-digit number read out at the door.',
                'Keep a certificate for every event you attended, with a code anyone can verify.',
              ].map((line) => (
                <li key={line} className="flex gap-3.5 text-sm leading-[1.8] text-bark-600">
                  <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-sage-600" />
                  {line}
                </li>
              ))}
            </ul>
            <Link to="/opportunities" className="btn-primary mt-9">
              Find your volunteering opportunity
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <SectionHeading eyebrow="If you run a group" title="What it looks like for you" />
            <ul className="mt-8 space-y-6">
              {[
                'Write the shift once. Title, date, place, how many people — it publishes the moment you save.',
                'Stuck on the wording? Generate a first draft from the details and edit it into your own voice.',
                'Watch the places fill, and see the names and emails of everyone coming.',
                'Take attendance on the day from your phone, by QR or by ticking names off a list.',
                'Complete the event and HelpHop issues the certificates — and records any payment or perk you promised.',
              ].map((line) => (
                <li key={line} className="flex gap-3.5 text-sm leading-[1.8] text-bark-600">
                  <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-terra-600" />
                  {line}
                </li>
              ))}
            </ul>
            <Link
              to={isOrganization ? '/opportunities/new' : '/register'}
              className="btn-outline mt-9"
            >
              {isOrganization ? 'Post an opportunity' : 'Organisations, join us'}
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ money */}
      <section className="section">
        <div className="shell grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
          <Figure
            id={PHOTOS.harvest}
            alt="A volunteer carrying a crate of produce out of a community garden"
            ratio={3 / 2}
            width={620}
          />
          <div>
            <SectionHeading eyebrow="A note on money" title="HelpHop never holds your money" />
            <div className="prose-warm mt-6">
              <p>
                Some organisations offer a payment or a perk — travel costs, lunch, a voucher. When
                they do, HelpHop records what was promised and to whom, and marks it off when the
                organisation says it has been settled. The money itself never passes through us.
              </p>
              <p>
                The platform is free for volunteers and free for the groups posting. It is kept
                small on purpose.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================= close */}
      <section className="pb-24">
        <div className="shell">
          <div className="panel px-6 py-16 text-center sm:px-12">
            <Wave className="mx-auto h-4 w-20 text-oat-500" />
            <h2 className="mx-auto mt-6 max-w-xl font-serif text-[clamp(1.6rem,1.2rem+1.6vw,2.25rem)] leading-[1.25] text-bark-700">
              Come and find something worth your Saturday.
            </h2>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/opportunities" className="btn-primary btn-lg">
                Browse the board
              </Link>
              {!user && (
                <Link to="/register" className="btn-outline btn-lg">
                  Create an account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
