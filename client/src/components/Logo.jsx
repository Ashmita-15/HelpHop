import { Link } from 'react-router-dom';

/** Wordmark + mark. Used in the navbar and footer. */
export default function Logo({ to = '/', onClick, tone = 'dark' }) {
  const wordmark = tone === 'light' ? 'text-white' : 'text-ink-900';

  return (
    <Link to={to} onClick={onClick} className="group flex items-center gap-2.5" aria-label="VolunteerConnect home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-soft transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M12 20.5S4.5 15.8 4.5 10.4A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5.4-7.5 10.1-7.5 10.1Z"
            stroke="white"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="11" r="1.6" fill="white" />
        </svg>
      </span>
      <span className={`text-[1.05rem] font-bold tracking-tight ${wordmark}`}>
        Volunteer<span className="text-brand-500">Connect</span>
      </span>
    </Link>
  );
}
