import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getExams, createExam, updateExam } from '../api/examApi';
import { getQuestions } from '../api/questionApi';
import { getBatches } from '../api/batchApi';
import { useToastStore } from '../store/toastStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ExamBuilder() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const isEdit = !!examId && examId !== 'new';
  const addToast = useToastStore((s: any) => s.addToast);
  const STORAGE_KEY = `exam-builder-draft${examId ? `-${examId}` : ''}`;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [allBatches, setAllBatches] = useState<any[]>([]);

  // Helper: format a Date to datetime-local string in LOCAL time
  const toLocalDatetimeString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
  };

  // Restore draft from localStorage
  const getSavedDraft = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const draft = getSavedDraft();

  // Form state (restored from localStorage if available)
  const [title, setTitle] = useState(draft?.title || '');
  const [description, setDescription] = useState(draft?.description || '');
  const [durationMins, setDurationMins] = useState(draft?.durationMins || 30);
  const [passMark, setPassMark] = useState(draft?.passMark || 40);
  const [startAt, setStartAt] = useState(draft?.startAt || '');
  const [endAt, setEndAt] = useState(draft?.endAt || '');

  // Auto-calculate end time from start time + duration (local time)
  const computeEndTime = (start: string, duration: number) => {
    if (!start) { setEndAt(''); return; }
    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) { setEndAt(''); return; }
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
    setEndAt(toLocalDatetimeString(endDate));
  };

  const handleStartChange = (val: string) => {
    setStartAt(val);
    computeEndTime(val, durationMins);
  };

  const handleDurationChange = (val: number) => {
    setDurationMins(val);
    computeEndTime(startAt, val);
  };

  const [randomizeQuestions, setRandomizeQuestions] = useState(draft?.randomizeQuestions || false);
  const [randomizeOptions, setRandomizeOptions] = useState(draft?.randomizeOptions || false);
  const [fullscreenRequired, setFullscreenRequired] = useState(draft?.fullscreenRequired ?? true);
  const [enrollAll, setEnrollAll] = useState(draft?.enrollAll || false);
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set(draft?.selectedBatches || []));
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set(draft?.selectedQuestions || []));

  // Question filter
  const [qFilter, setQFilter] = useState('');

  // Save draft to localStorage on every field change
  useEffect(() => {
    if (loading) return; // don't overwrite with defaults while still loading
    const draftData = {
      title, description, durationMins, passMark,
      startAt, endAt, randomizeQuestions, randomizeOptions,
      fullscreenRequired, enrollAll, selectedBatches: [...selectedBatches],
      selectedQuestions: [...selectedQuestions],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
  }, [title, description, durationMins, passMark, startAt, endAt, randomizeQuestions, randomizeOptions, fullscreenRequired, enrollAll, selectedBatches, selectedQuestions, loading]);

  useEffect(() => {
    const init = async () => {
      try {
        const [qRes, bRes] = await Promise.all([getQuestions({}), getBatches()]);
        setAllQuestions(qRes.data.questions || qRes.data || []);
        setAllBatches(bRes.data.batches || bRes.data || []);

        if (isEdit) {
          const { data: eData } = await getExams();
          const exams = eData.exams || eData || [];
          const exam = exams.find((e: any) => e._id === examId);
          if (exam && !draft) {
            // Only load from server if no local draft exists
            setTitle(exam.title);
            setDescription(exam.description || '');
            setDurationMins(exam.durationMins);
            setPassMark(exam.passMark);
            setStartAt(exam.startAt ? toLocalDatetimeString(new Date(exam.startAt)) : '');
            setEndAt(exam.endAt ? toLocalDatetimeString(new Date(exam.endAt)) : '');
            setRandomizeQuestions(exam.randomizeQuestions);
            setRandomizeOptions(exam.randomizeOptions);
            setFullscreenRequired(exam.fullscreenRequired);
            setEnrollAll(exam.enrollAll || false);
            setSelectedBatches(new Set((exam.allowedBatches || []).map((b: any) => b._id || b)));
            setSelectedQuestions(new Set((exam.questions || []).map((q: any) => q._id || q)));
          }
        }
      } catch { addToast('Failed to load data', 'error'); }
      finally { setLoading(false); }
    };
    init();
  }, [examId]);

  const toggleQuestion = (id: string) => {
    setSelectedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { addToast('Title is required', 'warning'); return; }
    if (selectedQuestions.size === 0) { addToast('Select at least one question', 'warning'); return; }

    setSubmitting(true);
    const payload = {
      title, description, durationMins, passMark,
      startAt: startAt || undefined, endAt: endAt || undefined,
      randomizeQuestions, randomizeOptions, fullscreenRequired, enrollAll,
      allowedBatches: [...selectedBatches],
      questions: [...selectedQuestions],
    };

    try {
      if (isEdit) {
        await updateExam(examId!, payload);
        addToast('Exam updated', 'success');
      } else {
        await createExam(payload);
        addToast('Exam created', 'success');
      }
      localStorage.removeItem(STORAGE_KEY);
      navigate('/admin/exams');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to save', 'error');
    } finally { setSubmitting(false); }
  };

  const filteredQuestions = allQuestions.filter((q: any) =>
    !qFilter || q.topic?.toLowerCase().includes(qFilter.toLowerCase()) || q.text?.toLowerCase().includes(qFilter.toLowerCase())
  );

  if (loading) return <LoadingSpinner message="Loading exam builder..." />;

  return (
    <div style={{ padding: '2rem', maxWidth: '64rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)' }}>
            {isEdit ? 'Edit Exam' : 'Create New Exam'}
          </h2>
          <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500 }}>Configure exam settings and select questions.</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/admin')}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span>
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Basic Info */}
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontWeight: 800, color: 'var(--primary-container)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>info</span>
            Basic Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="label-xs" style={{ color: 'var(--secondary)' }}>Exam Title *</label>
            <input className="ghost-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mid-Semester DSA Assessment" style={{ borderRadius: 'var(--radius-sm)' }} required />
            <div className="input-underline" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="label-xs" style={{ color: 'var(--secondary)' }}>Description</label>
            <textarea className="ghost-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the exam..." rows={3} style={{ borderRadius: 'var(--radius-sm)', resize: 'vertical', fontFamily: 'Inter, sans-serif' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="label-xs" style={{ color: 'var(--secondary)' }}>Duration (minutes) *</label>
              <input className="ghost-input" type="number" min="1" value={durationMins} onChange={(e) => handleDurationChange(Number(e.target.value))} style={{ borderRadius: 'var(--radius-sm)' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="label-xs" style={{ color: 'var(--secondary)' }}>Pass Mark (%)</label>
              <input className="ghost-input" type="number" min="0" max="100" value={passMark} onChange={(e) => setPassMark(Number(e.target.value))} style={{ borderRadius: 'var(--radius-sm)' }} />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontWeight: 800, color: 'var(--primary-container)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>schedule</span>
            Schedule & Proctoring
          </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="label-xs" style={{ color: 'var(--secondary)' }}>Start Date/Time</label>
              <input className="ghost-input" type="datetime-local" value={startAt} onChange={(e) => handleStartChange(e.target.value)} style={{ borderRadius: 'var(--radius-sm)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="label-xs" style={{ color: 'var(--secondary)' }}>End Date/Time <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 'normal', color: 'var(--outline)' }}>(auto-filled, editable)</span></label>
              <input className="ghost-input" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} style={{ borderRadius: 'var(--radius-sm)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { key: 'fullscreenRequired', label: 'Require fullscreen mode (proctoring)', value: fullscreenRequired, setter: setFullscreenRequired },
              { key: 'randomizeQuestions', label: 'Randomize question order per student', value: randomizeQuestions, setter: setRandomizeQuestions },
              { key: 'randomizeOptions', label: 'Randomize option order per student', value: randomizeOptions, setter: setRandomizeOptions },
            ].map(opt => (
              <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={opt.value} onChange={(e) => opt.setter(e.target.checked)} style={{ accentColor: 'var(--on-primary-container)', width: '1.125rem', height: '1.125rem' }} />
                <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--on-surface)' }}>{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Enroll All Toggle */}
          <div style={{
            padding: '1rem 1.25rem', borderRadius: 'var(--radius-xl)',
            background: enrollAll ? 'rgba(78,222,163,0.08)' : 'var(--surface-container-low)',
            border: enrollAll ? '2px solid rgba(78,222,163,0.3)' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={enrollAll} onChange={(e) => setEnrollAll(e.target.checked)} style={{ accentColor: 'var(--on-primary-container)', width: '1.25rem', height: '1.25rem' }} />
              <div>
                <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.125rem', color: 'var(--primary-container)' }}>group_add</span>
                  Enroll all students in institute
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--on-secondary-container)', fontWeight: 500, display: 'block', marginTop: '0.25rem' }}>
                  {enrollAll ? '✓ All registered students in your institute will see this exam — no need to add them individually.' : 'Enable this to make the exam available to all students without manual enrollment.'}
                </span>
              </div>
            </label>
          </div>

          {/* Batch Selection */}
          {!enrollAll && allBatches.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontWeight: 700, color: 'var(--on-surface)', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem', color: 'var(--primary-container)' }}>groups</span>
                Assign Batches
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--on-secondary-container)' }}>({selectedBatches.size} selected)</span>
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {allBatches.map((batch: any) => {
                  const isSelected = selectedBatches.has(batch._id);
                  return (
                    <button
                      key={batch._id}
                      type="button"
                      onClick={() => {
                        setSelectedBatches(prev => {
                          const next = new Set(prev);
                          if (next.has(batch._id)) next.delete(batch._id); else next.add(batch._id);
                          return next;
                        });
                      }}
                      style={{
                        padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
                        border: isSelected ? '2px solid var(--primary-container)' : '2px solid rgba(226,231,255,0.4)',
                        background: isSelected ? 'rgba(30,58,138,0.08)' : 'transparent',
                        color: isSelected ? 'var(--primary-container)' : 'var(--on-surface)',
                        fontWeight: isSelected ? 700 : 500, fontSize: '0.875rem',
                        cursor: 'pointer', transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                        {isSelected ? 'check_circle' : 'circle'}
                      </span>
                      {batch.name}
                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({batch.students?.length || 0})</span>
                    </button>
                  );
                })}
              </div>
              {selectedBatches.size === 0 && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--on-secondary-container)', fontWeight: 500 }}>
                  No batches selected. You can still enroll students individually after creating the exam.
                </p>
              )}
            </div>
          )}
          {enrollAll && allBatches.length > 0 && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--on-secondary-container)', fontWeight: 500, fontStyle: 'italic' }}>
              Batch selection is disabled because "Enroll all students" is enabled.
            </p>
          )}
        </div>

        {/* Question Selection */}
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 800, color: 'var(--primary-container)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>quiz</span>
              Select Questions ({selectedQuestions.size} selected)
            </h3>
            <input className="ghost-input" placeholder="Search by topic or text..." value={qFilter} onChange={(e) => setQFilter(e.target.value)} style={{ borderRadius: 'var(--radius-sm)', width: 'auto', maxWidth: '16rem' }} />
          </div>
          {filteredQuestions.length === 0 ? (
            <p style={{ color: 'var(--on-secondary-container)', textAlign: 'center', padding: '2rem' }}>No questions available. Create questions first.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '24rem', overflowY: 'auto' }}>
              {filteredQuestions.map((q: any) => (
                <label key={q._id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                  background: selectedQuestions.has(q._id) ? 'rgba(78,222,163,0.08)' : 'transparent',
                  transition: 'background 0.15s',
                }}>
                  <input type="checkbox" checked={selectedQuestions.has(q._id)} onChange={() => toggleQuestion(q._id)} style={{ accentColor: 'var(--on-primary-container)', width: '1.125rem', height: '1.125rem', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} dangerouslySetInnerHTML={{ __html: q.text?.replace(/<[^>]*>/g, '').slice(0, 100) }} />
                    <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem' }}>
                      <span className="badge" style={{ fontSize: '0.6rem' }}>{q.type}</span>
                      <span className="badge" style={{ fontSize: '0.6rem' }}>{q.difficulty}</span>
                      <span className="badge" style={{ fontSize: '0.6rem' }}>{q.topic}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Update Exam' : 'Create Exam'}
          </button>
        </div>
      </form>
    </div>
  );
}
