/**
 * The shared kit. Everything visual that appears on more than one page lives
 * here so a change to a badge or an empty state lands everywhere at once.
 */

import { useEffect, useRef } from 'react';
import { Sprig } from './Ornament.jsx';
import { photo as photoUrl } from '../lib/imagery.js';

/* ---------------------------------------------------------------- icons */

const iconBase = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
};

/** Inline stroke icons, drawn at a lighter weight than the old set. */
export function Icon({ name, className = 'h-4 w-4' }) {
  const paths = {
    pin: (
      <>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
    users: (
      <>
        <path d="M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 19v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    check: <path d="m20 6-11 11-5-5" />,
    arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
    arrowLeft: <path d="M19 12H5M11 18l-6-6 6-6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    sparkle: (
      <>
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
        <path d="M12 8.5 13.2 11l2.3 1-2.3 1-1.2 2.5L10.8 13 8.5 12l2.3-1L12 8.5Z" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
      </>
    ),
    building: (
      <>
        <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 21V9h4a2 2 0 0 1 2 2v10" />
        <path d="M9 7h2M9 11h2M9 15h2" />
      </>
    ),
    heart: (
      <path d="M19.5 5.5a5 5 0 0 0-7.5.5 5 5 0 0 0-7.5-.5 5.2 5.2 0 0 0 0 7.3L12 20.5l7.5-7.7a5.2 5.2 0 0 0 0-7.3Z" />
    ),
    shield: (
      <>
        <path d="M12 3 5 6v6c0 4.4 2.9 8.2 7 9 4.1-.8 7-4.6 7-9V6l-7-3Z" />
        <path d="m9.5 12 1.8 1.8 3.4-3.6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5M21 12H9" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),
    qr: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3zM19 19h2M14 21h3M21 14v3" />
      </>
    ),
    gift: (
      <>
        <path d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7ZM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z" />
      </>
    ),
    wallet: (
      <>
        <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" />
        <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2Z" />
        <circle cx="16.5" cy="13.5" r="1" />
      </>
    ),
    certificate: (
      <>
        <path d="M15 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7" />
        <path d="M8 7h7M8 11h5" />
        <circle cx="17" cy="15" r="3.5" />
        <path d="m15.5 18-.5 3.5 2-1 2 1-.5-3.5" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12M7 11l5 5 5-5" />
        <path d="M5 20h14" />
      </>
    ),
    leaf: (
      <>
        <path d="M4 20c0-8 5-14 16-15 1 10-4 15-11 15-2.5 0-5 0-5 0Z" />
        <path d="M9 19c1.5-5 4-8 8-10" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2v2.4M12 19.6V22M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2 12h2.4M19.6 12H22M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
      </>
    ),
  };

  return (
    <svg {...iconBase} className={className} aria-hidden="true">
      {paths[name] || paths.compass}
    </svg>
  );
}

/* ------------------------------------------------------------ photography */

/**
 * A photograph. Pass `src` for a picture somebody uploaded, or `id` for one
 * from the curated library — library images are cropped server-side to the
 * ratio they will occupy, so nothing reflows as they load. Either way the
 * image is object-cover inside its frame and carries real alt text.
 */
export function Photo({ src, id, alt, width = 800, ratio = 3 / 2, className = '', eager = false }) {
  return (
    <img
      src={src || photoUrl(id, width, ratio)}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={`photo h-full w-full ${className}`}
    />
  );
}

