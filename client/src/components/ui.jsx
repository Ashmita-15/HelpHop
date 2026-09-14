/** Shared presentational primitives used across every page. */

/* ---------------------------------------------------------------- icons */

const iconBase = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
};

/** Inline stroke icons — keeps the UI crisp where emoji looked informal. */
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
  };

  return (
    <svg {...iconBase} className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

/* -------------------------------------------------------------- feedback */

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-400">
      <Spinner className="h-7 w-7 text-brand-600" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

/** Grey placeholder blocks that mirror the card grid while data loads. */
export function CardSkeleton() {
  return (
    <div className="card animate-pulse p-5">
      <div className="h-5 w-24 rounded-full bg-ink-100" />
      <div className="mt-4 h-5 w-3/4 rounded bg-ink-100" />
      <div className="mt-2 h-4 w-1/2 rounded bg-ink-100" />
      <div className="mt-5 space-y-2.5">
        <div className="h-3 w-2/3 rounded bg-ink-100" />
        <div className="h-3 w-1/2 rounded bg-ink-100" />
        <div className="h-3 w-3/5 rounded bg-ink-100" />
      </div>
      <div className="mt-5 h-1.5 w-full rounded-full bg-ink-100" />
    </div>
  );
}

const ALERT_STYLES = {
  error: 'bg-rose-50 border-rose-200 text-rose-800',
  success: 'bg-brand-50 border-brand-200 text-brand-800',
  info: 'bg-ocean-50 border-ocean-200 text-ocean-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
};

export function Alert({ type = 'info', children, onDismiss }) {
  if (!children) return null;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex animate-fade-in items-start gap-3 rounded-xl border px-4 py-3 text-sm ${ALERT_STYLES[type]}`}
    >
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="-mr-1 shrink-0 rounded-md p-1 opacity-50 transition hover:opacity-100"
          aria-label="Dismiss"
        >
          <Icon name="close" className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon = 'compass', title, message, action }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      {message && <p className="max-w-md text-sm leading-relaxed text-ink-500">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------- atoms */

const BADGE_TONES = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-200/70',
  ocean: 'bg-ocean-50 text-ocean-700 ring-ocean-200/70',
  neutral: 'bg-ink-100 text-ink-600 ring-ink-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
};

export function Badge({ tone = 'neutral', icon, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${BADGE_TONES[tone]}`}
    >
      {icon && <Icon name={icon} className="h-3 w-3" />}
      {children}
    </span>
  );
}

export function StatCard({ label, value, hint, icon, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    ocean: 'bg-ocean-50 text-ocean-600',
    neutral: 'bg-ink-100 text-ink-600',
  };

  return (
    <div className="card p-5 transition-shadow duration-300 hover:shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-500">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-ink-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
        </div>
        {icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
            <Icon name={icon} className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );
}

/** Thin capacity bar shared by cards and the detail page. */
export function ProgressBar({ value, max, className = 'h-1.5' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const full = value >= max;

  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-ink-100 ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${full ? 'bg-amber-400' : 'bg-brand-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Modal({ title, subtitle, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-ink-900/40 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[88vh] w-full max-w-lg animate-fade-up overflow-y-auto rounded-t-2xl bg-white shadow-lift sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-ink-200/70 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-ink-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 shrink-0 rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
            aria-label="Close"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/** Consistent page heading used by every inner page. */
export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
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
