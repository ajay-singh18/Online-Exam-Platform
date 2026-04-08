import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getExams } from '../api/examApi';
import { getExamAttempts, getMissedStudents } from '../api/attemptApi';
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

  /* Missed students state */
  const [showMissed, setShowMissed] = useState(false);
  const [missedData, setMissedData] = useState<any>(null);
  const [loadingMissed, setLoadingMissed] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await getExams();
        const all = data.exams || data || [];
        setExams(all);
        if (all.length > 0 && !selectedExamId) setSelectedExamId(all[0]._id);
      } catch { addToast('Failed to load exams', 'error'); }
      finally { setLoading(false); }
    };
    init();
  }, [addToast, selectedExamId]);

  const fetchData = useCallback(async (id: string) => {
    setLoadingAttempts(true);
    setLoadingMissed(true);
    try {
      const [attemptRes, missedRes] = await Promise.all([
        getExamAttempts(id),
        getMissedStudents(id)
      ]);
      setAttempts(attemptRes.data.attempts || attemptRes.data || []);
      setMissedData(missedRes.data);
    } catch { 
      setAttempts([]);
      setMissedData(null);
    } finally { 
      setLoadingAttempts(false);
      setLoadingMissed(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    setShowMissed(false);
    fetchData(selectedExamId);
  }, [selectedExamId, fetchData]);

  const toggleMissed = () => {
    setShowMissed(!showMissed);
  };

  if (loading) return <LoadingSpinner message="Loading results..." />;

  const filteredAttempts = attempts.filter((a: any) =>
    !search || a.userId?.name?.toLowerCase().includes(search.toLowerCase()) || a.userId?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const missedCount = missedData?.missed?.length ?? 0;

  return (
    <div style={{ padding: '2rem', maxWidth: '72rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)' }}>Student Results</h2>
          <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500 }}>Browse and search student submissions</p>
        </div>
      </div>

      {/* Filters & Action */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="ghost-input" value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} style={{ borderRadius: 'var(--radius-sm)', width: 'auto', minWidth: '14rem', paddingLeft: '1rem' }}>
          {exams.map((e: any) => <option key={e._id} value={e._id}>{e.title}</option>)}
        </select>
        <div style={{ position: 'relative', flex: 1, minWidth: '16rem' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.25rem' }}>search</span>
          <input className="ghost-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by student name or email..." style={{ borderRadius: 'var(--radius-sm)' }} />
        </div>
        <button
          className={showMissed ? "btn-primary" : "btn-secondary"}
          onClick={toggleMissed}
          disabled={loadingMissed || !selectedExamId}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            height: '42px', 
            whiteSpace: 'nowrap',
            borderColor: missedCount > 0 ? 'var(--error)' : undefined,
            color: (missedCount > 0 && !showMissed) ? 'var(--error)' : undefined
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
            {showMissed ? 'visibility_off' : 'person_off'}
          </span>
          {loadingMissed ? '...' : (
            <>
              {showMissed ? 'Hide Missed' : 'Missed'}
              <span style={{ 
                background: showMissed ? 'rgba(255,255,255,0.2)' : 'var(--error-container)', 
                color: showMissed ? 'white' : 'var(--error)',
                padding: '0.125rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 900,
                marginLeft: '0.25rem'
              }}>
                {missedCount}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Missed Students Panel */}
      {showMissed && missedData && (
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(30,58,138,0.05)', border: '1px solid var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--surface-container-high)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontWeight: 800, color: 'var(--error)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>person_off</span>
                Missed Students
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--on-secondary-container)', marginTop: '0.25rem' }}>
                {missedData.missed.length} of {missedData.totalEnrolled} enrolled students did not submit
              </p>
            </div>
            <button className="btn-ghost" onClick={() => setShowMissed(false)} style={{ padding: '0.25rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>close</span>
            </button>
          </div>
          {missedData.missed.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--on-secondary-container)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem', color: 'var(--primary-container)' }}>check_circle</span>
              <p style={{ fontWeight: 600 }}>All enrolled students have submitted! 🎉</p>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Batch</th>
                  </tr>
                </thead>
                <tbody>
                  {missedData.missed.map((s: any, i: number) => (
                    <tr key={s._id}>
                      <td style={{ color: 'var(--on-secondary-container)', fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{s.name}</td>
                      <td style={{ color: 'var(--on-secondary-container)', fontSize: '0.875rem' }}>{s.email}</td>
                      <td style={{ color: 'var(--on-secondary-container)', fontSize: '0.875rem' }}>{s.batchNames || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
                <th>Batch</th>
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
                  <td style={{ color: 'var(--on-secondary-container)', fontSize: '0.875rem' }}>{a.userId?.batchNames || '—'}</td>
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
                  <td style={{ fontSize: '0.875rem', color: 'var(--on-secondary-container)' }}>{a.submittedAt ? new Date(a.submittedAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
