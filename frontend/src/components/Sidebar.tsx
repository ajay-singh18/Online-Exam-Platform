import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface SidebarLink {
  label: string;
  icon: string;
  path: string;
}

interface SidebarProps {
  readonly links: SidebarLink[];
  readonly portalName: string;
  readonly portalSubtitle: string;
}

export default function Sidebar({ links, portalName, portalSubtitle }: SidebarProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((s: any) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 900, color: 'var(--primary-container)', letterSpacing: '-0.05em' }}>
          {portalName}
        </h1>
        <p className="label-xs" style={{ color: 'var(--on-secondary-container)', marginTop: '0.25rem' }}>
          {portalSubtitle}
        </p>
      </div>

      <nav style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === '/student' || link.path === '/admin' || link.path === '/superadmin'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <a href="#" className="sidebar-link">
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>help_outline</span>
          Help
        </a>
        <button
          onClick={handleLogout}
          className="sidebar-link"
          style={{ border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
