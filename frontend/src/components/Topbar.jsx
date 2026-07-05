import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Topbar() {
  const navigate = useNavigate();
  const { isAuthenticated, role, logout } = useAuth();

  return (
    <div className="topbar">
      <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <span className="brand-seal">A</span>
        AlumniLaunch
      </div>
      <div className="nav-links">
        {!isAuthenticated && (
          <>
            <button onClick={() => navigate('/startups')}>Browse startups</button>
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
            <button onClick={() => { logout(); navigate('/'); }}>Log out</button>
          </>
        )}
        {isAuthenticated && role === 'student' && (
          <>
            <button onClick={() => navigate('/startups')}>Browse startups</button>
            <button onClick={() => navigate('/student/applications')}>My applications</button>
            <button onClick={() => { logout(); navigate('/'); }}>Log out</button>
          </>
        )}
      </div>
    </div>
  );
}
