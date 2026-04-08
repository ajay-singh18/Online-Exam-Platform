import { useState, useEffect, useRef } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore'; // Assuming authStore exists for user info
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, initSocket } = useNotificationStore();
  const { user } = useAuthStore() as any;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.instituteId) {
      initSocket(user.instituteId);
      fetchNotifications();
    }
  }, [user]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        className="btn-ghost" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative', padding: '0.5rem', borderRadius: '50%' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>notifications</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: 'var(--error)',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '0.625rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            border: '2px solid var(--surface)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: '320px',
          background: 'var(--surface-container-lowest)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-glass)',
          border: '1px solid var(--surface-container-high)',
          marginTop: '0.5rem',
          zIndex: 100,
          maxHeight: '480px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid var(--surface-container-high)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800 }}>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="btn-ghost" 
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>notifications_off</span>
                <p style={{ fontSize: '0.75rem' }}>No new notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif._id} 
                  onClick={() => markAsRead(notif._id)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--surface-container-high)',
                    background: notif.isRead ? 'transparent' : 'var(--surface-container-low)',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <p style={{ fontSize: '0.8125rem', fontWeight: notif.isRead ? 400 : 600, color: 'var(--on-surface)', marginBottom: '0.25rem' }}>
                    {notif.message}
                  </p>
                  <p style={{ fontSize: '0.625rem', color: 'var(--secondary)' }}>
                    {formatDistanceToNow(new Date(notif.createdAt))} ago
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
