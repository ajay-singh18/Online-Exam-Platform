import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { createQuestion, updateQuestion, getQuestions, getTopics, getSubjects } from '../api/questionApi';
import { useToastStore } from '../store/toastStore';
import LoadingSpinner from '../components/LoadingSpinner';

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ],
};

export default function QuestionEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const addToast = useToastStore((s: any) => s.addToast);

  const [loading, setLoading] = useState(!!editId);
  const [submitting, setSubmitting] = useState(false);

  const [text, setText] = useState('');
  const [type, setType] = useState('mcq');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [options, setOptions] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [previousTopics, setPreviousTopics] = useState<string[]>([]);
  const [previousSubjects, setPreviousSubjects] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicRes, subjectRes] = await Promise.all([getTopics(), getSubjects()]);
        setPreviousTopics(topicRes.data.topics || []);
        setPreviousSubjects(subjectRes.data.subjects || []);
      } catch (error) {
        console.warn('Failed to load categorization data', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!editId) return;
    const load = async () => {
      try {
        const { data } = await getQuestions({});
        const all = data.questions || data || [];
        const q = all.find((x: any) => x._id === editId);
        if (q) {
          setText(q.text || '');
          setType(q.type || 'mcq');
          setSubject(q.subject || '');
          setTopic(q.topic || '');
          setDifficulty(q.difficulty || 'medium');
          if (q.options?.length) setOptions(q.options.map((o: any) => ({ text: o.text, isCorrect: o.isCorrect })));
          if (q.imageUrl) setImagePreview(q.imageUrl);
        }
      } catch { addToast('Failed to load question', 'error'); }
      finally { setLoading(false); }
    };
    load();
  }, [editId]);

  useEffect(() => {
    if (type === 'truefalse') {
      setOptions([{ text: 'True', isCorrect: false }, { text: 'False', isCorrect: false }]);
    } else if (type === 'fillblank') {
      setOptions([{ text: '', isCorrect: true }]);
    }
  }, [type]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleOptionChange = (index: number, field: 'text' | 'isCorrect', value: any) => {
    setOptions(prev => prev.map((o, i) => {
      if (i !== index) {
        if (field === 'isCorrect' && type === 'mcq' && value === true) return { ...o, isCorrect: false };
        return o;
      }
      return { ...o, [field]: value };
    }));
  };

  const addOption = () => setOptions(prev => [...prev, { text: '', isCorrect: false }]);
  const removeOption = (i: number) => { if (options.length > 2) setOptions(prev => prev.filter((_, idx) => idx !== i)); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) { addToast('Question text is required', 'warning'); return; }
    if (!subject.trim()) { addToast('Subject is required', 'warning'); return; }
    if ((type === 'mcq' || type === 'msq' || type === 'truefalse') && !options.some(o => o.isCorrect)) {
      addToast('Select at least one correct answer', 'warning'); return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('type', type);
      formData.append('subject', subject);
      formData.append('topic', topic);
      formData.append('difficulty', difficulty);
      formData.append('options', JSON.stringify(options));
      if (imageFile) formData.append('image', imageFile);

      if (editId) {
        await updateQuestion(editId, formData);
        addToast('Question updated', 'success');
      } else {
        await createQuestion(formData);
        addToast('Question created', 'success');
      }
      navigate('/admin/questions');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to save', 'error');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner message="Loading question..." />;

  return (
    <div style={{ padding: '2rem', maxWidth: '56rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)' }}>
            {editId ? 'Edit Question' : 'Create Question'}
          </h2>
          <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500 }}>
            Use the rich text editor for formatting, code blocks, and math.
          </p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/admin/questions')}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span>
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Type + Difficulty + Topic */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="label-xs" style={{ color: 'var(--secondary)' }}>Question Type</label>
            <select className="ghost-input" value={type} onChange={(e) => setType(e.target.value)} style={{ borderRadius: 'var(--radius-sm)', paddingLeft: '1rem' }}>
              <option value="mcq">MCQ (Single Answer)</option>
              <option value="msq">MSQ (Multiple Answers)</option>
              <option value="truefalse">True / False</option>
              <option value="fillblank">Fill in the Blank</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="label-xs" style={{ color: 'var(--secondary)' }}>Difficulty</label>
            <select className="ghost-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ borderRadius: 'var(--radius-sm)', paddingLeft: '1rem' }}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="label-xs" style={{ color: 'var(--secondary)' }}>Subject</label>
            <input 
              className="ghost-input" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              placeholder="e.g. Science" 
              style={{ borderRadius: 'var(--radius-sm)' }} 
              list="previous-subjects"
              required 
            />
            <datalist id="previous-subjects">
              {previousSubjects.map((s, idx) => (
                <option key={idx} value={s} />
              ))}
            </datalist>
            <div className="input-underline" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="label-xs" style={{ color: 'var(--secondary)' }}>Topic</label>
            <input 
              className="ghost-input" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
              placeholder="e.g. Data Structures" 
              style={{ borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }} 
              list="previous-topics"
            />
            <datalist id="previous-topics">
              {previousTopics.map((t, idx) => (
                <option key={idx} value={t} />
              ))}
            </datalist>
            <div className="input-underline" />
          </div>
        </div>

        {/* Rich Text Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label className="label-xs" style={{ color: 'var(--secondary)' }}>Question Text (Rich Editor)</label>
          <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            <ReactQuill theme="snow" value={text} onChange={setText} modules={QUILL_MODULES} placeholder="Write your question here..." />
          </div>
        </div>

        {/* Image Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="label-xs" style={{ color: 'var(--secondary)' }}>Image (optional)</label>
            {imagePreview && (
              <button 
                type="button" 
                onClick={() => { setImageFile(null); setImagePreview(''); }}
                className="btn-ghost" 
                style={{ color: 'var(--error)', padding: '0.125rem 0.5rem', fontSize: '0.6875rem' }}
              >
                Remove
              </button>
            )}
          </div>
          
          <label 
            style={{
              display: 'flex',
              flexDirection: imagePreview ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              padding: imagePreview ? '0' : '1rem',
              border: imagePreview ? 'none' : '2px dashed var(--outline-variant)',
              borderRadius: 'var(--radius-lg)',
              background: imagePreview ? 'transparent' : 'var(--surface-container-lowest)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => {
              if (!imagePreview) {
                e.currentTarget.style.borderColor = 'var(--primary-container)';
                e.currentTarget.style.background = 'var(--surface)';
              }
            }}
            onMouseOut={(e) => {
              if (!imagePreview) {
                e.currentTarget.style.borderColor = 'var(--outline-variant)';
                e.currentTarget.style.background = 'var(--surface-container-lowest)';
              }
            }}
          >
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            
            {imagePreview ? (
              <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-lg)', padding: '0.25rem' }}>
                <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '6rem', objectFit: 'contain', borderRadius: 'calc(var(--radius-lg) - 0.25rem)' }} />
                <div 
                  style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s ease', borderRadius: 'calc(var(--radius-lg) - 0.25rem)' }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '0'}
                >
                   <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '1.5rem', background: 'rgba(0,0,0,0.5)', padding: '0.25rem', borderRadius: 'var(--radius-full)' }}>edit</span>
                </div>
              </div>
            ) : (
              <>
                <div style={{ background: 'var(--surface-container)', padding: '0.5rem', borderRadius: 'var(--radius-md)', display: 'flex' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary-container)', fontSize: '1.25rem' }}>add_photo_alternate</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: '0.8125rem' }}>Click to upload image</span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--on-secondary-container)', marginTop: '0.125rem' }}>PNG, JPG, WEBP (Max 5MB)</span>
                </div>
              </>
            )}
          </label>
        </div>

        {/* Options (for MCQ/MSQ/TrueFalse) */}
        {type !== 'fillblank' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label className="label-xs" style={{ color: 'var(--secondary)' }}>
              Answer Options {type === 'msq' ? '(select all correct)' : '(select one correct)'}
            </label>
            {options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type={type === 'msq' ? 'checkbox' : 'radio'}
                  name="correct"
                  checked={opt.isCorrect}
                  onChange={(e) => handleOptionChange(i, 'isCorrect', e.target.checked)}
                  style={{ accentColor: 'var(--on-primary-container)', width: '1.125rem', height: '1.125rem', flexShrink: 0 }}
                />
                <input
                  className="ghost-input"
                  value={opt.text}
                  onChange={(e) => handleOptionChange(i, 'text', e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  style={{ borderRadius: 'var(--radius-sm)', flex: 1 }}
                  disabled={type === 'truefalse'}
                  required
                />
                {type !== 'truefalse' && options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', display: 'flex' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>remove_circle</span>
                  </button>
                )}
              </div>
            ))}
            {type !== 'truefalse' && (
              <button type="button" onClick={addOption} className="btn-ghost" style={{ alignSelf: 'flex-start' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
                Add Option
              </button>
            )}
          </div>
        )}

        {/* Fill-in-the-blank answer */}
        {type === 'fillblank' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="label-xs" style={{ color: 'var(--secondary)' }}>Correct Answer</label>
            <input className="ghost-input" value={options[0]?.text || ''} onChange={(e) => setOptions([{ text: e.target.value, isCorrect: true }])} placeholder="Enter the correct answer" style={{ borderRadius: 'var(--radius-sm)' }} required />
            <div className="input-underline" />
          </div>
        )}

        {/* Submit */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin/questions')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : editId ? 'Update Question' : 'Create Question'}
          </button>
        </div>
      </form>
    </div>
  );
}
