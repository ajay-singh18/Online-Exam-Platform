import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getExams } from '../api/examApi';
import { getExamAttempts } from '../api/attemptApi';
import { useToastStore } from '../store/toastStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminResults() {
  const { examId } = useParams();
  const addToast = useToastStore((s: any) => s.addToast);

  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState(examId || '');
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await getExams();
        const all = data.exams || data || [];
        setExams(all);
        if (all.length > 0) setSelectedExamId(all[0]._id);
      } catch { addToast('Failed to load exams', 'error'); }
      finally { setLoading(false); }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    const fetchAttempts = async () => {
      setLoadingAttempts(true);
      try {
        const { data } = await getExamAttempts(selectedExamId);
        setAttempts(data.attempts || data || []);
      } catch { setAttempts([]); }
      finally { setLoadingAttempts(false); }
    };
    fetchAttempts();
  }, [selectedExamId]);

  if (loading) return <LoadingSpinner message="Loading results..." />;

  const filteredAttempts = attempts.filter((a: any) =>
    !search || a.userId?.name?.toLowerCase().includes(search.toLowerCase()) || a.userId?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '72rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)' }}>Student Results</h2>
        <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500 }}>Browse and search student submissions</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <select className="ghost-input" value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} style={{ borderRadius: 'var(--radius-sm)', width: 'auto', minWidth: '14rem', paddingLeft: '1rem' }}>
          {exams.map((e: any) => <option key={e._id} value={e._id}>{e.title}</option>)}
        </select>
        <div style={{ position: 'relative', flex: 1, minWidth: '16rem' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.25rem' }}>search</span>
          <input className="ghost-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by student name or email..." style={{ borderRadius: 'var(--radius-sm)' }} />
        </div>
      </div>

      {/* Results Table */}
      {loadingAttempts ? <LoadingSpinner /> : filteredAttempts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--on-secondary-container)', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)' }}>
          <p style={{ fontWeight: 600 }}>No submissions found.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th style={{ textAlign: 'center' }}>Score</th>
                <th style={{ textAlign: 'center' }}>Percentage</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Violations</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttempts.map((a: any) => (
                <tr key={a._id}>
                  <td style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{a.userId?.name || '—'}</td>
                  <td style={{ color: 'var(--on-secondary-container)', fontSize: '0.875rem' }}>{a.userId?.email || '—'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 900, color: 'var(--primary-container)' }}>{a.score ?? '—'}/{a.totalMarks ?? '—'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{a.percentage ?? 0}%</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${a.passed ? 'badge-success' : 'badge-danger'}`}>{a.passed ? 'Pass' : 'Fail'}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {(a.violations?.length || 0) > 0 ? (
                      <span className="badge badge-danger">{a.violations.length}</span>
                    ) : (
                      <span style={{ color: 'var(--on-secondary-container)', fontSize: '0.875rem' }}>0</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--on-secondary-container)' }}>{a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
