import { Link } from 'react-router-dom';
import { HandsMark } from './Ornament.jsx';

/**
 * The wordmark. Set in the serif, with the drawn hands mark enclosed in a
 * ring that fills in on hover — the one piece of brand motion in the app.
 */
export default function Logo({ to = '/', onClick, size = 'md' }) {
  const text = size === 'sm' ? 'text-[1.1rem]' : 'text-[1.3rem]';
  const ring = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';

  return (
    <Link
      to={to}
      onClick={onClick}
      className="group inline-flex items-center gap-2.5"
      aria-label="HelpHop — home"
    >
      <span
        className={`${ring} flex items-center justify-center rounded-full border border-sage-400 text-sage-600
                    transition-colors duration-300 ease-natural group-hover:bg-sage-600 group-hover:text-paper`}
      >
        <HandsMark className="h-[1.1rem] w-[1.1rem]" />
      </span>
      <span className={`font-serif ${text} leading-none tracking-[-0.015em] text-bark-700`}>
        Help<span className="text-sage-600">Hop</span>
      </span>
    </Link>
  );
}
