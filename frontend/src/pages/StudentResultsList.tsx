import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAttempts } from '../api/attemptApi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function StudentResultsList() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await getMyAttempts();
        const all = data.attempts || data || [];
        setAttempts(all.filter((a: any) => a.submittedAt));
      } catch { /* interceptor handles */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading results..." />;

  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((s: number, a: any) => s + (a.percentage || 0), 0) / attempts.length)
    : 0;
  const passCount = attempts.filter((a: any) => a.passed).length;

  return (
    <div style={{ padding: '2rem', maxWidth: '80rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)', letterSpacing: '-0.025em' }}>
          My Results
        </h2>
        <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500, marginTop: '0.25rem' }}>
          Review your exam performance and scores.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Exams Taken', value: attempts.length, icon: 'assignment' },
          { label: 'Passed', value: passCount, icon: 'check_circle' },
          { label: 'Average Score', value: `${avgScore}%`, icon: 'trending_up' },
          { label: 'Pass Rate', value: attempts.length > 0 ? `${Math.round((passCount / attempts.length) * 100)}%` : '—', icon: 'percent' },
        ].map(stat => (
          <div key={stat.label} className="stat-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>{stat.label}</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary-container)', fontSize: '1.25rem' }}>{stat.icon}</span>
            </div>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-container)' }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Results Table */}
      {attempts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', color: 'var(--on-secondary-container)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem', opacity: 0.4 }}>analytics</span>
          <p style={{ fontWeight: 600 }}>No results yet. Complete an exam to see your scores here.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Exam</th>
                <th>Submitted</th>
                <th style={{ textAlign: 'center' }}>Score</th>
                <th style={{ textAlign: 'center' }}>Percentage</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Violations</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt: any) => (
                <tr key={attempt._id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary-container)' }}>{attempt.examId?.title || 'Exam'}</td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--on-secondary-container)' }}>
                    {new Date(attempt.submittedAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 900, color: 'var(--primary-container)' }}>
                    {attempt.score ?? '—'} / {attempt.totalMarks ?? '—'}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>
                    {attempt.percentage != null ? `${attempt.percentage}%` : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${attempt.passed ? 'badge-success' : 'badge-danger'}`}>
                      {attempt.passed ? 'Passed ✓' : 'Failed ✗'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: (attempt.violations?.length || 0) > 0 ? 'var(--error)' : 'var(--on-tertiary-container)' }}>
                      {attempt.violations?.length || 0}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-ghost" onClick={() => navigate(`/student/results/${attempt._id}`)}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
