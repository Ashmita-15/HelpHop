import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import OpportunityCard from '../components/OpportunityCard.jsx';
import SearchFilters from '../components/SearchFilters.jsx';
import { Sprig } from '../components/Ornament.jsx';
import { Alert, CardSkeleton, EmptyState, Icon } from '../components/ui.jsx';

const EMPTY_FILTERS = { search: '', category: 'All', location: '' };

export default function Browse() {
  const { isOrganization } = useAuth();
  const [params, setParams] = useSearchParams();

  // The cause tiles on the landing page link here with ?cause=Environment.
  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    category: params.get('cause') || 'All',
  }));

  const hasFilters = Object.values(filters).some((v) => v && v !== 'All');
  const [opportunities, setOpportunities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const firstLoad = useRef(true);

  useEffect(() => {
    api
      .categories()
      .then(({ categories: c }) => setCategories(c))
      .catch(() => {});
  }, []);

  // Keep the URL in step with the chosen cause so the view can be shared.
  useEffect(() => {
    const current = params.get('cause') || 'All';
    if (current === filters.category) return;
    if (filters.category === 'All') setParams({}, { replace: true });
    else setParams({ cause: filters.category }, { replace: true });
    // `params`/`setParams` are stable enough here; the guard above stops loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category]);

  // Debounced so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(
      () => {
        api
          .listOpportunities(filters)
          .then(({ opportunities: list }) => {
            if (cancelled) return;
            setOpportunities(list);
            setError('');
          })
          .catch((err) => !cancelled && setError(err.message))
          .finally(() => {
            if (cancelled) return;
            setLoading(false);
            firstLoad.current = false;
          });
      },
      firstLoad.current ? 0 : 300
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters]);

  // Location suggestions come from whatever is currently posted.
  const locations = useMemo(
    () => [...new Set(opportunities.map((o) => o.location))].sort(),
    [opportunities]
  );

  // The first listing is given a wider, two-column treatment so the grid
  // opens like a page rather than a dashboard.
  const [lead, ...rest] = opportunities;

  return (
    <div className="shell py-12 sm:py-16">
      <header className="max-w-2xl">
        <p className="eyebrow flex items-center gap-2">
          <Sprig className="h-4 w-4 text-sage-500" />
          Explore
        </p>
        <h1 className="h-title mt-5">Find something worth your time</h1>
        <p className="lede mt-4">
          Everything local organisations are asking for right now. Pick a cause, or just read
          through and see what catches you.
        </p>
      </header>

      {isOrganization && (
        <div className="mt-8">
          <Link to="/opportunities/new" className="btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            Post an opportunity
          </Link>
        </div>
      )}

      <div className="mt-12">
        <SearchFilters
          value={filters}
          onChange={setFilters}
          categories={categories}
          locations={locations}
          resultCount={loading ? null : opportunities.length}
        />
      </div>

      {error && (
        <div className="mt-8">
          <Alert type="error" onDismiss={() => setError('')}>
            {error}
          </Alert>
        </div>
      )}

      <div className="mt-10">
        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'Nothing matches that just yet' : 'Nothing coming up right now'}
            message={
              hasFilters
                ? 'Try a broader word, a different cause, or clear what you have chosen and read through everything that is open.'
                : 'The board only shows events still to come. Check back in a day or two — organisations post new shifts all the time.'
            }
            action={
              hasFilters ? (
                <button type="button" className="btn-outline" onClick={() => setFilters(EMPTY_FILTERS)}>
                  Clear and show everything
                </button>
              ) : (
                <Link to="/about" className="btn-outline">
                  Read about HelpHop
                </Link>
              )
            }
          />
        ) : (
          <div className="space-y-8">
            <OpportunityCard opportunity={lead} featured />
            {rest.length > 0 && (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((o) => (
                  <OpportunityCard key={o._id} opportunity={o} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
