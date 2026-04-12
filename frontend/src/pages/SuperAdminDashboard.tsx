import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInstitutes } from '../api/instituteApi';
import { getAllPlans } from '../api/planApi';
import { useToastStore } from '../store/toastStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const addToast = useToastStore((s: any) => s.addToast);

  const [institutes, setInstitutes] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [instRes, planRes] = await Promise.all([getInstitutes(), getAllPlans()]);
        setInstitutes(instRes.data.institutes || instRes.data || []);
        setPlans(planRes.data.plans || []);
      } catch { addToast('Failed to load platform data', 'error'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading platform dashboard..." />;

  const totalInstitutes = institutes.length;

  // Build dynamic plan counts
  const planCounts: Record<string, number> = {};
  plans.forEach((p: any) => { planCounts[p.planId] = 0; });
  institutes.forEach((inst: any) => {
    const plan = inst.plan || 'free';
    if (planCounts[plan] !== undefined) planCounts[plan]++;
    else planCounts[plan] = 1;
  });

  const PLAN_ICONS: Record<string, string> = { free: 'stars', starter: 'rocket_launch', pro: 'workspace_premium' };

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
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>Total Institutes</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary-container)' }}>business</span>
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-container)' }}>{totalInstitutes}</span>
        </div>

        {plans.map((p: any) => (
          <div key={p.planId} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>{p.name} Plan</span>
              <span className="material-symbols-outlined" style={{ color: p.colorHint }}>{PLAN_ICONS[p.planId] || 'diamond'}</span>
            </div>
            <span style={{ fontSize: '2.5rem', fontWeight: 900, color: p.colorHint }}>{planCounts[p.planId] || 0}</span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <section>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-container)', marginBottom: '1rem' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            { icon: 'business', label: 'Manage Institutes', action: () => navigate('/superadmin/institutes') },
            { icon: 'workspace_premium', label: 'Manage Plans', action: () => navigate('/superadmin/plans') },
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
                  <th>Students</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {institutes.slice(0, 10).map((inst: any) => {
                  const instPlan = plans.find((p: any) => p.planId === (inst.plan || 'free'));
                  const planColor = instPlan?.colorHint || '#64748b';
                  return (
                    <tr key={inst._id}>
                      <td style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{inst.name}</td>
                      <td style={{ color: 'var(--on-secondary-container)' }}>{inst.ownerEmail}</td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.6875rem', fontWeight: 800,
                          background: `${planColor}18`, color: planColor, border: `1px solid ${planColor}40`,
                        }}>
                          {(inst.plan || 'free').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ color: 'var(--on-secondary-container)', fontWeight: 600 }}>{inst.studentCount ?? 0} / {inst.studentLimit ?? '∞'}</td>
                      <td style={{ color: 'var(--on-secondary-container)', fontSize: '0.875rem' }}>{inst.createdAt ? new Date(inst.createdAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
