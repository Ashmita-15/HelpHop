import { useAuth } from '../context/AuthContext.jsx';
import VolunteerDashboard from './VolunteerDashboard.jsx';
import OrganizationDashboard from './OrganizationDashboard.jsx';

/** Renders the dashboard matching the logged-in user's role. */
export default function Dashboard() {
  const { isOrganization } = useAuth();
  return isOrganization ? <OrganizationDashboard /> : <VolunteerDashboard />;
}
