import { Icon } from './ui.jsx';

/**
 * Controlled search/filter bar for the explore page.
 * `value` is { search, category, location }.
 */
export default function SearchFilters({ value, onChange, categories, locations, resultCount }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  const hasFilters = value.search || value.category !== 'All' || value.location;

  return (
    <div className="card p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <label className="label" htmlFor="search">
            Search
          </label>
          <div className="relative">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            />
            <input
              id="search"
              type="search"
              className="input pl-10"
              placeholder="Beach clean-up, tutoring, food bank…"
              value={value.search}
              onChange={set('search')}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="category">
            Category
          </label>
          <select id="category" className="input" value={value.category} onChange={set('category')}>
            <option value="All">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="location">
            Location
          </label>
          <div className="relative">
            <Icon
              name="pin"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            />
            <input
              id="location"
              list="location-options"
              className="input pl-10"
              placeholder="Any location"
              value={value.location}
              onChange={set('location')}
            />
          </div>
          <datalist id="location-options">
            {locations.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Quick category chips — faster than opening the select on mobile. */}
      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {['All', ...categories].map((c) => {
            const active = value.category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onChange({ ...value, category: c })}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                  active
                    ? 'bg-brand-600 text-white'
                    : 'bg-ink-100 text-ink-600 hover:bg-ink-200 hover:text-ink-900'
                }`}
              >
                {c === 'All' ? 'All' : c}
              </button>
            );
          })}
        </div>
      )}

      <div className="divider mt-4 flex items-center justify-between gap-3 pt-3">
        <p className="text-sm text-ink-500">
          {resultCount === null ? (
            'Searching…'
          ) : (
            <>
              <span className="font-semibold text-ink-900">{resultCount}</span>{' '}
              {resultCount === 1 ? 'opportunity' : 'opportunities'}
            </>
          )}
        </p>
        {hasFilters && (
          <button
            type="button"
            className="text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
            onClick={() => onChange({ search: '', category: 'All', location: '' })}
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
