import { useAuthStore } from '../store/authStore';

interface TopHeaderProps {
  readonly title?: string;
}

export default function TopHeader({ title = 'AcademicPro Proctor' }: TopHeaderProps) {
  const user = useAuthStore((s: any) => s.user);
  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="top-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.05em', color: 'var(--primary-container)' }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button style={{ padding: '0.5rem', color: '#64748b', background: 'none', border: 'none', borderRadius: '50%', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button style={{ padding: '0.5rem', color: '#64748b', background: 'none', border: 'none', borderRadius: '50%', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
        <div style={{
          height: '2rem', width: '2rem', borderRadius: '50%',
          background: 'var(--primary-container)', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 800, fontSize: '0.75rem',
        }}>
          {user?.avatar ? (
            <img src={user.avatar} alt="User avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            initials
          )}
        </div>
      </div>
    </header>
  );
}
