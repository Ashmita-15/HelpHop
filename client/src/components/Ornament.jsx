/**
 * Small hand-drawn marks. They exist to soften an edge or close a section —
 * never to fill space. Each one is a single loose stroke rather than a shape
 * library, so they read as drawn rather than generated.
 */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/** A sprig of three leaves. Used beside section labels and in empty states. */
export function Sprig({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" {...stroke} strokeWidth="1.3">
      <path d="M16 29c0-7.5.6-13 2.4-17.6" />
      <path d="M18.6 16.4c-3.1.6-5.6-.4-7-2.6-1.4-2.2-1.2-4.6.2-6.3 2.6.6 4.6 1.9 5.7 3.7 1.1 1.8 1.4 3.4 1.1 5.2Z" />
      <path d="M19.6 12.9c2.7-.5 4.6-1.9 5.6-4 1-2.1.7-4.2-.6-5.7-2.4.8-4.1 2.2-4.9 4.1-.8 1.9-.8 3.5-.1 5.6Z" />
    </svg>
  );
}

/**
 * A loose rule that sits under a headline. `animate` draws it in once when the
 * element mounts, which is the only motion on most pages.
 */
export function Underline({ className = 'h-3 w-40 text-sage-400', animate = false }) {
  return (
    <svg viewBox="0 0 200 12" className={className} aria-hidden="true" preserveAspectRatio="none" {...stroke} strokeWidth="2.4">
      <path
        d="M3 8.4c26-3.6 52-5.4 78-5.4s52 1.9 76 5.6"
        strokeDasharray={animate ? 240 : undefined}
        className={animate ? 'animate-draw' : undefined}
      />
    </svg>
  );
}

/** A short wavy divider for the seam between two sections. */
export function Wave({ className = 'h-4 w-24 text-oat-500' }) {
  return (
    <svg viewBox="0 0 96 16" className={className} aria-hidden="true" {...stroke} strokeWidth="1.5">
      <path d="M2 10c6-7 12-7 18 0s12 7 18 0 12-7 18 0 12 7 18 0 12-7 18 0" />
    </svg>
  );
}

/** An arc of dashes, used to lead the eye between the two halves of a hero. */
export function Arc({ className = 'h-16 w-28 text-oat-500' }) {
  return (
    <svg viewBox="0 0 112 64" className={className} aria-hidden="true" {...stroke} strokeWidth="1.4">
      <path d="M4 60C14 22 44 4 78 4" strokeDasharray="2 7" />
      <path d="M70 1.5 79.5 4.2 73.5 11" />
    </svg>
  );
}

/** Two open hands, one passing to the other. The mark inside the logo. */
export function HandsMark({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden="true" {...stroke} strokeWidth="1.5">
      <path d="M5 13.5c-1.4-.5-2.3-1.6-2.1-2.6.2-1 1.3-1.5 2.5-1.2l4.2 1.2" />
      <path d="M9.6 10.9c2-1.8 4.3-2.6 6.8-2.3 3.6.4 6 2.7 6.6 6.1.5 2.8-.6 5.3-2.9 7" />
      <path d="M20.1 21.7c-3 1.9-6.4 2.2-9.6.6C7.6 20.8 5.8 18 5.2 14l-.2-1.3" />
      <path d="M14 8.6c.4-2.3 1.9-4 4-4.6" />
    </svg>
  );
}
