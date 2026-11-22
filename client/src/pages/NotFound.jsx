import { Link } from 'react-router-dom';
import { Sprig } from '../components/Ornament.jsx';

export default function NotFound() {
  return (
    <div className="shell flex flex-col items-center justify-center gap-5 py-32 text-center">
      <Sprig className="h-9 w-9 text-sage-400" />
      <p className="eyebrow">Page not found</p>
      <h1 className="h-title max-w-lg">This path doesn’t lead anywhere</h1>
      <p className="max-w-sm text-sm leading-[1.8] text-bark-500">
        The page may have been taken down, or the link might simply be out of date. The board is
        still where you left it.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link to="/opportunities" className="btn-primary">
          Browse opportunities
        </Link>
        <Link to="/" className="btn-outline">
          Back to the start
        </Link>
      </div>
    </div>
  );
}
