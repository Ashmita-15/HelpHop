import { Icon } from './ui.jsx';

/**
 * The search line on the explore page. Deliberately not a filter panel: two
 * underlined fields sitting directly on the page, with the causes as chips
 * underneath. `value` is { search, category, location }.
 */
export default function SearchFilters({ value, onChange, categories, locations, resultCount }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  const hasFilters = value.search || value.category !== 'All' || value.location;

  const field =
    'w-full border-0 border-b border-bark-300 bg-transparent px-0 py-2.5 pl-7 text-[0.95rem] text-bark-800 ' +
    'placeholder:text-bark-400 focus:border-sage-500 focus:outline-none focus:ring-0 transition-colors';

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="relative">
          <label className="eyebrow mb-1 block" htmlFor="search">
            What would you like to do?
          </label>
          <Icon
            name="search"
            className="pointer-events-none absolute bottom-3.5 left-0 h-4 w-4 text-bark-400"
          />
          <input
            id="search"
            type="search"
            className={field}
            placeholder="Gardening, reading with children, a food run…"
            value={value.search}
            onChange={set('search')}
          />
        </div>

        <div className="relative">
          <label className="eyebrow mb-1 block" htmlFor="location">
            Near
          </label>
          <Icon
            name="pin"
            className="pointer-events-none absolute bottom-3.5 left-0 h-4 w-4 text-bark-400"
          />
          <input
            id="location"
            list="location-options"
            className={field}
            placeholder="Anywhere"
            value={value.location}
            onChange={set('location')}
          />
          <datalist id="location-options">
            {locations.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Causes, as a toggle group rather than a select. */}
      {categories.length > 0 && (
        <div
          className="mt-7 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter by cause"
        >
          <span className="eyebrow mr-1 hidden sm:inline" aria-hidden="true">
            Cause
          </span>
          {['All', ...categories].map((c) => {
              const active = value.category === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ ...value, category: c })}
                  className={`rounded-full border px-3.5 py-1.5 text-xs transition-all duration-200 ease-natural ${
                    active
                      ? 'border-sage-600 bg-sage-600 text-paper'
                      : 'border-bark-300/80 text-bark-600 hover:border-sage-400 hover:text-sage-700'
                  }`}
                >
                  {c === 'All' ? 'Everything' : c}
                </button>
              );
            })}
        </div>
      )}

      <div className="rule mt-7 flex flex-wrap items-center justify-between gap-3 pt-4">
        <p className="font-serif text-sm italic text-bark-500" aria-live="polite">
          {resultCount === null ? (
            'Looking…'
          ) : (
            <>
              {resultCount} {resultCount === 1 ? 'opportunity' : 'opportunities'}
              {hasFilters ? ' match what you asked for' : ' open right now'}
            </>
          )}
        </p>
        {hasFilters && (
          <button
            type="button"
            className="link text-sm"
            onClick={() => onChange({ search: '', category: 'All', location: '' })}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
