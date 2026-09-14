import { Link } from 'react-router-dom';
import { Icon } from '../components/ui.jsx';

export default function NotFound() {
  return (
    <div className="shell flex flex-col items-center justify-center gap-3 py-28 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon name="compass" className="h-7 w-7" />
      </span>
      <p className="mt-2 text-sm font-semibold text-brand-700">404</p>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">
        We couldn&apos;t find that page
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-ink-500">
        It may have been removed, or the link might be out of date.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link to="/opportunities" className="btn-primary">
          Browse opportunities
        </Link>
        <Link to="/" className="btn-outline">
          Go home
        </Link>
      </div>
    </div>
  );
}
