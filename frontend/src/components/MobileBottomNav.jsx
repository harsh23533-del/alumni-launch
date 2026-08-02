import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const icons = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-9 9 9" /><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </svg>
  ),
  browse: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  post: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  chat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  admin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4z" />
    </svg>
  ),
  profile: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
};

function buildTabs({ isAuthenticated, role, isAdmin }) {
  if (!isAuthenticated) {
    return [
      { id: 'home', label: 'Home', icon: 'home', path: '/' },
      { id: 'startups', label: 'Startups', icon: 'browse', path: '/startups' },
      { id: 'jobs', label: 'Jobs', icon: 'post', path: '/jobs' },
      { id: 'login', label: 'Log in', icon: 'profile', path: '/login' },
    ];
  }
  if (isAdmin) {
    return [
      { id: 'home', label: 'Home', icon: 'home', path: '/' },
      { id: 'admin', label: 'Admin', icon: 'admin', path: '/admin/dashboard' },
    ];
  }
  if (role === 'alumni') {
    return [
      { id: 'home', label: 'Home', icon: 'home', path: '/' },
      { id: 'dashboard', label: 'My startups', icon: 'browse', path: '/alumni/dashboard' },
      { id: 'post', label: 'Post', icon: 'post', path: '/alumni/post' },
      { id: 'chat', label: 'Chat', icon: 'chat', path: '/chat', badge: true },
    ];
  }
  if (role === 'student') {
    return [
      { id: 'home', label: 'Home', icon: 'home', path: '/' },
      { id: 'jobs', label: 'Jobs', icon: 'browse', path: '/jobs' },
      { id: 'applications', label: 'Applied', icon: 'post', path: '/student/applications' },
      { id: 'chat', label: 'Chat', icon: 'chat', path: '/chat', badge: true },
    ];
  }
  // company
  return [
    { id: 'home', label: 'Home', icon: 'home', path: '/' },
    { id: 'dashboard', label: 'My jobs', icon: 'browse', path: '/jobs/dashboard' },
    { id: 'post', label: 'Post', icon: 'post', path: '/jobs/post' },
    { id: 'chat', label: 'Chat', icon: 'chat', path: '/chat', badge: true },
  ];
}

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role, isAdmin } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        if (!cancelled) setUnreadCount(res.data.unread_count);
      } catch {
        // ignore — logged out mid-poll or offline
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isAuthenticated]);

  const tabs = buildTabs({ isAuthenticated, role, isAdmin });

  return (
    <nav className="mobile-bottom-nav" aria-label="Primary">
      {tabs.map((tab) => {
        const isActive = tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path);
        return (
          <button
            key={tab.id}
            className={`mobile-nav-item${isActive ? ' mobile-nav-item-active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <span className="mobile-nav-icon">
              {icons[tab.icon]}
              {tab.badge && unreadCount > 0 && (
                <span className="mobile-nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </span>
            <span className="mobile-nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
