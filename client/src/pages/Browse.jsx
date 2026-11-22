import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import OpportunityCard from '../components/OpportunityCard.jsx';
import SearchFilters from '../components/SearchFilters.jsx';
import { Alert, CardSkeleton, EmptyState, Icon, PageHeader } from '../components/ui.jsx';

const EMPTY_FILTERS = { search: '', category: 'All', location: '' };

export default function Browse() {
  const { isOrganization } = useAuth();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
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

  return (
    <div className="shell py-10 sm:py-12">
      <PageHeader
        eyebrow="Explore"
        title="Volunteer opportunities"
        description="Every shift local organizations are currently looking to fill."
        actions={
          isOrganization && (
            <Link to="/opportunities/new" className="btn-primary">
              <Icon name="plus" className="h-4 w-4" />
              Post an opportunity
            </Link>
          )
        }
      />

      <SearchFilters
        value={filters}
        onChange={setFilters}
        categories={categories}
        locations={locations}
        resultCount={loading ? null : opportunities.length}
      />

      {error && (
        <div className="mt-6">
          <Alert type="error" onDismiss={() => setError('')}>
            {error}
          </Alert>
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          <EmptyState
            icon="search"
            title={hasFilters ? 'Nothing matches that yet' : 'Nothing coming up right now'}
            message={
              hasFilters
                ? 'Try a broader keyword, a different category, or clear the filters to see what else is on the board.'
                : 'The board only shows events that are still to come. Check back soon — organizations post new shifts all the time.'
            }
            action={
              hasFilters ? (
                <button type="button" className="btn-outline" onClick={() => setFilters(EMPTY_FILTERS)}>
                  Clear filters
                </button>
              ) : null
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((o) => (
              <OpportunityCard key={o._id} opportunity={o} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
