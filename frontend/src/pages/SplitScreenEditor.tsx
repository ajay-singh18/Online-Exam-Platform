import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { createQuestion, getTopics, getSubjects } from '../api/questionApi';
import { getDocuments, uploadDocument, deleteDocument } from '../api/documentApi';
import { useToastStore } from '../store/toastStore';

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ],
};

export default function SplitScreenEditor() {
  const navigate = useNavigate();
  const addToast = useToastStore((s: any) => s.addToast);

  // Left side state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>('');
  
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [uploadingRef, setUploadingRef] = useState(false);
  const [previousTopics, setPreviousTopics] = useState<string[]>([]);
  const [previousSubjects, setPreviousSubjects] = useState<string[]>([]);

  const fetchCategorization = async () => {
    try {
      const [topicRes, subjectRes] = await Promise.all([getTopics(), getSubjects()]);
      setPreviousTopics(topicRes.data.topics || []);
      setPreviousSubjects(subjectRes.data.subjects || []);
    } catch (error) {
      console.warn('Failed to load previous categorization data', error);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchCategorization();
  }, []);

  const fetchDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const { data } = await getDocuments();
      setDocuments(data.documents);
    } catch {
      addToast('Failed to load documents', 'error');
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Right side state (Editor)
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

  useEffect(() => {
    if (type === 'truefalse') {
      setOptions([{ text: 'True', isCorrect: false }, { text: 'False', isCorrect: false }]);
    } else if (type === 'fillblank') {
      setOptions([{ text: '', isCorrect: true }]);
    } else if (options.length < 4) {
       setOptions([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);
    }
  }, [type]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        addToast('Please upload a PDF file', 'error');
        return;
      }
      
      setUploadingRef(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await uploadDocument(formData);
        
        // Add to our list
        setDocuments(prev => [data.document, ...prev]);
        setPdfUrl(data.document.url);
        setPdfName(data.document.name);
        addToast('Document uploaded successfully', 'success');
      } catch (err: any) {
        addToast(err.response?.data?.message || 'Failed to upload document', 'error');
      } finally {
        setUploadingRef(false);
      }
    }
  };

  const handleDocumentSelect = (doc: any) => {
    setPdfUrl(doc.url);
    setPdfName(doc.name);
  };

  const handleDocumentDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDocument(id);
      setDocuments(prev => prev.filter(d => d._id !== id));
      addToast('Document removed from library', 'success');
      if (documents.find(d => d._id === id)?.url === pdfUrl) {
         setPdfUrl(null);
         setPdfName('');
      }
    } catch {
      addToast('Failed to remove document', 'error');
    }
  };

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

      await createQuestion(formData);
      addToast('Question created successfully', 'success');
      
      setText('');
      setImageFile(null);
      setImagePreview('');
      setOptions(prev => prev.map(o => ({ ...o, text: '', isCorrect: false })));
      
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to save', 'error');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 5rem)', background: 'var(--background)', overflow: 'hidden' }}>
      
      {/* Left Panel - PDF Viewer / Library */}
      <div style={{ flex: 1, borderRight: '1px solid rgba(226,231,255,0.3)', display: 'flex', flexDirection: 'column', background: 'var(--surface-container-lowest)' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(226,231,255,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-container)' }}>Document Viewer</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--on-secondary-container)' }}>{pdfName || 'Select a document or upload a new one'}</p>
          </div>
          {pdfUrl ? (
            <button className="btn-secondary" onClick={() => { setPdfUrl(null); setPdfName(''); }} style={{ padding: '0.5rem 1rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>arrow_back</span>
              Back to Library
            </button>
          ) : (
            <label className="btn-secondary" style={{ cursor: 'pointer', margin: 0, padding: '0.5rem 1rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>{uploadingRef ? 'sync' : 'upload_file'}</span>
              Upload PDF
              <input type="file" accept="application/pdf" onChange={handlePdfUpload} disabled={uploadingRef} style={{ display: 'none' }} />
            </label>
          )}
        </div>
        
        <div style={{ flex: 1, position: 'relative', background: 'var(--surface-container-low)', overflowY: 'auto' }}>
          {!pdfUrl ? (
            <div style={{ padding: '2.5rem', maxWidth: '48rem', margin: '0 auto' }}>
              {documentsLoading ? (
                 <div style={{ textAlign: 'center', color: 'var(--on-secondary-container)' }}>Loading library...</div>
              ) : documents.length === 0 ? (
                 <div style={{ textAlign: 'center', color: 'var(--on-secondary-container)', background: 'var(--surface-container-lowest)', padding: '4rem', borderRadius: 'var(--radius-2xl)' }}>
                   <span className="material-symbols-outlined" style={{ fontSize: '4rem', opacity: 0.3, marginBottom: '1rem' }}>folder_open</span>
                   <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--on-surface)' }}>Library Empty</h3>
                   <p style={{ marginTop: '0.5rem' }}>Upload a PDF exam paper to start extracting questions.</p>
                 </div>
              ) : (
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                   {documents.map(doc => (
                      <div key={doc._id} onClick={() => handleDocumentSelect(doc)} style={{ padding: '1.5rem', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-xl)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
                         <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', overflow: 'hidden' }}>
                           <div style={{ background: 'var(--secondary)', padding: '0.75rem', borderRadius: 'var(--radius-lg)', display: 'flex' }}>
                             <span className="material-symbols-outlined" style={{ color: 'var(--primary-container)', fontSize: '1.75rem' }}>description</span>
                           </div>
                           <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontWeight: 700, color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--on-secondary-container)', marginTop: '0.25rem' }}>Uploaded {new Date(doc.createdAt).toLocaleDateString()}</div>
                           </div>
                         </div>
                         <button className="btn-ghost" onClick={(e) => handleDocumentDelete(doc._id, e)} style={{ padding: '0.5rem', color: 'var(--error)' }}>
                           <span className="material-symbols-outlined">delete</span>
                         </button>
                      </div>
                   ))}
                 </div>
              )}
            </div>
          ) : (
            <iframe 
              src={`${pdfUrl}#toolbar=0`} 
              style={{ width: '100%', height: '100%', border: 'none' }} 
              title={pdfName} 
            />
          )}
        </div>
      </div>

      {/* Right Panel - Question Editor */}
      <div style={{ width: '500px', display: 'flex', flexDirection: 'column', background: 'var(--surface)', overflowY: 'auto' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(226,231,255,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-container)' }}>Create Question</h2>
          <button className="btn-ghost" onClick={() => navigate('/admin/questions')} style={{ padding: '0.5rem' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="label-xs" style={{ color: 'var(--secondary)' }}>Type</label>
                <select className="ghost-input" value={type} onChange={(e) => setType(e.target.value)} style={{ borderRadius: 'var(--radius-sm)', paddingLeft: '0.75rem', fontSize: '0.875rem' }}>
                  <option value="mcq">MCQ</option>
                  <option value="msq">MSQ</option>
                  <option value="truefalse">True/False</option>
                  <option value="fillblank">Fill Blank</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="label-xs" style={{ color: 'var(--secondary)' }}>Difficulty</label>
                <select className="ghost-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ borderRadius: 'var(--radius-sm)', paddingLeft: '0.75rem', fontSize: '0.875rem' }}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="label-xs" style={{ color: 'var(--secondary)' }}>Subject</label>
                <input 
                  className="ghost-input" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  placeholder="e.g. Science" 
                  style={{ borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }} 
                  list="previous-subjects-split"
                  required 
                />
                <datalist id="previous-subjects-split">
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
                  list="previous-topics-split"
                />
                <datalist id="previous-topics-split">
                  {previousTopics.map((t, idx) => (
                    <option key={idx} value={t} />
                  ))}
                </datalist>
                <div className="input-underline" />
              </div>
            </div>
          </div>

          {/* Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="label-xs" style={{ color: 'var(--secondary)' }}>Question Text</label>
            <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
              <ReactQuill theme="snow" value={text} onChange={setText} modules={QUILL_MODULES} placeholder="Write or paste question here..." />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="label-xs" style={{ color: 'var(--secondary)' }}>Question Image (optional)</label>
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

          {/* Options */}
          {type !== 'fillblank' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label className="label-xs" style={{ color: 'var(--secondary)' }}>Answer Options</label>
              {options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type={type === 'msq' ? 'checkbox' : 'radio'}
                    name="correct-split"
                    checked={opt.isCorrect}
                    onChange={(e) => handleOptionChange(i, 'isCorrect', e.target.checked)}
                    style={{ accentColor: 'var(--on-primary-container)', width: '1rem', height: '1rem' }}
                  />
                  <input
                    className="ghost-input"
                    value={opt.text}
                    onChange={(e) => handleOptionChange(i, 'text', e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    style={{ borderRadius: 'var(--radius-sm)', flex: 1, fontSize: '0.875rem' }}
                    disabled={type === 'truefalse'}
                    required
                  />
                  {type !== 'truefalse' && options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>remove_circle</span>
                    </button>
                  )}
                </div>
              ))}
              {type !== 'truefalse' && (
                <button type="button" onClick={addOption} className="btn-ghost" style={{ alignSelf: 'flex-start', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span> Add Option
                </button>
              )}
            </div>
          )}

          {type === 'fillblank' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="label-xs" style={{ color: 'var(--secondary)' }}>Correct Answer</label>
              <input className="ghost-input" value={options[0]?.text || ''} onChange={(e) => setOptions([{ text: e.target.value, isCorrect: true }])} placeholder="Enter answer" style={{ borderRadius: 'var(--radius-sm)' }} required />
              <div className="input-underline" />
            </div>
          )}

          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
              {submitting ? 'Saving...' : 'Save & Next Question'}
            </button>
             <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--on-secondary-container)' }}>Editor resets automatically on save.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
