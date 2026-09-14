import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets scroll position on navigation, but leaves in-page anchor links
 * (e.g. /#how-it-works) alone so they can scroll to their target.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}
