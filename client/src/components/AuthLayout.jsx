import { Link } from 'react-router-dom';
import { Icon, Photo } from './ui.jsx';
import { Sprig } from './Ornament.jsx';
import { PHOTOS } from '../lib/imagery.js';

/**
 * Split layout shared by sign in and join. The photograph side is a real
 * photograph rather than a feature list on a gradient, and it is dropped
 * entirely below `lg` where it would only push the form down the page.
 */
export default function AuthLayout({ title, subtitle, children, footer, quote }) {
  return (
    <div className="grid min-h-[calc(100vh-4.5rem)] lg:grid-cols-[1fr_0.95fr]">
      {/* Form */}
      <div className="flex items-center justify-center px-5 py-14 sm:px-8">
        <div className="w-full max-w-md animate-rise">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-bark-500 transition-colors hover:text-bark-800"
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
            Back to HelpHop
          </Link>

          <p className="eyebrow mt-10 flex items-center gap-2">
            <Sprig className="h-3.5 w-3.5 text-sage-500" />
            Welcome
          </p>
          <h1 className="h-title mt-4">{title}</h1>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-bark-500">{subtitle}</p>

          <div className="mt-10">{children}</div>

          {footer && <div className="mt-8 text-center text-sm text-bark-500">{footer}</div>}
        </div>
      </div>

      {/* Photograph */}
      <div className="relative hidden lg:block">
        <Photo
          id={PHOTOS.gardenBeds}
          alt="Volunteers working among the raised beds of a community garden"
          width={900}
          ratio={3 / 4}
          className="absolute inset-0 h-full w-full"
          eager
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bark-900/75 via-bark-900/15 to-transparent" />
        <figcaption className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
          <Sprig className="h-6 w-6 text-oat-200" />
          <p className="mt-5 max-w-sm font-serif text-xl leading-[1.45] text-paper">
            {quote || '“Nobody here does very much. We just all do a little, at the same time.”'}
          </p>
          <p className="mt-4 text-sm text-oat-200">
            Fairfield Allotments — one of the groups posting on HelpHop
          </p>
        </figcaption>
      </div>
    </div>
  );
}
