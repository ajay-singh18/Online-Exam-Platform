import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getExamAttempts } from '../api/attemptApi';
import { getExams } from '../api/examApi';
import { useToastStore } from '../store/toastStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ExamResultsAdmin() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const addToast = useToastStore((s: any) => s.addToast);

  const [exam, setExam] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examRes, attemptRes] = await Promise.all([
          getExams(),
          getExamAttempts(examId),
        ]);
        const allExams = examRes.data.exams || examRes.data || [];
        setExam(allExams.find((e: any) => e._id === examId));
        setAttempts(attemptRes.data.attempts || attemptRes.data || []);
      } catch { addToast('Failed to load results', 'error'); }
      finally { setLoading(false); }
    };
    if (examId) fetchData();
  }, [examId]);

  if (loading) return <LoadingSpinner message="Loading results..." />;

  const avgScore = attempts.length > 0 ? Math.round(attempts.reduce((s: number, a: any) => s + (a.percentage || 0), 0) / attempts.length) : 0;
  const passCount = attempts.filter((a: any) => a.passed).length;

  return (
    <div style={{ padding: '2rem', maxWidth: '72rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)' }}>Exam Results</h2>
          <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500 }}>{exam?.title || 'Exam'} — {attempts.length} submission{attempts.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/admin')}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span>
          Back
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Submissions', value: attempts.length, icon: 'group' },
          { label: 'Avg Score', value: `${avgScore}%`, icon: 'analytics' },
          { label: 'Pass Rate', value: attempts.length > 0 ? `${Math.round((passCount / attempts.length) * 100)}%` : '—', icon: 'check_circle' },
          { label: 'Total Violations', value: attempts.reduce((s: number, a: any) => s + (a.violations?.length || 0), 0), icon: 'warning' },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>{stat.label}</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary-container)', fontSize: '1.25rem' }}>{stat.icon}</span>
            </div>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary-container)' }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Results Table */}
      {attempts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--on-secondary-container)', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)' }}>
          <p style={{ fontWeight: 600 }}>No submissions yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {attempts.map((a: any) => {
            const expanded = expandedAttempt === a._id;
            return (
              <div key={a._id} style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: '0 4px 16px rgba(30,58,138,0.04)' }}>
                <button onClick={() => setExpandedAttempt(expanded ? null : a._id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'var(--secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--on-primary-container)', fontSize: '0.875rem', flexShrink: 0 }}>
                    {(a.userId?.name || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{a.userId?.name || 'Unknown'}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--on-secondary-container)' }}>{a.userId?.email || ''}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 900, color: 'var(--primary-container)', fontSize: '1.125rem' }}>{a.percentage ?? 0}%</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--on-secondary-container)' }}>{a.score}/{a.totalMarks}</p>
                    </div>
                    <span className={`badge ${a.passed ? 'badge-success' : 'badge-danger'}`}>{a.passed ? 'Pass' : 'Fail'}</span>
                    {(a.violations?.length || 0) > 0 && (
                      <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.75rem' }}>warning</span>
                        {a.violations.length}
                      </span>
                    )}
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--outline)', transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>expand_more</span>
                  </div>
                </button>
                {expanded && (
                  <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                      <div><span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>Started</span><p style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: '0.875rem' }}>{a.startedAt ? new Date(a.startedAt).toLocaleString() : '—'}</p></div>
                      <div><span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>Submitted</span><p style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: '0.875rem' }}>{a.submittedAt ? new Date(a.submittedAt).toLocaleString() : '—'}</p></div>
                      <div><span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>Violations</span><p style={{ fontWeight: 600, color: (a.violations?.length || 0) > 0 ? 'var(--error)' : 'var(--on-surface)', fontSize: '0.875rem' }}>{a.violations?.length || 0} ({a.violations?.map((v: any) => v.type).join(', ') || 'none'})</p></div>
                    </div>
                    {a.responses?.length > 0 && (
                      <div>
                        <p className="label-xs" style={{ color: 'var(--on-secondary-container)', marginBottom: '0.5rem' }}>Response Summary ({a.responses.length} answers)</p>
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                          {a.responses.map((_: any, i: number) => (
                            <div key={i} style={{ width: '1.5rem', height: '1.5rem', borderRadius: '4px', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700 }}>{i + 1}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
