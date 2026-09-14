import { Link } from 'react-router-dom';
import { Icon } from './ui.jsx';

const POINTS = [
  'Every listing shows the date, place and spots left',
  'Sign up in one click — no application forms',
  'Organizations see exactly who is turning up',
];

/** Split layout shared by the login and register pages. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Form side */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md animate-fade-up">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
            Back to home
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-ink-500">{subtitle}</p>

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-ink-500">{footer}</div>}
        </div>
      </div>

      {/* Marketing side — hidden on small screens where it would just be noise */}
      <div className="relative hidden overflow-hidden bg-brand-gradient lg:flex lg:items-center">
        <div className="relative px-12 py-16 xl:px-16">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
            VolunteerConnect
          </p>
          <h2 className="mt-4 max-w-md text-3xl font-bold leading-tight tracking-tight text-white">
            A noticeboard for people who show up.
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-white/80">
            Local groups post the shifts they need filled. Neighbours claim the ones that fit.
            That&apos;s the whole thing.
          </p>

          <ul className="mt-10 space-y-4">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-white/90">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Icon name="check" className="h-3 w-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
