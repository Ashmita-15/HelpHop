import { Route, Routes } from 'react-router-dom';

import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';

import Landing from './pages/Landing.jsx';
import Browse from './pages/Browse.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import OpportunityDetail from './pages/OpportunityDetail.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreateOpportunity from './pages/CreateOpportunity.jsx';
import EditOpportunity from './pages/EditOpportunity.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />

      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/opportunities" element={<Browse />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Organizations only — declared before /:id so "new" isn't read as an id */}
          <Route
            path="/opportunities/new"
            element={
              <ProtectedRoute role="organization">
                <CreateOpportunity />
              </ProtectedRoute>
            }
          />
          <Route
            path="/opportunities/:id/edit"
            element={
              <ProtectedRoute role="organization">
                <EditOpportunity />
              </ProtectedRoute>
            }
          />

          <Route path="/opportunities/:id" element={<OpportunityDetail />} />

          {/* Any logged-in user */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
