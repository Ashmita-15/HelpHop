import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { Wave } from './Ornament.jsx';

const COLUMNS = [
  {
    title: 'For volunteers',
    links: [
      { label: 'Find an opportunity', to: '/opportunities' },
      { label: 'How HelpHop works', to: '/about#how-it-works' },
      { label: 'Create an account', to: '/register' },
    ],
  },
  {
    title: 'For organisations',
    links: [
      { label: 'Join us', to: '/register' },
      { label: 'Manage your sign-ups', to: '/login' },
      { label: 'What we believe', to: '/about#beliefs' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-bark-200/70 bg-oat-50">
      <div className="shell py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-[1.8] text-bark-500">
              HelpHop is a noticeboard for neighbourhood volunteering. Local organisations post
              what they need; people nearby put their hand up. Nothing more complicated than that.
            </p>
            <Wave className="mt-6 h-4 w-20 text-oat-500" />
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-serif text-base text-bark-700">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.to.includes('#') ? (
                      <a
                        href={l.to}
                        className="text-sm text-bark-500 transition-colors hover:text-sage-700"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        to={l.to}
                        className="text-sm text-bark-500 transition-colors hover:text-sage-700"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="rule mt-14 flex flex-col gap-3 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-bark-400">
            © {new Date().getFullYear()} HelpHop. Made for and by local community groups.
          </p>
          <p className="font-serif text-xs italic text-bark-400">
            A little help can go a long way.
          </p>
        </div>
      </div>
    </footer>
  );
}
