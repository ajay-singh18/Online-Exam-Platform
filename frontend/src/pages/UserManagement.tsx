import { useState, useEffect } from 'react';
import { getUsers, updateUserStatus } from '../api/userApi';
import { useToastStore } from '../store/toastStore';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const addToast = useToastStore((s: any) => s.addToast);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await getUsers();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      addToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      const { data } = await updateUserStatus(userId, newStatus);
      if (data.success) {
        setUsers(users.map(u => u._id === userId ? { ...u, status: newStatus } : u));
        addToast(`User ${newStatus.toLowerCase()} successfully`, 'success');
      }
    } catch (err) {
      addToast('Failed to update user status', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: 'var(--spacing-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)' }}>User Management</h1>
          <p style={{ color: 'var(--on-secondary-container)' }}>Platform-wide directory of all students and admins.</p>
        </div>
      </div>

      <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 250px', position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }}>search</span>
          <input 
            type="text" 
            placeholder="Search users..." 
            className="ghost-input" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '3rem', width: '100%', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-high)', border: 'none' }} 
          />
        </div>
        <select 
          className="ghost-input" 
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ flex: '1 1 150px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-high)', border: 'none' }}
        >
          <option value="All">All Roles</option>
          <option value="Admin">Admins</option>
          <option value="Student">Students</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
          <div className="data-table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead style={{ background: 'var(--surface-container-high)', borderBottom: '1px solid var(--outline-variant)' }}>
                <tr>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--on-surface)', fontSize: '0.875rem' }}>User</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--on-surface)', fontSize: '0.875rem' }}>Role</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--on-surface)', fontSize: '0.875rem' }}>Institute</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--on-surface)', fontSize: '0.875rem' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--on-surface)', fontSize: '0.875rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--outline)' }}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} style={{ borderBottom: '1px solid var(--surface-container-high)', transition: 'background 0.2s' }} className="hover:bg-surface-container-low">
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-container), var(--on-primary-container))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: '0.875rem' }}>{user.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '1rem', 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          backgroundColor: user.role === 'admin' ? 'var(--primary-container)' : 'var(--secondary-container)',
                          color: user.role === 'admin' ? 'var(--on-primary-container)' : 'var(--on-secondary-container)',
                          textTransform: 'capitalize'
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ fontWeight: 500, color: 'var(--on-surface)', fontSize: '0.875rem' }}>
                          {user.instituteId?.name || 'Platform Admin'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.375rem',
                          color: user.status === 'Suspended' ? 'var(--error)' : 'var(--primary-container)' 
                        }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />
                          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.status || 'Active'}</span>
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => toggleStatus(user._id, user.status || 'Active')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: user.status === 'Suspended' ? 'var(--on-primary-container)' : 'var(--error)',
                            fontWeight: 700,
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.8125rem'
                          }}
                          className="hover:bg-surface-container-high transition-colors"
                        >
                          {user.status === 'Suspended' ? 'Activate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
