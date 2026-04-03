import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExams, deleteExam } from '../api/examApi';
import { useToastStore } from '../store/toastStore';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';

export default function AdminExams() {
  const navigate = useNavigate();
  const addToast = useToastStore((s: any) => s.addToast);

  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const fetchExams = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await getExams(params);
      setExams(data.exams || data || []);
    } catch { /* interceptor handles */ }
    finally { setLoading(false); }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchExams();
  }, [debouncedSearch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteExam(deleteTarget);
      setExams(prev => prev.filter(e => e._id !== deleteTarget));
      addToast('Exam deleted', 'success');
    } catch { addToast('Delete failed', 'error'); }
    finally { setDeleteTarget(null); }
  };

  // Server-side filtering is now used via debouncedSearch state
  const displayedExams = exams;

  if (loading) return <LoadingSpinner message="Loading exams..." />;

  return (
    <div style={{ padding: '2rem', maxWidth: '80rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)', letterSpacing: '-0.025em' }}>
            Exams
          </h2>
          <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500, marginTop: '0.25rem' }}>
            Manage all your exams — create, edit, view students and results.
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/admin/exams/new')}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
          Create Exam
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '24rem' }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.25rem' }}>search</span>
        <input
          className="ghost-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exams by title or description..."
          style={{ borderRadius: 'var(--radius-sm)', paddingLeft: '3rem', width: '100%' }}
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: 'var(--outline)', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>close</span>
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Exams', value: exams.length, icon: 'assignment' },
          { label: 'Total Questions', value: exams.reduce((acc: number, e: any) => acc + (e.questions?.length || 0), 0), icon: 'quiz' },
          { label: 'Total Students', value: new Set(exams.flatMap((e: any) => e.allowedStudents || [])).size, icon: 'group' },
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

      {/* Exams Table */}
      {displayedExams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--on-secondary-container)', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--outline-variant)', display: 'block', marginBottom: '1rem' }}>search_off</span>
          <p style={{ fontWeight: 600 }}>
            {exams.length === 0 ? 'No exams created yet. Click "Create Exam" to get started.' : 'No exams match your search.'}
          </p>
        </div>
      ) : (
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Exam Title</th>
                <th>Duration</th>
                <th>Questions</th>
                <th>Students</th>
                <th>Pass Mark</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedExams.map((exam: any) => (
                <tr key={exam._id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary-container)' }}>{exam.title}</td>
                  <td>{exam.durationMins} min</td>
                  <td>{exam.questions?.length || 0}</td>
                  <td>{exam.allowedStudents?.length || 0}</td>
                  <td>{exam.passMark}%</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn-ghost" onClick={() => navigate(`/admin/exams/${exam._id}/edit`)}>Edit</button>
                      <button className="btn-ghost" onClick={() => navigate(`/admin/exams/${exam._id}/students`)}>Students</button>
                      <button className="btn-ghost" onClick={() => navigate(`/admin/exams/${exam._id}/results`)}>Results</button>
                      <button className="btn-ghost" onClick={() => navigate(`/admin/analytics/${exam._id}`)}>Analytics</button>
                      <button className="btn-ghost" style={{ color: 'var(--error)' }} onClick={() => setDeleteTarget(exam._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Exam"
        message="Are you sure? This will permanently delete this exam and all associated data."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
