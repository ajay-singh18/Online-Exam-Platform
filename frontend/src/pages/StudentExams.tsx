import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExams } from '../api/examApi';
import { getMyAttempts } from '../api/attemptApi';
import LoadingSpinner from '../components/LoadingSpinner';

/* ── helpers ── */
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
const fmtDateTime = (d: string) => `${fmtDate(d)}, ${fmtTime(d)}`;

type ExamStatus = 'live' | 'upcoming' | 'ended' | 'missed' | 'open' | 'in_progress';

function getExamStatus(exam: any, now: Date, isCompleted: boolean, hasInProgress: boolean): ExamStatus {
  if (hasInProgress) return 'in_progress';
  const start = exam.startAt ? new Date(exam.startAt) : null;
  const end = exam.endAt ? new Date(exam.endAt) : null;

  if (end && now > end && !isCompleted) return 'missed';
  if (end && now > end) return 'ended';
  if (start && now < start) return 'upcoming';
  if (start && end && now >= start && now <= end) return 'live';
  if (start && !end && now >= start) return 'live';
  return 'open';
}

const statusConfig: Record<ExamStatus, { label: string; badge: string; canEnter: boolean }> = {
  live:        { label: '● Live Now',    badge: 'badge-success', canEnter: true },
  open:        { label: 'Open',          badge: 'badge-info',    canEnter: true },
  in_progress: { label: '● In Progress', badge: 'badge-success', canEnter: true },
  upcoming:    { label: 'Upcoming',      badge: 'badge-info',    canEnter: false },
  ended:       { label: 'Ended',         badge: 'badge-danger',  canEnter: false },
  missed:      { label: 'Missed',        badge: 'badge-danger',  canEnter: false },
};

/* ── Tab Filter ── */
type TabKey = 'all' | 'live' | 'upcoming' | 'ended';
const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All Exams' },
  { key: 'live', label: 'Live / Open' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ended', label: 'Ended / Missed' },
];

