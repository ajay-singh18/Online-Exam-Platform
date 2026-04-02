import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEnrolledStudents, enrolStudents, getExams } from '../api/examApi';
import { useToastStore } from '../store/toastStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ExamStudents() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const addToast = useToastStore((s: any) => s.addToast);

  const [exam, setExam] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollEmail, setEnrollEmail] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examRes, studentRes] = await Promise.all([
          getExams(),
          getEnrolledStudents(examId),
        ]);
        const allExams = examRes.data.exams || examRes.data || [];
        setExam(allExams.find((e: any) => e._id === examId));
        setStudents(studentRes.data.students || studentRes.data || []);
      } catch { addToast('Failed to load data', 'error'); }
      finally { setLoading(false); }
    };
    if (examId) fetchData();
  }, [examId]);

  const handleEnrol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollEmail.trim()) return;
    setEnrolling(true);
    try {
      const emails = enrollEmail.split(',').map(s => s.trim()).filter(Boolean);
      await enrolStudents(examId, { emails });
      addToast(`Enrolled ${emails.length} student(s)`, 'success');
      setEnrollEmail('');
      // Refresh
      const { data } = await getEnrolledStudents(examId);
      setStudents(data.students || data || []);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Enrolment failed', 'error');
    } finally { setEnrolling(false); }
  };

  if (loading) return <LoadingSpinner message="Loading students..." />;

  return (
    <div style={{ padding: '2rem', maxWidth: '64rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)' }}>
            Enrolled Students
          </h2>
          <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500 }}>
            {exam?.title || 'Exam'} — {students.length} student{students.length !== 1 ? 's' : ''} enrolled
          </p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/admin')}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span>
          Back
        </button>
      </div>

      {/* Enroll All Banner */}
      {exam?.enrollAll && (
        <div style={{
          padding: '1rem 1.5rem', borderRadius: 'var(--radius-xl)',
          background: 'rgba(78,222,163,0.08)', border: '2px solid rgba(78,222,163,0.25)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: 'var(--on-tertiary-container)' }}>group_add</span>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--on-surface)', fontSize: '0.9375rem' }}>
              ✓ Open to all students
            </p>
            <p style={{ fontWeight: 500, color: 'var(--on-secondary-container)', fontSize: '0.8125rem' }}>
              This exam is available to all registered students in your institute. You can still add students individually below for tracking.
            </p>
          </div>
        </div>
      )}

      {/* Enrol Form */}
      <form onSubmit={handleEnrol} style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '16rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label className="label-xs" style={{ color: 'var(--secondary)' }}>Enrol Students by Email</label>
          <input className="ghost-input" value={enrollEmail} onChange={(e) => setEnrollEmail(e.target.value)} placeholder="student1@uni.edu, student2@uni.edu" style={{ borderRadius: 'var(--radius-sm)' }} />
          <div className="input-underline" />
        </div>
        <button type="submit" className="btn-primary" disabled={enrolling}>
          {enrolling ? 'Enrolling...' : 'Enrol Students'}
        </button>
      </form>

      {/* Student List */}
      {students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--on-secondary-container)', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.4, display: 'block', marginBottom: '1rem' }}>group</span>
          <p style={{ fontWeight: 600 }}>No students enrolled yet.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any, i: number) => (
                <tr key={s._id || i}>
                  <td style={{ color: 'var(--on-secondary-container)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{s.name || '—'}</td>
                  <td style={{ color: 'var(--on-secondary-container)' }}>{s.email || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${s.isVerified ? 'badge-success' : 'badge-info'}`}>
                      {s.isVerified ? 'Verified' : 'Pending'}
                    </span>
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
