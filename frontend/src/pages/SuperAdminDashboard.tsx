import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInstitutes } from '../api/instituteApi';
import { useToastStore } from '../store/toastStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const addToast = useToastStore((s: any) => s.addToast);

  const [institutes, setInstitutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await getInstitutes();
        setInstitutes(data.institutes || data || []);
      } catch { addToast('Failed to load platform data', 'error'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading platform dashboard..." />;

  const totalInstitutes = institutes.length;
  const planCounts = { free: 0, starter: 0, pro: 0 };
  institutes.forEach((inst: any) => {
    const plan = (inst.plan || 'free') as keyof typeof planCounts;
    if (planCounts[plan] !== undefined) planCounts[plan]++;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '80rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <section>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--primary-container)', letterSpacing: '-0.025em' }}>
          Platform Overview
        </h2>
        <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500, marginTop: '0.25rem' }}>
          System-wide metrics and management
        </p>
      </section>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        {[
          { label: 'Total Institutes', value: totalInstitutes, icon: 'business', color: 'var(--primary-container)' },
          { label: 'Free Plan', value: planCounts.free, icon: 'stars', color: 'var(--on-secondary-container)' },
          { label: 'Starter Plan', value: planCounts.starter, icon: 'rocket_launch', color: '#F59E0B' },
          { label: 'Pro Plan', value: planCounts.pro, icon: 'workspace_premium', color: 'var(--on-tertiary-container)' },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>{stat.label}</span>
              <span className="material-symbols-outlined" style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <span style={{ fontSize: '2.5rem', fontWeight: 900, color: stat.color }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <section>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-container)', marginBottom: '1rem' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            { icon: 'business', label: 'Manage Institutes', action: () => navigate('/superadmin/institutes') },
            { icon: 'group', label: 'View Users', action: () => navigate('/superadmin/users') },
            { icon: 'analytics', label: 'Platform Analytics', action: () => navigate('/superadmin/analytics') },
            { icon: 'settings', label: 'Settings', action: () => navigate('/superadmin/settings') },
          ].map(action => (
            <button
              key={action.label}
              onClick={action.action}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                padding: '1.5rem', background: 'var(--surface-container-lowest)',
                borderRadius: 'var(--radius-2xl)', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(30,58,138,0.04)', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(30,58,138,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(30,58,138,0.04)'; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--on-primary-container)' }}>{action.icon}</span>
              <span style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '0.875rem' }}>{action.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Institutes */}
      {institutes.length > 0 && (
        <section>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-container)', marginBottom: '1rem' }}>Recent Institutes</h3>
          <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Institute</th>
                  <th>Owner</th>
                  <th>Plan</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {institutes.slice(0, 10).map((inst: any) => (
                  <tr key={inst._id}>
                    <td style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{inst.name}</td>
                    <td style={{ color: 'var(--on-secondary-container)' }}>{inst.ownerEmail}</td>
                    <td>
                      <span className={`badge ${inst.plan === 'pro' ? 'badge-success' : inst.plan === 'starter' ? 'badge-info' : ''}`}>
                        {(inst.plan || 'free').charAt(0).toUpperCase() + (inst.plan || 'free').slice(1)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--on-secondary-container)', fontSize: '0.875rem' }}>{inst.createdAt ? new Date(inst.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
