import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

const COLUMNS = [
  {
    title: 'Volunteers',
    links: [
      { label: 'Browse opportunities', to: '/opportunities' },
      { label: 'How it works', to: '/#how-it-works' },
      { label: 'Create an account', to: '/register' },
    ],
  },
  {
    title: 'Organizations',
    links: [
      { label: 'Post an opportunity', to: '/register' },
      { label: 'Manage sign-ups', to: '/login' },
      { label: 'Why VolunteerConnect', to: '/#impact' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-ink-200/70 bg-ink-50/60">
      <div className="shell py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
              A noticeboard for local volunteering. Organizations post the shifts they need
              filled, and neighbours claim the ones that fit their week.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-ink-900">{col.title}</h3>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.to.includes('#') ? (
                      <a
                        href={l.to}
                        className="text-sm text-ink-500 transition-colors hover:text-brand-700"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        to={l.to}
                        className="text-sm text-ink-500 transition-colors hover:text-brand-700"
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

        <div className="divider mt-10 flex flex-col gap-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-400">
            © {new Date().getFullYear()} VolunteerConnect. Built for local community groups.
          </p>
          <p className="text-xs text-ink-400">Made with care, not venture capital.</p>
        </div>
      </div>
    </footer>
  );
}
