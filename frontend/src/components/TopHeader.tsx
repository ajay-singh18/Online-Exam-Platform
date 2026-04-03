import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

interface TopHeaderProps {
  readonly title?: string;
}

export default function TopHeader({ title = 'AcademicPro Proctor' }: TopHeaderProps) {
  const user = useAuthStore((s: any) => s.user);
  const addToast = useToastStore((s: any) => s.addToast);
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const goToSettings = () => {
    if (!user) return;
    const baseRoute = user.role.toLowerCase() === 'superadmin' ? '/superadmin' : `/${user.role}`;
    navigate(`${baseRoute}/settings`);
  };

  const handleNotifications = () => {
    addToast('You have no new notifications.', 'info');
  };

  return (
    <header className="top-header glass-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.05em', color: 'var(--primary-container)' }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            onClick={handleNotifications}
            style={{ padding: '0.5rem', color: '#64748b', background: 'none', border: 'none', borderRadius: '50%', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button 
            onClick={goToSettings}
            style={{ padding: '0.5rem', color: '#64748b', background: 'none', border: 'none', borderRadius: '50%', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>

        <div style={{ height: '2rem', width: '1px', background: 'var(--outline-variant)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1.2 }}>
              {user?.name || 'Guest'}
            </span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--secondary)', textTransform: 'capitalize', letterSpacing: '0.05em' }}>
              {user?.role || 'User'}
            </span>
          </div>
          
          <div style={{
            height: '2.5rem', width: '2.5rem', borderRadius: '50%',
            background: 'var(--auth-gradient)', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: '0.875rem',
            boxShadow: '0 4px 12px rgba(0, 83, 219, 0.15)'
          }}>
            {user?.avatar ? (
              <img src={user.avatar} alt="User avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