export default function StudentExams() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examRes, attemptRes] = await Promise.all([getExams(), getMyAttempts()]);
        setExams(examRes.data.exams || examRes.data || []);
        setAttempts(attemptRes.data.attempts || attemptRes.data || []);
      } catch { /* interceptor handles */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading exams..." />;

  const now = new Date();
  const completedAttempts = attempts.filter((a: any) => a.submittedAt);
  const completedExamIds = new Set(completedAttempts.map((a: any) => a.examId?._id));

  // Build exam entries with status
  const examEntries = exams.map((exam: any) => {
    const isCompleted = completedExamIds.has(exam._id);
    const hasInProgress = !!attempts.find((a: any) => a.examId?._id === exam._id && !a.submittedAt);
    const status = getExamStatus(exam, now, isCompleted, hasInProgress);
    return { exam, status, isCompleted, hasInProgress };
  });

  // Filter by tab
  const filtered = examEntries.filter(({ status }) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'live') return status === 'live' || status === 'open' || status === 'in_progress';
    if (activeTab === 'upcoming') return status === 'upcoming';
    if (activeTab === 'ended') return status === 'ended' || status === 'missed';
    return true;
  });

  // Stats
  const liveCount = examEntries.filter(e => e.status === 'live' || e.status === 'open' || e.status === 'in_progress').length;
  const upcomingCount = examEntries.filter(e => e.status === 'upcoming').length;
  const avgScore = completedAttempts.length > 0
    ? Math.round(completedAttempts.reduce((s: number, a: any) => s + (a.percentage || 0), 0) / completedAttempts.length) + '%'
    : '—';

  return (
    <div style={{ padding: '2rem', maxWidth: '80rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)', letterSpacing: '-0.025em' }}>
          My Exams
        </h2>
        <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500, marginTop: '0.25rem' }}>
          View all assigned exams with their schedules and status.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Live / Open', value: liveCount, icon: 'play_circle' },
          { label: 'Upcoming', value: upcomingCount, icon: 'schedule' },
          { label: 'Completed', value: completedAttempts.length, icon: 'task_alt' },
          { label: 'Avg Score', value: avgScore, icon: 'trending_up' },
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-full)', padding: '0.25rem', width: 'fit-content' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-full)', border: 'none',
              background: activeTab === tab.key ? 'var(--primary-container)' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--on-surface)',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Exam Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', color: 'var(--on-secondary-container)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem', opacity: 0.4 }}>assignment_turned_in</span>
          <p style={{ fontWeight: 600 }}>No exams match this filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filtered.map(({ exam, status, isCompleted, hasInProgress }) => {
            const cfg = statusConfig[status];

            return (
              <div key={exam._id} className="featured-card" style={{
                padding: '2rem', minHeight: '12rem',
                opacity: (status === 'missed' || status === 'ended') ? 0.65 : 1,
              }}>
                <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
                  {/* Status badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                    {isCompleted && <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>✓ Completed</span>}
                    {exam.fullscreenRequired && (
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '0.6rem' }}>Proctored</span>
                    )}
                  </div>

                  <h4 style={{ fontSize: '1.25rem', fontWeight: 900 }}>{exam.title}</h4>
                  <p style={{ color: 'var(--primary-fixed-dim)', fontSize: '0.8125rem', flex: 1 }}>{exam.description || 'No description'}</p>

                  {/* Exam meta */}
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8125rem', fontWeight: 600 }}>
                    <span>⏱ {exam.durationMins} min</span>
                    <span>📝 {exam.questionCount ?? exam.questions?.length ?? 0} Qs</span>
                    <span>✅ Pass: {exam.passMark}%</span>
                  </div>

                  {/* Schedule */}
                  {(exam.startAt || exam.endAt) && (
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: '0.25rem',
                      fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)',
                      background: 'rgba(255,255,255,0.08)', padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-lg)',
                    }}>
                      {exam.startAt && <span>📅 Start: {fmtDateTime(exam.startAt)}</span>}
                      {exam.endAt && <span>🏁 End: {fmtDateTime(exam.endAt)}</span>}
                    </div>
                  )}

                  {/* Action */}
                  {!isCompleted ? (
                    <button
                      onClick={() => navigate(`/exam/lobby/${exam._id}`)}
                      disabled={!cfg.canEnter}
                      style={{
                        background: cfg.canEnter ? 'var(--surface)' : 'rgba(255,255,255,0.1)',
                        color: cfg.canEnter ? 'var(--primary-container)' : 'rgba(255,255,255,0.5)',
                        padding: '0.75rem 2rem', borderRadius: 'var(--radius-lg)',
                        fontWeight: 900, fontSize: '0.8125rem', textTransform: 'uppercase',
                        letterSpacing: '0.05em', border: 'none',
                        cursor: cfg.canEnter ? 'pointer' : 'not-allowed',
                        transition: 'transform 0.15s', alignSelf: 'flex-start', marginTop: '0.25rem',
                      }}
                      onMouseEnter={(e) => cfg.canEnter && (e.currentTarget.style.transform = 'scale(1.03)')}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {hasInProgress ? 'Resume Exam' :
                       status === 'upcoming' ? 'Not Yet Open' :
                       status === 'missed' ? 'Missed' :
                       status === 'ended' ? 'Ended' :
                       'Enter Exam'}
                    </button>
                  ) : (
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        const a = completedAttempts.find((a: any) => a.examId?._id === exam._id);
                        if (a) navigate(`/student/results/${a._id}`);
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.1)', color: 'white',
                        padding: '0.75rem 2rem', borderRadius: 'var(--radius-lg)',
                        fontWeight: 900, fontSize: '0.8125rem', textTransform: 'uppercase',
                        letterSpacing: '0.05em', border: 'none', cursor: 'pointer',
                        alignSelf: 'flex-start', marginTop: '0.25rem',
                      }}
                    >
                      View Result
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
