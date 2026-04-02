import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAttemptResult } from '../api/attemptApi';
import LoadingSpinner from '../components/LoadingSpinner';
import QuestionCard from '../components/QuestionCard';

export default function ExamResults() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await getAttemptResult(attemptId);
        setResult(data.attempt || data);
        setQuestions(data.questions || []);
      } catch { navigate('/student'); }
      finally { setLoading(false); }
    };
    if (attemptId) fetchResult();
  }, [attemptId]);

  if (loading) return <LoadingSpinner message="Loading your results..." />;
  if (!result) return null;

  const responses = result.responses || [];

  // Build per-topic stats
  const topicMap: Record<string, { correct: number; total: number }> = {};
  questions.forEach((q: any) => {
    const topic = q.topic || 'General';
    if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
    topicMap[topic].total++;
    const resp = responses.find((r: any) => r.questionId === q._id);
    const correctIdxs = q.options?.map((o: any, idx: number) => o.isCorrect ? idx : -1).filter((x: number) => x >= 0) || [];
    const selected = resp?.selectedOptions || [];
    if (JSON.stringify([...selected].sort((a: number, b: number) => a - b)) === JSON.stringify([...correctIdxs].sort((a: number, b: number) => a - b))) topicMap[topic].correct++;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '64rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary-container)', letterSpacing: '-0.025em' }}>
            Exam Results
          </h2>
          <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500 }}>
            {result.examId?.title || 'Assessment'} — Submitted {result.submittedAt ? new Date(result.submittedAt).toLocaleString() : ''}
          </p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/student')}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span>
          Back to Dashboard
        </button>
      </div>

      {/* Score Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>Score</span>
          <p style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-container)', margin: '0.5rem 0' }}>
            {result.score ?? 0}<span style={{ fontSize: '1rem', color: 'var(--on-secondary-container)' }}> / {result.totalMarks ?? questions.length}</span>
          </p>
        </div>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>Percentage</span>
          <p style={{ fontSize: '2.5rem', fontWeight: 900, color: result.passed ? 'var(--on-tertiary-container)' : 'var(--error)', margin: '0.5rem 0' }}>
            {result.percentage ?? 0}%
          </p>
        </div>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>Status</span>
          <p style={{ fontSize: '1.5rem', fontWeight: 900, color: result.passed ? 'var(--on-tertiary-container)' : 'var(--error)', margin: '0.75rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined filled">{result.passed ? 'check_circle' : 'cancel'}</span>
            {result.passed ? 'Passed' : 'Failed'}
          </p>
        </div>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>Violations</span>
          <p style={{ fontSize: '2.5rem', fontWeight: 900, color: (result.violations?.length || 0) > 0 ? 'var(--error)' : 'var(--on-tertiary-container)', margin: '0.5rem 0' }}>
            {result.violations?.length || 0}
          </p>
        </div>
      </div>

      {/* Topic-wise Breakdown */}
      {Object.keys(topicMap).length > 0 && (
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-container)', marginBottom: '1.25rem' }}>Topic-wise Performance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(topicMap).map(([topic, stats]) => {
              const pct = Math.round((stats.correct / stats.total) * 100);
              return (
                <div key={topic}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--on-surface)', fontSize: '0.875rem' }}>{topic}</span>
                    <span style={{ fontWeight: 700, color: 'var(--on-secondary-container)', fontSize: '0.8125rem' }}>{stats.correct}/{stats.total} ({pct}%)</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct >= 60 ? 'var(--on-tertiary-container)' : 'var(--error)', borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-Question Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-container)' }}>Question-by-Question Review</h3>
        {questions.map((q: any, i: number) => {
          const resp = responses.find((r: any) => r.questionId === q._id);
          const selected = resp?.selectedOptions || [];
          const correctIdxs = q.options?.map((o: any, idx: number) => o.isCorrect ? idx : -1).filter((x: number) => x >= 0) || [];
          const isCorrect = JSON.stringify([...selected].sort((a: number, b: number) => a - b)) === JSON.stringify([...correctIdxs].sort((a: number, b: number) => a - b));
          const expanded = expandedQ === i;

          return (
            <div key={q._id || i} style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: '0 4px 16px rgba(30,58,138,0.04)' }}>
              <button
                onClick={() => setExpandedQ(expanded ? null : i)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{
                  width: '2rem', height: '2rem', borderRadius: '50%', flexShrink: 0,
                  background: isCorrect ? 'rgba(78,222,163,0.15)' : 'var(--error-container)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="material-symbols-outlined filled" style={{ fontSize: '1rem', color: isCorrect ? 'var(--on-tertiary-container)' : 'var(--on-error-container)' }}>
                    {isCorrect ? 'check' : 'close'}
                  </span>
                </div>
                <span style={{ flex: 1, fontWeight: 700, color: 'var(--on-surface)', fontSize: '0.9375rem' }}>Question {i + 1}</span>
                <span className="badge" style={{ background: q.difficulty === 'hard' ? 'var(--error-container)' : q.difficulty === 'medium' ? '#FEF3C7' : 'rgba(78,222,163,0.15)', color: q.difficulty === 'hard' ? 'var(--on-error-container)' : q.difficulty === 'medium' ? '#92400E' : 'var(--on-tertiary-container)' }}>
                  {q.difficulty}
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--outline)', transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>expand_more</span>
              </button>
              {expanded && (
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                  <QuestionCard html={q.text} imageUrl={q.imageUrl} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                    {q.options?.map((opt: any, oi: number) => {
                      const wasSelected = selected.includes(oi);
                      const isRight = opt.isCorrect;
                      let bg = 'var(--surface-container-low)';
                      if (isRight) bg = 'rgba(78,222,163,0.12)';
                      else if (wasSelected && !isRight) bg = 'rgba(239,68,68,0.1)';
                      return (
                        <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', background: bg }}>
                          <span style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--on-secondary-container)' }}>{String.fromCharCode(65 + oi)}</span>
                          <span style={{ flex: 1, fontSize: '0.9375rem', fontWeight: 500 }}>{opt.text}</span>
                          {wasSelected && <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: isRight ? 'var(--on-tertiary-container)' : 'var(--error)' }}>{isRight ? 'check_circle' : 'cancel'}</span>}
                          {isRight && !wasSelected && <span className="material-symbols-outlined filled" style={{ fontSize: '1rem', color: 'var(--on-tertiary-container)' }}>check_circle</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
