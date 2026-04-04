import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExams, deleteExam } from '../api/examApi';
import { getQuestions } from '../api/questionApi';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s: any) => s.user);
  const addToast = useToastStore((s: any) => s.addToast);

  const [exams, setExams] = useState<any[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examRes, qRes] = await Promise.all([getExams(), getQuestions({})]);
        setExams(examRes.data.exams || examRes.data || []);
        const qData = qRes.data.questions || qRes.data || [];
        setQuestionCount(Array.isArray(qData) ? qData.length : 0);
      } catch { /* interceptor handles */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteExam(deleteTarget);
      setExams(prev => prev.filter(e => e._id !== deleteTarget));
      addToast('Exam deleted', 'success');
    } catch { addToast('Delete failed', 'error'); }
    finally { setDeleteTarget(null); }
  };

  if (loading) return <LoadingSpinner message="Loading admin dashboard..." />;

  const totalStudents = new Set(exams.flatMap((e: any) => e.allowedStudents || [])).size;

  const quickActions = [
    { icon: 'add_circle', label: 'Create Exam', desc: 'Build a new examination', action: () => navigate('/admin/exams/new') },
    { icon: 'quiz', label: 'Question Bank', desc: 'Manage questions', action: () => navigate('/admin/questions') },
    { icon: 'analytics', label: 'Analytics', desc: 'View performance data', action: () => navigate('/admin/analytics') },
    { icon: 'group', label: 'Results', desc: 'Student submissions', action: () => navigate('/admin/results') },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '80rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header */}
      <section className="flex-center-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="text-center-mobile flex-center-mobile">
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--primary-container)', letterSpacing: '-0.025em' }}>
            Admin Dashboard
          </h2>
          <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500, marginTop: '0.25rem' }}>
            Welcome, {user?.name || 'Administrator'}. Manage your institute's exams and students.
          </p>
        </div>
        {user?.instituteId && (
          <div style={{ background: 'var(--surface-container-low)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-container-high)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span className="label-xs" style={{ color: 'var(--secondary)' }}>Your Institute ID (Share with Students)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <code style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--on-surface)', userSelect: 'all' }}>{user.instituteId._id || user.instituteId}</code>
              <button 
                onClick={() => { navigator.clipboard.writeText(user.instituteId._id || user.instituteId); addToast('Institute ID copied!', 'success'); }}
                className="btn-ghost" style={{ padding: '0.25rem', display: 'flex' }} title="Copy Institute ID"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>content_copy</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        {[
          { label: 'Total Exams', value: exams.length, icon: 'assignment' },
          { label: 'Questions', value: questionCount, icon: 'quiz' },
          { label: 'Enrolled Students', value: totalStudents, icon: 'group' },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>{stat.label}</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary-container)' }}>{stat.icon}</span>
            </div>
            <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-container)' }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <section>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-container)', marginBottom: '1rem' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {quickActions.map(action => (
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
              <span style={{ fontSize: '0.75rem', color: 'var(--on-secondary-container)' }}>{action.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Exams Table */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-container)' }}>Your Exams</h3>
          <button className="btn-primary" onClick={() => navigate('/admin/exams/new')}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
            Create Exam
          </button>
        </div>
        {exams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--on-secondary-container)', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)' }}>
            <p style={{ fontWeight: 600 }}>No exams created yet. Click "Create Exam" to get started.</p>
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
                {exams.map((exam: any) => (
                  <tr key={exam._id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary-container)' }}>{exam.title}</td>
                    <td>{exam.durationMins} min</td>
                    <td>{exam.questions?.length || 0}</td>
                    <td>{exam.allowedStudents?.length || 0}</td>
                    <td>{exam.passMark}%</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
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
      </section>

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
