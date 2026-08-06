import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ProfileSummary from './ProfileSummary';

export default function Topbar() {
  const navigate = useNavigate();
  const { isAuthenticated, role, isAdmin, logout } = useAuth();

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/logo.png" alt="AlumniLaunch" className="brand-seal" style={{ objectFit: 'cover' }} />
          AlumniLaunch
        </div>
        {isAuthenticated && !isAdmin && <ProfileSummary />}
        {isAuthenticated && !isAdmin && <NotificationBell />}
      </div>
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!isAuthenticated && (
          <>
            <button onClick={() => navigate('/startups')}>Browse startups</button>
            <button onClick={() => navigate('/login')}>Log in</button>
            <button className="btn btn-primary" onClick={() => navigate('/signup')}>
              Sign up
            </button>
          </>
        )}
        {isAuthenticated && !isAdmin && (
          <>
            <button onClick={() => navigate('/startups')}>Browse startups</button>
            <button onClick={() => { logout(); navigate('/'); }}>Log out</button>
          </>
        )}
        {isAuthenticated && isAdmin && (
          <>
            <button onClick={() => navigate('/admin/dashboard')}>Admin dashboard</button>
            <button onClick={() => { logout(); navigate('/'); }}>Log out</button>
          </>
        )}
      </div>
    </div>
  );
}
