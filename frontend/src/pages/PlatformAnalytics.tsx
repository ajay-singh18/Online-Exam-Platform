import { useState, useEffect } from 'react';
import { getPlatformSummary } from '../api/analyticsApi';
import { useToastStore } from '../store/toastStore';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['var(--primary)', 'var(--tertiary)', '#fbbf24', 'var(--error)'];

export default function PlatformAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const addToast = useToastStore((s: any) => s.addToast);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const resp = await getPlatformSummary();
      if (resp.data.success) {
        setData(resp.data.platform);
      }
    } catch (err) {
      addToast('Failed to load platform analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)' }}>Platform Analytics</h1>
        <p style={{ color: 'var(--on-secondary-container)' }}>Global health and usage metrics across all institutes.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-xl)', background: 'var(--primary-container)', color: 'var(--on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined">business</span>
            </div>
            <div>
              <div style={{ color: 'var(--secondary)', fontSize: '0.875rem', fontWeight: 600 }}>Total Institutes</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)' }}>{data.totalInstitutes}</div>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-xl)', background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined">group</span>
            </div>
            <div>
              <div style={{ color: 'var(--secondary)', fontSize: '0.875rem', fontWeight: 600 }}>Total Users</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)' }}>{(data.totalStudents + data.totalAdmins).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-xl)', background: 'var(--secondary-container)', color: 'var(--on-secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined">assignment</span>
            </div>
            <div>
              <div style={{ color: 'var(--secondary)', fontSize: '0.875rem', fontWeight: 600 }}>Total Exams Taken</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)' }}>{data.totalAttempts.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-xl)', background: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined">gavel</span>
            </div>
            <div>
              <div style={{ color: 'var(--secondary)', fontSize: '0.875rem', fontWeight: 600 }}>Global Violation Rate</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)' }}>{data.flaggedRate}%</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--on-surface)', marginBottom: '1.5rem' }}>Subscription Plans</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.planDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="plan"
                >
                  {data.planDistribution.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: 'var(--radius-lg)', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: 'var(--on-surface)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--on-surface)', marginBottom: '1.5rem' }}>User Roles Breakdown</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { role: 'Students', count: data.totalStudents },
                { role: 'Admins', count: data.totalAdmins }
              ]} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--surface-container-high)" />
                <XAxis type="number" stroke="var(--outline)" />
                <YAxis dataKey="role" type="category" stroke="var(--secondary)" fontWeight={600} width={80} />
                <RechartsTooltip 
                  cursor={{fill: 'var(--surface-container)'}}
                  contentStyle={{ borderRadius: 'var(--radius-lg)', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" fill="var(--primary)" barSize={40} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
