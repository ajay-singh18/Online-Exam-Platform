import { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { bulkImportQuestions, importFromAI, getSubjects } from '../api/questionApi';
import { useToastStore } from '../store/toastStore';
import LoadingSpinner from '../components/LoadingSpinner';

interface BulkImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkImportModal({ onClose, onSuccess }: BulkImportModalProps) {
  const addToast = useToastStore((s: any) => s.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importType, setImportType] = useState<'csv' | 'ai'>('csv');
  const [batchSubject, setBatchSubject] = useState('');
  const [previousSubjects, setPreviousSubjects] = useState<string[]>([]);

  // Fetch existing subjects for autocomplete
  useEffect(() => {
    getSubjects().then(({ data }) => setPreviousSubjects(data.subjects || [])).catch(() => {});
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setImportType('csv');
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsed = results.data.map((row: any) => {
              const r: any = {};
              Object.keys(row).forEach(k => { r[k.toLowerCase().trim()] = row[k]; });
              
              const correctStr = String(r.correct || r.answer || '').toUpperCase();
              return {
                text: r.question || r.text || '',
                type: (r.type || 'mcq').toLowerCase(),
                options: [
                  { text: r.optiona || r.a || r.option_a || '', isCorrect: correctStr.includes('A') || correctStr === 'A' },
                  { text: r.optionb || r.b || r.option_b || '', isCorrect: correctStr.includes('B') || correctStr === 'B' },
                  { text: r.optionc || r.c || r.option_c || '', isCorrect: correctStr.includes('C') || correctStr === 'C' },
                  { text: r.optiond || r.d || r.option_d || '', isCorrect: correctStr.includes('D') || correctStr === 'D' },
                ].filter(o => o.text),
                subject: r.subject || 'General',
                topic: r.topic || 'General',
                difficulty: (r.difficulty || 'medium').toLowerCase(),
              };
            }).filter((q: any) => q.text); // Remove empty rows
            
            setQuestions(parsed);
            setLoading(false);
          },
          error: () => {
            addToast('Failed to parse CSV', 'error');
            setLoading(false);
          }
        });
      } else if (file.type === 'application/pdf') {
        setImportType('ai');
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await importFromAI(formData);
        setQuestions(data.questions);
        addToast(data.message || 'AI extraction complete!', 'success');
      } else {
        addToast('Unsupported file type. Use CSV or PDF.', 'error');
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Import failed', 'error');
    } finally {
      if (file.type === 'application/pdf') setLoading(false);
    }
  };

  const handleSave = async () => {
    if (questions.length === 0) return;
    if (!batchSubject.trim()) {
      addToast('Please assign a Subject before saving', 'warning');
      return;
    }
    setLoading(true);
    try {
      // Apply the batch subject to every question
      const withSubject = questions.map(q => ({ ...q, subject: batchSubject.trim() }));
      await bulkImportQuestions(withSubject);
      addToast(`Successfully imported ${withSubject.length} questions under "${batchSubject}"`, 'success');
      onSuccess();
      onClose();
    } catch {
      addToast('Failed to save questions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '2rem'
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-2xl)',
        width: '100%', maxWidth: '70rem', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: 'var(--shadow-glass)'
      }}>
        {/* Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Bulk Import Questions</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Import from CSV or use AI to extract from PDF</p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.5rem' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          {questions.length === 0 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--outline-variant)',
                borderRadius: 'var(--radius-xl)',
                padding: '4rem 2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) {
                  const items = { target: { files: [file] } } as any;
                  handleFileUpload(items);
                }
              }}
            >
              {loading ? <LoadingSpinner size="2rem" /> : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '3.5rem', color: 'var(--primary)', marginBottom: '1rem', display: 'block' }}>
                    cloud_upload
                  </span>
                  <p style={{ fontWeight: 700, fontSize: '1.125rem' }}>Click or drag a file to start</p>
                  <p style={{ color: 'var(--secondary)', marginTop: '0.5rem' }}>Supports .csv (Table) or .pdf (AI Extraction)</p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                    <div style={{ textAlign: 'left', background: 'var(--surface-container-low)', padding: '1rem', borderRadius: 'var(--radius-lg)', fontSize: '0.75rem' }}>
                      <p style={{ fontWeight: 800, marginBottom: '0.25rem' }}>CSV Columns Required:</p>
                      <code>question, optionA, optionB, correct, topic</code>
                    </div>
                  </div>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
                accept=".csv,.pdf" 
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="badge-info" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: 700 }}>
                  {questions.length} Questions {importType === 'ai' ? 'Extracted by AI' : 'Parsed from CSV'}
                </span>
                <button className="btn-ghost" onClick={() => { setQuestions([]); setBatchSubject(''); }} style={{ color: 'var(--error)' }}>
                  Clear & Restart
                </button>
              </div>

              {/* Global Subject Assignment */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem 1.25rem', borderRadius: 'var(--radius-xl)',
                background: !batchSubject.trim() ? 'rgba(245, 158, 11, 0.08)' : 'rgba(78,222,163,0.08)',
                border: !batchSubject.trim() ? '2px solid rgba(245, 158, 11, 0.3)' : '2px solid rgba(78,222,163,0.3)',
                transition: 'all 0.2s'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: !batchSubject.trim() ? '#F59E0B' : 'var(--on-tertiary-container)' }}>
                  {!batchSubject.trim() ? 'warning' : 'check_circle'}
                </span>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--on-surface)', display: 'block', marginBottom: '0.375rem' }}>
                    Assign Subject <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input
                    className="ghost-input"
                    value={batchSubject}
                    onChange={(e) => setBatchSubject(e.target.value)}
                    placeholder="e.g. Mathematics, Science, History..."
                    list="bulk-subject-suggestions"
                    style={{ borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', width: '100%', maxWidth: '20rem' }}
                  />
                  <datalist id="bulk-subject-suggestions">
                    {previousSubjects.map((s, i) => <option key={i} value={s} />)}
                  </datalist>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--on-secondary-container)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  Applied to all {questions.length} questions
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>Question Text</th>
                      <th>Type</th>
                      <th>Topic (Opt)</th>
                      <th>Diff</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q, idx) => (
                      <tr key={idx}>
                        <td>
                          <textarea 
                            value={q.text} 
                            onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                            style={{ 
                              width: '100%', border: 'none', background: 'transparent', 
                              resize: 'vertical', fontSize: '0.875rem', fontWeight: 500,
                              fontFamily: 'inherit'
                            }}
                          />
                          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                             {q.options?.map((opt: any, oi: number) => (
                               <span key={oi} className="badge" style={{ 
                                 background: opt.isCorrect ? 'var(--tertiary-fixed)' : 'var(--surface-container-high)',
                                 color: opt.isCorrect ? 'var(--on-tertiary-fixed-variant)' : 'var(--on-surface)'
                               }}>
                                 {String.fromCharCode(65+oi)}. {opt.text}
                               </span>
                             ))}
                          </div>
                        </td>
                        <td>
                          <select 
                            value={q.type} 
                            onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                            className="badge" style={{ border: 'none', background: 'var(--secondary-fixed)', color: 'var(--on-secondary-fixed)' }}
                          >
                            <option value="mcq">MCQ</option>
                            <option value="msq">MSQ</option>
                            <option value="truefalse">TF</option>
                            <option value="fillblank">FIB</option>
                          </select>
                        </td>

                        <td>
                          <input 
                            value={q.topic} 
                            onChange={(e) => updateQuestion(idx, 'topic', e.target.value)}
                            style={{ border: 'none', background: 'transparent', width: '6rem', fontSize: '0.8125rem' }}
                          />
                        </td>
                        <td>
                          <select 
                            value={q.difficulty} 
                            onChange={(e) => updateQuestion(idx, 'difficulty', e.target.value)}
                            style={{ border: 'none', background: 'transparent', fontSize: '0.8125rem' }}
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Med</option>
                            <option value="hard">Hard</option>
                          </select>
                        </td>
                        <td>
                          <button onClick={() => removeQuestion(idx)} className="btn-ghost" style={{ color: 'var(--error)' }}>
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button 
            className="btn-primary" 
            onClick={handleSave} 
            disabled={loading || questions.length === 0}
            style={{ opacity: (loading || questions.length === 0) ? 0.6 : 1 }}
          >
            {loading ? <LoadingSpinner size="1rem" inline={true} /> : 'Save All Questions'}
          </button>
        </div>
      </div>
    </div>
  );
}
