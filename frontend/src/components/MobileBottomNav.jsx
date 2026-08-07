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
  idea: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.4 1 1.2 1 2.3h6c0-1.1.4-1.9 1-2.3A7 7 0 0 0 12 2z" />
    </svg>
  ),
  mail: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" />
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
    </svg>
  ),
  sponsor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15 9 22 9.5 16.5 14 18.5 21 12 17 5.5 21 7.5 14 2 9.5 9 9 12 2" />
    </svg>
  ),
  groups: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

function buildTabs({ isAuthenticated, role, isAdmin }) {
  if (!isAuthenticated) {
    return [
      { id: 'home', label: 'Home', icon: 'home', path: '/' },
      { id: 'startups', label: 'Startups', icon: 'browse', path: '/startups' },
      { id: 'ideas', label: 'Ideas', icon: 'idea', path: '/ideas' },
      { id: 'groups', label: 'Groups', icon: 'groups', path: '/groups' },
      { id: 'sponsors', label: 'Sponsors', icon: 'sponsor', path: '/sponsors' },
      { id: 'chat', label: 'Chat', icon: 'chat', path: '/chat' },
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
      { id: 'ideas', label: 'Ideas', icon: 'idea', path: '/ideas' },
      { id: 'groups', label: 'Groups', icon: 'groups', path: '/groups' },
      { id: 'sponsors', label: 'Sponsors', icon: 'sponsor', path: '/sponsors' },
      { id: 'messages', label: 'Messages', icon: 'mail', path: '/messages' },
      { id: 'chat', label: 'Chat', icon: 'chat', path: '/chat', badge: true },
    ];
  }
  if (role === 'student') {
    return [
      { id: 'home', label: 'Home', icon: 'home', path: '/' },
      { id: 'jobs', label: 'Jobs', icon: 'browse', path: '/jobs' },
      { id: 'ideas', label: 'Ideas', icon: 'idea', path: '/ideas' },
      { id: 'groups', label: 'Groups', icon: 'groups', path: '/groups' },
      { id: 'sponsors', label: 'Sponsors', icon: 'sponsor', path: '/sponsors' },
      { id: 'messages', label: 'Messages', icon: 'mail', path: '/messages' },
      { id: 'chat', label: 'Chat', icon: 'chat', path: '/chat', badge: true },
    ];
  }
  // company
  return [
    { id: 'home', label: 'Home', icon: 'home', path: '/' },
    { id: 'dashboard', label: 'My jobs', icon: 'browse', path: '/jobs/dashboard' },
    { id: 'post', label: 'Post', icon: 'post', path: '/jobs/post' },
    { id: 'ideas', label: 'Ideas', icon: 'idea', path: '/ideas' },
    { id: 'groups', label: 'Groups', icon: 'groups', path: '/groups' },
    { id: 'sponsors', label: 'Sponsors', icon: 'sponsor', path: '/sponsors' },
    { id: 'messages', label: 'Messages', icon: 'mail', path: '/messages' },
    { id: 'chat', label: 'Chat', icon: 'chat', path: '/chat', badge: true },
  ];
}

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role, isAdmin, logout } = useAuth();
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
        const isActive = tab.action ? false : (tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path));
        return (
          <button
            key={tab.id}
            className={`mobile-nav-item${isActive ? ' mobile-nav-item-active' : ''}`}
            onClick={() => {
              if (tab.action === 'logout') {
                logout();
                navigate('/');
              } else {
                navigate(tab.path);
              }
            }}
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
