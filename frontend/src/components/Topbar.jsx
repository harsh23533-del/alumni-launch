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
      </div>
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!isAuthenticated && (
          <>
            <button onClick={() => navigate('/startups')}>Browse startups</button>
            <button onClick={() => navigate('/jobs')}>Jobs</button>
            <button onClick={() => navigate('/ideas')}>Ideas</button>
            <button onClick={() => navigate('/chat')}>Chat</button>
            <button onClick={() => navigate('/login')}>Log in</button>
            <button className="btn btn-primary" onClick={() => navigate('/signup')}>
              Sign up
            </button>
          </>
        )}
        {isAuthenticated && role === 'alumni' && (
          <>
            <button onClick={() => navigate('/alumni/dashboard')}>My startups</button>
            <button onClick={() => navigate('/alumni/post')}>Post a startup</button>
            <button onClick={() => navigate('/jobs/dashboard')}>My jobs</button>
            <button onClick={() => navigate('/jobs/post')}>Post a job</button>
            <button onClick={() => navigate('/ideas')}>Ideas</button>
            <button onClick={() => navigate('/messages')}>Messages</button>
            <button onClick={() => navigate('/chat')}>Chat</button>
            <NotificationBell />
            <button onClick={() => { logout(); navigate('/'); }}>Log out</button>
          </>
        )}
        {isAuthenticated && role === 'student' && (
          <>
            <button onClick={() => navigate('/startups')}>Browse startups</button>
            <button onClick={() => navigate('/jobs')}>Jobs</button>
            <button onClick={() => navigate('/ideas')}>Ideas</button>
            <button onClick={() => navigate('/messages')}>Messages</button>
            <button onClick={() => navigate('/chat')}>Chat</button>
            <NotificationBell />
            <button onClick={() => { logout(); navigate('/'); }}>Log out</button>
          </>
        )}
        {isAuthenticated && role === 'company' && (
          <>
            <button onClick={() => navigate('/jobs/dashboard')}>My jobs</button>
            <button onClick={() => navigate('/jobs/post')}>Post a job</button>
            <button onClick={() => navigate('/ideas')}>Ideas</button>
            <button onClick={() => navigate('/messages')}>Messages</button>
            <button onClick={() => navigate('/chat')}>Chat</button>
            <NotificationBell />
            <button onClick={() => { logout(); navigate('/'); }}>Log out</button>
          </>
        )}
        {isAuthenticated && isAdmin && (
          <button onClick={() => navigate('/admin/dashboard')}>Admin dashboard</button>
        )}
      </div>
    </div>
  );
}
