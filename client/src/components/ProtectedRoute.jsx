import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loading } from './ui.jsx';

/**
 * Guards a route. Pass `role` to additionally restrict it to one user role.
 * Sends unauthenticated users to /login and remembers where they came from.
 */
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading label="Checking your session…" />;

  // Keep the query string: a scanned check-in link carries its token there.
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;

  return children;
}