/** A photograph with a caption set underneath, as in a printed feature. */
export function Figure({ id, alt, caption, ratio = 3 / 2, width = 800, className = '', eager }) {
  return (
    <figure className={className}>
      <div className="photo-frame" style={{ aspectRatio: ratio }}>
        <Photo id={id} alt={alt} ratio={ratio} width={width} eager={eager} />
      </div>
      {caption && (
        <figcaption className="mt-3 font-serif text-sm italic leading-relaxed text-bark-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/** Initial-circle stand-in for someone with no photograph. */
export function Avatar({ name = '?', photoId, className = 'h-10 w-10' }) {
  if (photoId) {
    return (
      <span className={`${className} shrink-0 overflow-hidden rounded-full bg-oat-200`}>
        <Photo id={photoId} alt={name} width={96} ratio={1} />
      </span>
    );
  }
  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-sage-100 font-serif text-sm text-sage-800`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

/* -------------------------------------------------------------- feedback */

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
      <path
        className="opacity-90"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        d="M12 2a10 10 0 0 1 10 10"
      />
    </svg>
  );
}

export function Loading({ label = 'One moment…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-28 text-bark-400">
      <Spinner className="h-6 w-6 text-sage-600" />
      <p className="font-serif text-sm italic">{label}</p>
    </div>
  );
}

/** Placeholder that mirrors the shape of an opportunity card while it loads. */
export function CardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <div className="aspect-[3/2] animate-pulse bg-oat-100" />
      <div className="animate-pulse p-5">
        <div className="h-3 w-20 rounded-full bg-oat-100" />
        <div className="mt-4 h-4 w-4/5 rounded bg-oat-100" />
        <div className="mt-2 h-4 w-2/5 rounded bg-oat-100" />
        <div className="mt-6 space-y-2.5">
          <div className="h-2.5 w-2/3 rounded bg-oat-100" />
          <div className="h-2.5 w-1/2 rounded bg-oat-100" />
        </div>
      </div>
    </div>
  );
}

const ALERT_STYLES = {
  error: 'border-terra-200 bg-terra-50 text-terra-800',
  success: 'border-sage-200 bg-sage-50 text-sage-800',
  info: 'border-oat-200 bg-oat-50 text-bark-700',
  warning: 'border-oat-400 bg-oat-100 text-bark-800',
};

export function Alert({ type = 'info', children, onDismiss }) {
  if (!children) return null;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex animate-appear items-start gap-3 rounded-card border px-4 py-3 text-sm leading-relaxed ${ALERT_STYLES[type]}`}
    >
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="-mr-1 shrink-0 rounded-full p-1 opacity-50 transition hover:opacity-100"
          aria-label="Dismiss"
        >
          <Icon name="close" className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/**
 * Empty states carry a hand-drawn sprig instead of an icon tile — they should
 * feel like a note left behind, not like a system message.
 */
export function EmptyState({ title, message, action, tone = 'sage' }) {
  const tones = { sage: 'text-sage-400', oat: 'text-oat-500' };

  return (
    <div className="panel flex flex-col items-center gap-4 px-6 py-16 text-center">
      <Sprig className={`h-8 w-8 ${tones[tone]}`} />
      <h3 className="font-serif text-xl text-bark-700">{title}</h3>
      {message && <p className="max-w-md text-sm leading-[1.75] text-bark-500">{message}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------- atoms */

const BADGE_TONES = {
  sage: 'bg-sage-100 text-sage-800',
  terra: 'bg-terra-100 text-terra-800',
  oat: 'bg-oat-200 text-bark-700',
  neutral: 'bg-bark-100 text-bark-600',
  outline: 'border border-bark-300/80 text-bark-600',
};

export function Badge({ tone = 'neutral', icon, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium tracking-[0.02em] ${BADGE_TONES[tone]}`}
    >
      {icon && <Icon name={icon} className="h-3 w-3" />}
      {children}
    </span>
  );
}

/**
 * One figure in a dashboard summary. Set as a ruled column rather than a
 * boxed metric tile, which is what makes dashboards read as admin software.
 */
export function StatCard({ label, value, hint, icon, tone = 'sage' }) {
  const tones = { sage: 'text-sage-600', terra: 'text-terra-600', neutral: 'text-bark-400' };

  return (
    <div className="flex items-start gap-3 border-t border-bark-200/70 pt-4">
      {icon && (
        <span className={`mt-1 shrink-0 ${tones[tone]}`}>
          <Icon name={icon} className="h-4 w-4" />
        </span>
      )}
      <div className="min-w-0">
        <p className="font-serif text-3xl leading-none text-bark-700">{value}</p>
        <p className="mt-2 text-sm text-bark-600">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-bark-400">{hint}</p>}
      </div>
    </div>
  );
}

/** Thin capacity bar shared by cards, the detail page and dashboards. */
export function ProgressBar({ value, max, className = 'h-1' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const full = value >= max;

  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-oat-200 ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-natural ${
          full ? 'bg-oat-500' : 'bg-sage-500'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* --------------------------------------------------------------- overlays */

/**
 * Modal. Closes on Escape and on a click outside, traps nothing fancier than
 * an initial focus move — which is all these three dialogs need.
 */
export function Modal({ title, subtitle, onClose, children }) {
  const panel = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    panel.current?.focus();

    // Stop the page behind the dialog from scrolling under it.
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex animate-appear items-end justify-center bg-bark-900/35 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panel}
        tabIndex={-1}
        className="max-h-[88vh] w-full max-w-lg animate-rise overflow-y-auto rounded-t-card bg-paper shadow-lift focus:outline-none sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-bark-200/70 bg-paper/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <h2 className="truncate font-serif text-lg text-bark-700">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-bark-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 shrink-0 rounded-full p-1.5 text-bark-400 transition hover:bg-bark-100 hover:text-bark-700"
            aria-label="Close"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- headings */

/** The heading every inner page opens with. */
export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 border-b border-bark-200/70 pb-8">
      <div className="min-w-0">
        {eyebrow && (
          <p className="eyebrow mb-3 flex items-center gap-2">
            <Sprig className="h-3.5 w-3.5 text-sage-400" />
            {eyebrow}
          </p>
        )}
        <h1 className="h-title">{title}</h1>
        {description && <p className="mt-3 max-w-prose text-[0.95rem] leading-relaxed text-bark-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** A heading inside a page or a landing section. */
export function SectionHeading({ eyebrow, title, description, action, align = 'left' }) {
  const centred = align === 'center';

  return (
    <div
      className={`flex flex-wrap items-end gap-6 ${
        centred ? 'flex-col items-center text-center' : 'justify-between'
      }`}
    >
      <div className={centred ? 'max-w-2xl' : 'max-w-2xl'}>
        {eyebrow && (
          <p className={`eyebrow mb-3 flex items-center gap-2 ${centred ? 'justify-center' : ''}`}>
            <Sprig className="h-3.5 w-3.5 text-sage-400" />
            {eyebrow}
          </p>
        )}
        <h2 className="h-title">{title}</h2>
        {description && <p className={`lede mt-4 ${centred ? 'mx-auto' : ''}`}>{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------ formatting */

export const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const formatDateShort = (value) =>
  new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export const formatDateTime = (value) =>
  new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

/** "Good morning" / "Good afternoon" / "Good evening", for dashboard greetings. */
export const greeting = (date = new Date()) => {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};
