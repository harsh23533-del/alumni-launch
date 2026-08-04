import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Blocks already-logged-in users from re-visiting login/signup pages.
// Sends each role to where it actually belongs, not just "/", so a logged-in
// alumni hitting /login lands on their dashboard instead of the public home page.
export default function GuestOnlyRoute({ children }) {
  const { isAuthenticated, role, isAdmin } = useAuth();

  if (isAuthenticated) {
    if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
    if (role === 'alumni') return <Navigate to="/alumni/dashboard" replace />;
    if (role === 'student') return <Navigate to="/student/applications" replace />;
    if (role === 'company') return <Navigate to="/jobs/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
