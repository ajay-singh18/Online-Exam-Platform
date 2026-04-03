import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuestions, deleteQuestion } from '../api/questionApi';
import { useToastStore } from '../store/toastStore';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';
import QuestionCard from '../components/QuestionCard';
import BulkImportModal from '../components/BulkImportModal';

export default function QuestionBank() {
  const navigate = useNavigate();
  const addToast = useToastStore((s: any) => s.addToast);

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 500ms delay
    return () => clearTimeout(timer);
  }, [search]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (subjectFilter) params.subject = subjectFilter;
      if (topicFilter) params.topic = topicFilter;
      if (difficultyFilter) params.difficulty = difficultyFilter;
      if (typeFilter) params.type = typeFilter;
      const { data } = await getQuestions(params);
      setQuestions(data.questions || data || []);
    } catch { addToast('Failed to load questions', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchQuestions(); }, [debouncedSearch, subjectFilter, topicFilter, difficultyFilter, typeFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteQuestion(deleteTarget);
      setQuestions(prev => prev.filter(q => q._id !== deleteTarget));
      addToast('Question deleted', 'success');
    } catch { addToast('Delete failed', 'error'); }
    finally { setDeleteTarget(null); }
  };

  const subjects = [...new Set(questions.map((q: any) => q.subject).filter(Boolean))];
  const topics = [...new Set(questions.map((q: any) => q.topic).filter(Boolean))];

  return (
    <div style={{ padding: '2rem', maxWidth: '80rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)', letterSpacing: '-0.025em' }}>Question Bank</h2>
          <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500 }}>{questions.length} question{questions.length !== 1 ? 's' : ''} total</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setShowBulkModal(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>upload_file</span>
            Bulk Import
          </button>
          <button className="btn-secondary" onClick={() => navigate('/admin/editor/split')}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>splitscreen</span>
            Split Screen
          </button>
          <button className="btn-primary" onClick={() => navigate('/admin/editor')}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
            Add Question
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '32rem' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.25rem' }}>search</span>
          <input 
            className="ghost-input" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search questions by text, topic, subject, or answers..." 
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

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="ghost-input"
            style={{ borderRadius: 'var(--radius-sm)', width: 'auto', minWidth: '12rem', paddingLeft: '1rem' }}
          >
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
          </select>
        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="ghost-input"
          style={{ borderRadius: 'var(--radius-sm)', width: 'auto', minWidth: '12rem', paddingLeft: '1rem' }}
        >
          <option value="">All Topics</option>
          {topics.map(t => <option key={t as string} value={t as string}>{t as string}</option>)}
        </select>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="ghost-input"
          style={{ borderRadius: 'var(--radius-sm)', width: 'auto', minWidth: '10rem', paddingLeft: '1rem' }}
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="ghost-input"
          style={{ borderRadius: 'var(--radius-sm)', width: 'auto', minWidth: '10rem', paddingLeft: '1rem' }}
        >
          <option value="">All Types</option>
          <option value="mcq">MCQ</option>
          <option value="msq">MSQ</option>
          <option value="truefalse">True/False</option>
          <option value="fillblank">Fill in the Blank</option>
        </select>
      </div>
    </div>

      {/* Question List */}
      {loading ? <LoadingSpinner /> : questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-secondary-container)', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.4, display: 'block', marginBottom: '1rem' }}>quiz</span>
          <p style={{ fontWeight: 600 }}>No questions found. Create your first question.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.map((q: any) => (
            <div key={q._id} style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', boxShadow: '0 4px 16px rgba(30,58,138,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <QuestionCard html={q.text} imageUrl={q.imageUrl} />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    <span className="badge">{q.type?.toUpperCase()}</span>
                    <span className="badge" style={{
                      background: q.difficulty === 'hard' ? 'var(--error-container)' : q.difficulty === 'medium' ? '#FEF3C7' : 'rgba(78,222,163,0.15)',
                      color: q.difficulty === 'hard' ? 'var(--on-error-container)' : q.difficulty === 'medium' ? '#92400E' : 'var(--on-tertiary-container)',
                    }}>{q.difficulty}</span>
                    <span className="badge" style={{ background: 'var(--secondary-container)' }}>{q.subject}</span>
                    <span className="badge" style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)' }}>{q.topic}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                  <button className="btn-ghost" onClick={() => navigate(`/admin/editor?id=${q._id}`)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit</span>
                  </button>
                  <button className="btn-ghost" style={{ color: 'var(--error)' }} onClick={() => setDeleteTarget(q._id)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                  </button>
                </div>
              </div>
              {q.options?.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  {q.options.map((opt: any, i: number) => (
                    <span key={i} style={{
                      padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-md)',
                      fontSize: '0.8125rem', fontWeight: 600,
                      background: opt.isCorrect ? 'rgba(78,222,163,0.12)' : 'var(--surface-container-low)',
                      color: opt.isCorrect ? 'var(--on-tertiary-container)' : 'var(--on-surface)',
                    }}>
                      {String.fromCharCode(65 + i)}. {opt.text} {opt.isCorrect && '✓'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Question"
        message="This will permanently remove this question from the bank. Are you sure?"
        variant="danger" confirmLabel="Delete"
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)}
      />

      {showBulkModal && (
        <BulkImportModal 
          onClose={() => setShowBulkModal(false)} 
          onSuccess={fetchQuestions} 
        />
      )}
    </div>
  );
}
