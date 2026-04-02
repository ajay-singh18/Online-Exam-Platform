import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExams } from '../api/examApi';
import { getMyAttempts } from '../api/attemptApi';
import { getMe } from '../api/userApi';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';

/* ── helpers ── */
const fmtDate = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtTime = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};
const fmtDateTime = (d: string) => `${fmtDate(d)}, ${fmtTime(d)}`;

type ExamStatus = 'live' | 'upcoming' | 'ended' | 'missed' | 'open';

function getExamStatus(exam: any, now: Date, isCompleted: boolean): ExamStatus {
  const start = exam.startAt ? new Date(exam.startAt) : null;
  const end = exam.endAt ? new Date(exam.endAt) : null;

  if (end && now > end && !isCompleted) return 'missed';
  if (end && now > end) return 'ended';
  if (start && now < start) return 'upcoming';
  if (start && end && now >= start && now <= end) return 'live';
  if (start && !end && now >= start) return 'live';
  return 'open'; // no schedule set
}

const statusConfig: Record<ExamStatus, { label: string; badge: string; canEnter: boolean }> = {
  live:     { label: '● Live Now',  badge: 'badge-success', canEnter: true },
  open:     { label: 'Open',       badge: 'badge-info',    canEnter: true },
  upcoming: { label: 'Upcoming',   badge: 'badge-info',    canEnter: false },
  ended:    { label: 'Ended',      badge: 'badge-danger',  canEnter: false },
  missed:   { label: 'Missed',     badge: 'badge-danger',  canEnter: false },
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s: any) => s.user);

  const [exams, setExams] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [instituteName, setInstituteName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examRes, attemptRes, userRes] = await Promise.all([getExams(), getMyAttempts(), getMe()]);
        setExams(examRes.data.exams || examRes.data || []);
        setAttempts(attemptRes.data.attempts || attemptRes.data || []);
        if (userRes.data?.user?.instituteId?.name) {
          setInstituteName(userRes.data.user.instituteId.name);
        } else if (user?.instituteId?.name) {
          setInstituteName(user.instituteId.name);
        }
      } catch { /* toast handled by interceptor */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading your dashboard..." />;

  const now = new Date();

  // Categorize
  const completedAttempts = attempts.filter((a: any) => a.submittedAt);
  const completedExamIds = new Set(completedAttempts.map((a: any) => a.examId?._id));

  const upcoming = exams.filter((e: any) => !completedExamIds.has(e._id));
  const completed = completedAttempts;

  const stats = {
    examsCompleted: completed.length,
    averageScore: completed.length > 0 ? Math.round(completed.reduce((sum: number, a: any) => sum + (a.percentage || 0), 0) / completed.length) : 0,
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '80rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Greeting */}
      <section>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--primary-container)', letterSpacing: '-0.025em' }}>
          Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
        </h2>
        {instituteName && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.875rem', background: 'rgba(30,58,138,0.06)', borderRadius: 'var(--radius-full)', color: 'var(--primary)', marginTop: '0.5rem', fontWeight: 700, fontSize: '0.8125rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>domain</span>
            {instituteName}
          </div>
        )}
        <p style={{ color: 'var(--on-secondary-container)', marginTop: '0.5rem', fontWeight: 500 }}>
          You have {upcoming.filter((e: any) => { const s = getExamStatus(e, now, false); return s !== 'missed' && s !== 'ended'; }).length} exam{upcoming.length !== 1 ? 's' : ''} available.
        </p>
      </section>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>Exams Completed</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary-container)' }}>task_alt</span>
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-container)' }}>{stats.examsCompleted}</span>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>Average Score</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary-container)' }}>trending_up</span>
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-container)' }}>{stats.averageScore}<span style={{ fontSize: '1.25rem' }}>%</span></span>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>Available Exams</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary-container)' }}>assignment</span>
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-container)' }}>{upcoming.length}</span>
        </div>
      </div>

      {/* Upcoming / Available Exams */}
      {upcoming.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-container)' }}>Your Exams</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {upcoming.map((exam: any) => {
              const hasInProgress = attempts.find((a: any) => a.examId?._id === exam._id && !a.submittedAt);
              const status = hasInProgress ? 'live' as ExamStatus : getExamStatus(exam, now, false);
              const cfg = statusConfig[status];

              return (
                <div key={exam._id} className="featured-card" style={{ padding: '2rem', minHeight: '14rem', opacity: (status === 'missed' || status === 'ended') ? 0.7 : 1 }}>
                  <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
                    {/* Status badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={`badge ${cfg.badge}`}>
                        {hasInProgress ? '● In Progress' : cfg.label}
                      </span>
                      {exam.fullscreenRequired && (
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '0.6rem' }}>Proctored</span>
                      )}
                    </div>

                    <h4 style={{ fontSize: '1.375rem', fontWeight: 900 }}>{exam.title}</h4>
                    <p style={{ color: 'var(--primary-fixed-dim)', fontSize: '0.875rem', flex: 1 }}>{exam.description || 'No description'}</p>

                    {/* Exam meta */}
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.8125rem', fontWeight: 600 }}>
                      <span>⏱ {exam.durationMins} min</span>
                      <span>📝 {exam.questionCount ?? exam.questions?.length ?? 0} questions</span>
                      <span>✅ Pass: {exam.passMark}%</span>
                    </div>

                    {/* Schedule info */}
                    {(exam.startAt || exam.endAt) && (
                      <div style={{
                        display: 'flex', flexDirection: 'column', gap: '0.25rem',
                        fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)',
                        background: 'rgba(255,255,255,0.08)', padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-lg)', marginTop: '0.25rem',
                      }}>
                        {exam.startAt && (
                          <span>📅 Start: {fmtDateTime(exam.startAt)}</span>
                        )}
                        {exam.endAt && (
                          <span>🏁 End: {fmtDateTime(exam.endAt)}</span>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={() => navigate(`/exam/lobby/${exam._id}`)}
                      disabled={!cfg.canEnter && !hasInProgress}
                      style={{
                        background: (cfg.canEnter || hasInProgress) ? 'var(--surface)' : 'rgba(255,255,255,0.1)',
                        color: (cfg.canEnter || hasInProgress) ? 'var(--primary-container)' : 'rgba(255,255,255,0.5)',
                        padding: '0.75rem 2rem', borderRadius: 'var(--radius-lg)',
                        fontWeight: 900, fontSize: '0.8125rem', textTransform: 'uppercase',
                        letterSpacing: '0.05em', border: 'none',
                        cursor: (cfg.canEnter || hasInProgress) ? 'pointer' : 'not-allowed',
                        transition: 'transform 0.15s', alignSelf: 'flex-start', marginTop: '0.5rem',
                      }}
                      onMouseEnter={(e) => (cfg.canEnter || hasInProgress) && (e.currentTarget.style.transform = 'scale(1.03)')}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {hasInProgress ? 'Resume Exam' :
                       status === 'upcoming' ? 'Not Yet Open' :
                       status === 'missed' ? 'Missed' :
                       status === 'ended' ? 'Ended' :
                       'Enter Exam'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Completed Exams */}
      {completed.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-container)' }}>Completed Exams</h3>
          <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Submitted</th>
                  <th style={{ textAlign: 'center' }}>Score</th>
                  <th style={{ textAlign: 'center' }}>Result</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((attempt: any) => (
                  <tr key={attempt._id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary-container)' }}>
                      {attempt.examId?.title || 'Exam'}
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--on-secondary-container)' }}>
                      {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 900, color: 'var(--primary-container)' }}>
                      {attempt.score ?? '—'} / {attempt.totalMarks ?? '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${attempt.passed ? 'badge-success' : 'badge-danger'}`}>
                        {attempt.percentage != null ? `${attempt.percentage}%` : '—'} {attempt.passed ? '✓' : '✗'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-ghost" onClick={() => navigate(`/student/results/${attempt._id}`)}>
                        View Result
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {exams.length === 0 && completed.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-secondary-container)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', opacity: 0.4 }}>quiz</span>
          <p style={{ fontWeight: 600 }}>No exams assigned yet. Contact your institute administrator.</p>
        </div>
      )}
    </div>
  );
}
