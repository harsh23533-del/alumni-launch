import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  const loadUnread = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.unread_count);
    } catch {
      // logged out mid-poll, ignore
    }
  };

  const loadNotifications = async () => {
    const res = await api.get('/notifications');
    setNotifications(res.data);
  };

  useEffect(() => {
    loadUnread();
    const interval = setInterval(loadUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = async () => {
    if (!open) await loadNotifications();
    setOpen(!open);
  };

  const handleClick = async (n) => {
    if (!n.is_read) {
      await api.post(`/notifications/${n.id}/read`);
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const markAllRead = async () => {
    await api.post('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={toggleOpen}
        style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, padding: '6px 8px' }}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2, background: 'var(--coral, #E76F51)',
            color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: '50%',
            minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%', width: 320, maxHeight: 400, overflowY: 'auto',
          background: 'var(--paper-raised, #fff)', border: '1px solid var(--line)', borderRadius: 10,
          boxShadow: 'var(--shadow-card)', zIndex: 100,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--line)' }}>
            <strong style={{ fontSize: 14 }}>Notifications</strong>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--brass)', fontSize: 12.5, cursor: 'pointer', fontWeight: 600 }}>
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13.5 }}>
              No notifications yet.
            </div>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                padding: '10px 14px', borderBottom: '1px solid var(--line)', cursor: 'pointer',
                background: n.is_read ? 'transparent' : 'rgba(201,151,44,0.06)',
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{n.title}</div>
              {n.message && <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 2 }}>{n.message}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
