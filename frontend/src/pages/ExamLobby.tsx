import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getExamById } from '../api/examApi';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToastStore } from '../store/toastStore';

export default function ExamLobby() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const addToast = useToastStore((s: any) => s.addToast);

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState({ browser: false, fullscreen: false, agreement: false });

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data } = await getExamById(examId);
        const found = data.exam || data;
        if (!found) {
          addToast('Exam not found', 'error');
          navigate('/student');
          return;
        }
        setExam(found);
      } catch {
        addToast('Failed to load exam details', 'error');
        navigate('/student');
      } finally { setLoading(false); }
    };
    if (examId) fetchExam();
  }, [examId]);

  const allChecked = checks.browser && checks.fullscreen && checks.agreement;

  const handleStartExam = () => {
    if (!allChecked) {
      addToast('Please complete all system checks', 'warning');
      return;
    }
    navigate(`/exam/take/${examId}`);
  };

  if (loading) return <LoadingSpinner message="Loading exam instructions..." />;
  if (!exam) return null;

  const rules = [
    { icon: 'timer', text: `Duration: ${exam.durationMins} minutes. Timer starts when you begin.` },
    { icon: 'quiz', text: `${exam.questionCount ?? exam.questions?.length ?? 0} questions in total.` },
    { icon: 'percent', text: `Pass mark: ${exam.passMark}%. Score is calculated automatically.` },
    ...(exam.fullscreenRequired ? [{ icon: 'fullscreen', text: 'Fullscreen mode is required. Exiting will be recorded as a violation.' }] : []),
    { icon: 'visibility_off', text: 'Tab switching is monitored. After 3 violations, exam auto-submits.' },
    { icon: 'save', text: 'Your answers are auto-saved every 30 seconds.' },
    { icon: 'block', text: 'Right-click and copy/paste are disabled during the exam.' },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--background)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
    }}>
      <div style={{ maxWidth: '44rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined filled" style={{ color: 'var(--primary-container)', fontSize: '2rem' }}>shield_lock</span>
            <span style={{ fontWeight: 900, color: 'var(--primary-container)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.875rem' }}>Proctored Assessment</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-container)', letterSpacing: '-0.035em' }}>
            {exam.title}
          </h1>
          {exam.description && (
            <p style={{ color: 'var(--on-secondary-container)', marginTop: '0.5rem', fontWeight: 500, maxWidth: '32rem', margin: '0.5rem auto 0' }}>
              {exam.description}
            </p>
          )}
        </div>

        {/* Rules */}
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-container)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>gavel</span>
            Exam Rules & Instructions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {rules.map((rule) => (
              <div key={rule.text} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--on-primary-container)', fontSize: '1.125rem', flexShrink: 0, marginTop: '0.125rem' }}>{rule.icon}</span>
                <span style={{ fontSize: '0.9375rem', color: 'var(--on-surface)', fontWeight: 500, lineHeight: 1.5 }}>{rule.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Checks */}
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-container)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>checklist</span>
            Pre-Exam Checklist
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { key: 'browser' as const, label: 'I am using a supported browser (Chrome / Edge / Firefox)' },
              { key: 'fullscreen' as const, label: 'I understand that fullscreen mode will be enforced' },
              { key: 'agreement' as const, label: 'I agree to follow all examination rules and integrity policies' },
            ].map(check => (
              <label key={check.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', background: checks[check.key] ? 'rgba(78,222,163,0.08)' : 'transparent', transition: 'background 0.15s' }}>
                <input
                  type="checkbox"
                  checked={checks[check.key]}
                  onChange={(e) => setChecks(prev => ({ ...prev, [check.key]: e.target.checked }))}
                  style={{ accentColor: 'var(--on-primary-container)', width: '1.125rem', height: '1.125rem', flexShrink: 0 }}
                />
                <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--on-surface)' }}>{check.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-secondary" onClick={() => navigate('/student')}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span>
            Back to Dashboard
          </button>
          <button
            className="btn-primary"
            onClick={handleStartExam}
            disabled={!allChecked}
            style={{ opacity: allChecked ? 1 : 0.5, padding: '0.875rem 2.5rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>play_arrow</span>
            Start Exam
          </button>
        </div>
      </div>
    </div>
  );
}
