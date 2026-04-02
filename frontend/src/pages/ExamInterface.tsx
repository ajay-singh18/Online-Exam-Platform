import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useExamStore } from '../store/examStore';
import { useToastStore } from '../store/toastStore';
import { useProctoring } from '../hooks/useProctoring';
import { useAutosave } from '../hooks/useAutosave';
import { startAttempt, submitAttempt } from '../api/attemptApi';
import QuestionCard from '../components/QuestionCard';

export default function ExamInterface() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const addToast = useToastStore((s: any) => s.addToast);

  const {
    attempt, questions, responses, currentIndex,
    flagged, violations, 
    setExamData, resumeExamData, setCurrentIndex,
    selectOption, toggleFlag, resetExam,
  } = useExamStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showViolationOverlay, setShowViolationOverlay] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalDurationSecs, setTotalDurationSecs] = useState(0);

  /* Initialize Exam */
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await startAttempt(examId);
        if (data.resumed) {
          resumeExamData(null, data.attempt, data.questions, data.remainingSeconds);
        } else {
          setExamData(null, data.attempt, data.questions, data.remainingSeconds);
        }
        setTimeLeft(data.remainingSeconds);
        setTotalDurationSecs(data.remainingSeconds);
        setExamStarted(true);
      } catch (error: any) {
        addToast(error.response?.data?.message || 'Failed to open exam', 'error');
        navigate('/student');
      } finally {
        setLoading(false);
      }
    };
    if (examId) init();
    return () => resetExam();
  }, [examId]);

  /* Proctoring Logic */
  const { requestFullscreen, shouldForceSubmit, violationCount } = useProctoring(examStarted);

  useEffect(() => {
    if (violations.length > 0) setShowViolationOverlay(true);
  }, [violations.length]);

  const handleSubmit = useCallback(async (forced = false) => {
    if (submitting || !attempt?._id) return;
    setSubmitting(true);
    try {
      await submitAttempt(attempt._id, { responses, violations });
      addToast(forced ? 'Exam auto-submitted' : 'Exam submitted successfully!', forced ? 'warning' : 'success');
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      resetExam();
      navigate(`/student/results/${attempt._id}`);
    } catch {
      addToast('Failed to submit. Please try again.', 'error');
      setSubmitting(false);
    }
  }, [submitting, attempt, responses, violations]);

  useEffect(() => {
    if (shouldForceSubmit && attempt?._id) handleSubmit(true);
  }, [shouldForceSubmit, attempt?._id, handleSubmit]);

  /* Timer Logic */
  useEffect(() => {
    if (!examStarted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examStarted, handleSubmit]);

  const formatTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  useAutosave();

  if (loading || !attempt || questions.length === 0) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: 'var(--background)', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: 'var(--primary-container)' }}>Securely Loading Exam Environment...</h2>
      </div>
    );
  }

  const q = questions[currentIndex];
  const resp = responses[currentIndex];

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--background)', overflow: 'hidden' }}>
      {/* Question Sidebar (The Map) */}
      <div style={{ width: '18rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1.5rem', borderRight: '1px solid rgba(226,231,255,0.3)' }}>
        <div>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--primary-container)', letterSpacing: '-0.025em' }}>{attempt.examId?.title || 'Academic Assessment'}</h2>
          <p className="label-xs" style={{ color: 'var(--on-secondary-container)', marginTop: '0.25rem' }}>Proctored Session</p>
        </div>

        {/* Timer (Glass) */}
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-xl)', textAlign: 'center', boxShadow: 'var(--shadow-glass)' }}>
          <span className="label-xs" style={{ color: 'var(--secondary)' }}>Time Remaining</span>
          <p style={{ fontSize: '1.75rem', fontWeight: 900, color: timeLeft < 300 ? 'var(--error)' : 'var(--primary-container)', marginTop: '0.25rem', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(timeLeft)}
          </p>
          {/* Progress Bar */}
          <div style={{ height: '3px', background: 'var(--surface-variant)', borderRadius: 'var(--radius-full)', marginTop: '0.75rem', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--auth-gradient)', borderRadius: 'var(--radius-full)', width: `${totalDurationSecs > 0 ? ((1 - timeLeft / totalDurationSecs) * 100) : 0}%`, transition: 'width 1s linear' }} />
          </div>
        </div>

        {/* Question Navigator Grid */}
        <div>
          <span className="label-xs" style={{ color: 'var(--on-secondary-container)', display: 'block', marginBottom: '0.75rem' }}>Question Navigator</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.375rem' }}>
            {questions.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                style={{
                  width: '2.25rem', height: '2.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none', cursor: 'pointer',
                  fontWeight: 800, fontSize: '0.75rem',
                  transition: 'all 0.15s',
                  background: currentIndex === i ? 'var(--primary-container)' :
                    flagged.has(i) ? '#F59E0B' :
                    responses[i]?.selectedOptions?.length > 0 ? 'var(--tertiary-container)' : 'var(--surface-container-highest)',
                  color: currentIndex === i || responses[i]?.selectedOptions?.length > 0 || flagged.has(i) ? 'white' : 'var(--on-surface)',
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '2px', background: 'var(--tertiary-container)' }} />
              <span style={{ fontSize: '0.625rem', color: 'var(--on-secondary-container)', fontWeight: 600 }}>Answered</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '2px', background: '#F59E0B' }} />
              <span style={{ fontSize: '0.625rem', color: 'var(--on-secondary-container)', fontWeight: 600 }}>Flagged</span>
            </div>
          </div>
        </div>

        {/* Proctoring Status */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="animate-pulse" style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#ef4444' }} />
            <span className="label-xs" style={{ color: 'var(--error)' }}>Proctoring Active</span>
          </div>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleSubmit(false)}>
            Submit Exam
          </button>
        </div>
      </div>

      {/* Main Question Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid rgba(226,231,255,0.3)' }}>
          <span style={{ fontWeight: 700, color: 'var(--primary-container)' }}>Question {currentIndex + 1} of {questions.length}</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => toggleFlag(currentIndex)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: flagged.has(currentIndex) ? '#FEF3C7' : 'var(--surface-container-low)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', color: flagged.has(currentIndex) ? '#92400E' : 'var(--secondary)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>flag</span>
              {flagged.has(currentIndex) ? 'Flagged' : 'Flag'}
            </button>
          </div>
        </div>

        {/* Question Content */}
        <div style={{ flex: 1, padding: '3rem', maxWidth: '48rem' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <QuestionCard html={q.text} imageUrl={q.imageUrl} />
          </div>

          {q.type === 'mcq' || q.type === 'msq' || q.type === 'tf' || q.type === 'truefalse' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {q.options.map((option: any, i: number) => {
                const isSelected = resp?.selectedOptions?.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => selectOption(currentIndex, i, q.type === 'msq')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '1.25rem 1.5rem',
                      background: isSelected ? 'var(--secondary-container)' : 'var(--surface-container-low)',
                      border: 'none', borderRadius: 'var(--radius-xl)',
                      cursor: 'pointer', fontWeight: 600, fontSize: '0.9375rem',
                      color: 'var(--on-surface)', textAlign: 'left',
                      transition: 'all 0.15s',
                      boxShadow: isSelected ? '0 0 0 2px var(--on-primary-container)' : 'none',
                    }}
                  >
                    <span style={{
                      width: '2rem', height: '2rem', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isSelected ? 'var(--primary-container)' : 'var(--surface-container-high)',
                      color: isSelected ? 'white' : 'var(--on-surface)',
                      fontWeight: 800, fontSize: '0.75rem', flexShrink: 0,
                    }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {option.text}
                  </button>
                );
              })}
            </div>
          ) : (
            <textarea
              placeholder="Type your answer here..."
              value={responses[currentIndex]?.selectedOptions[0] || ''}
              onChange={(e) => selectOption(currentIndex, e.target.value, false)}
              style={{
                width: '100%', minHeight: '12rem', padding: '1.25rem',
                background: 'var(--surface-container-low)', border: 'none',
                borderRadius: 'var(--radius-xl)', fontFamily: 'Inter, sans-serif',
                fontSize: '0.9375rem', color: 'var(--on-surface)', lineHeight: 1.6,
                resize: 'vertical',
              }}
            />
          )}

        </div>

        {/* Bottom Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem 2rem', borderTop: '1px solid rgba(226,231,255,0.3)' }}>
          <button
            className="btn-secondary"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            style={{ opacity: currentIndex === 0 ? 0.5 : 1 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span>
            Previous
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              if (currentIndex < questions.length - 1) {
                setCurrentIndex(currentIndex + 1);
              } else {
                handleSubmit(false);
              }
            }}
          >
            {currentIndex < questions.length - 1 ? 'Next Question' : 'Review & Submit'}
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Warning Overlay Element Included For Complete Logic UI Integration */}
      {showViolationOverlay && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '1rem', padding: '2rem', maxWidth: '30rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--error)' }}>⚠️ Warning!</h2>
            <p style={{ marginTop: '1rem', color: 'var(--on-surface)', fontWeight: 600 }}>We detected tab switching or resizing.</p>
            <p style={{ marginTop: '0.5rem', color: 'var(--error)' }}>Violations: {violationCount}/3</p>
            <button onClick={() => { setShowViolationOverlay(false); requestFullscreen(); }} className="btn-primary" style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center' }}>
              Acknowledge and Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
