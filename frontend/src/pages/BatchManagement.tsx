import { useState, useEffect } from 'react';
import { getBatches, createBatch, deleteBatch, addStudentsToBatch, removeStudentFromBatch } from '../api/batchApi';
import { useToastStore } from '../store/toastStore';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';

export default function BatchManagement() {
  const addToast = useToastStore((s: any) => s.addToast);

  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create batch form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Expanded batch (show students)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add students form
  const [enrollEmail, setEnrollEmail] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const fetchBatches = async () => {
    try {
      const { data } = await getBatches();
      setBatches(data.batches || data || []);
    } catch { addToast('Failed to load batches', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBatches(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { addToast('Batch name is required', 'warning'); return; }
    setCreating(true);
    try {
      await createBatch({ name: newName, description: newDesc });
      addToast('Batch created!', 'success');
      setNewName(''); setNewDesc(''); setShowCreate(false);
      fetchBatches();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to create batch', 'error');
    } finally { setCreating(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBatch(deleteTarget._id);
      addToast('Batch deleted', 'success');
      setDeleteTarget(null);
      if (expandedId === deleteTarget._id) setExpandedId(null);
      fetchBatches();
    } catch { addToast('Failed to delete batch', 'error'); }
  };

  const handleAddStudents = async (batchId: string) => {
    if (!enrollEmail.trim()) return;
    setEnrolling(true);
    try {
      const emails = enrollEmail.split(',').map(s => s.trim()).filter(Boolean);
      const { data } = await addStudentsToBatch(batchId, { emails });
      const msg = `Added ${data.added} student(s)`;
      const warn = data.notFound?.length > 0 ? `. Not found: ${data.notFound.join(', ')}` : '';
      addToast(msg + warn, data.notFound?.length > 0 ? 'warning' : 'success');
      setEnrollEmail('');
      fetchBatches();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to add students', 'error');
    } finally { setEnrolling(false); }
  };

  const handleRemoveStudent = async (batchId: string, studentId: string) => {
    try {
      await removeStudentFromBatch(batchId, studentId);
      addToast('Student removed', 'success');
      fetchBatches();
    } catch { addToast('Failed to remove student', 'error'); }
  };

  if (loading) return <LoadingSpinner message="Loading batches..." />;

  return (
    <div style={{ padding: '2rem', maxWidth: '64rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)', letterSpacing: '-0.025em' }}>
            Batches & Classes
          </h2>
          <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500, marginTop: '0.25rem' }}>
            Group students into batches, then assign batches to exams.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>{showCreate ? 'close' : 'add'}</span>
          {showCreate ? 'Cancel' : 'New Batch'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} style={{
          background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)',
          padding: '1.5rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)',
          display: 'flex', flexDirection: 'column', gap: '1rem',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <h3 style={{ fontWeight: 800, color: 'var(--primary-container)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>group_add</span>
            Create New Batch
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="label-xs" style={{ color: 'var(--secondary)' }}>Batch Name *</label>
              <input className="ghost-input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. CS Section A, Batch 2026" style={{ borderRadius: 'var(--radius-sm)' }} required />
              <div className="input-underline" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="label-xs" style={{ color: 'var(--secondary)' }}>Description</label>
              <input className="ghost-input" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional description" style={{ borderRadius: 'var(--radius-sm)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create Batch'}
            </button>
          </div>
        </form>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Batches', value: batches.length, icon: 'groups' },
          { label: 'Total Students', value: batches.reduce((sum: number, b: any) => sum + (b.students?.length || 0), 0), icon: 'people' },
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

      {/* Batch List */}
      {batches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', color: 'var(--on-secondary-container)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.4, display: 'block', marginBottom: '1rem' }}>groups</span>
          <p style={{ fontWeight: 600 }}>No batches yet. Create your first batch to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {batches.map((batch: any) => {
            const isExpanded = expandedId === batch._id;
            return (
              <div key={batch._id} style={{
                background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)',
                overflow: 'hidden', boxShadow: '0 4px 16px rgba(30,58,138,0.04)',
                border: isExpanded ? '2px solid rgba(30,58,138,0.1)' : '2px solid transparent',
                transition: 'border-color 0.2s',
              }}>
                {/* Batch Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : batch._id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1.25rem 1.5rem', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-lg)',
                    background: 'var(--primary-container)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '1.25rem' }}>groups</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '1rem' }}>{batch.name}</span>
                    {batch.description && (
                      <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--on-secondary-container)', fontWeight: 500, marginTop: '0.125rem' }}>
                        {batch.description}
                      </span>
                    )}
                  </div>
                  <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                    {batch.students?.length || 0} student{(batch.students?.length || 0) !== 1 ? 's' : ''}
                  </span>
                  <span className="material-symbols-outlined" style={{
                    fontSize: '1.25rem', color: 'var(--outline)',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                  }}>expand_more</span>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Add Students */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '14rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <label className="label-xs" style={{ color: 'var(--secondary)' }}>Add Students by Email</label>
                        <input
                          className="ghost-input" value={enrollEmail}
                          onChange={(e) => setEnrollEmail(e.target.value)}
                          placeholder="student1@uni.edu, student2@uni.edu"
                          style={{ borderRadius: 'var(--radius-sm)' }}
                        />
                        <div className="input-underline" />
                      </div>
                      <button
                        className="btn-primary" disabled={enrolling}
                        onClick={() => handleAddStudents(batch._id)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {enrolling ? 'Adding...' : 'Add Students'}
                      </button>
                    </div>

                    {/* Student List */}
                    {batch.students?.length > 0 ? (
                      <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid rgba(226,231,255,0.3)' }}>
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Name</th>
                              <th>Email</th>
                              <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batch.students.map((s: any, i: number) => (
                              <tr key={s._id || i}>
                                <td style={{ color: 'var(--on-secondary-container)', width: '3rem' }}>{i + 1}</td>
                                <td style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{s.name || '—'}</td>
                                <td style={{ color: 'var(--on-secondary-container)' }}>{s.email || '—'}</td>
                                <td style={{ textAlign: 'right' }}>
                                  <button
                                    className="btn-ghost"
                                    onClick={() => handleRemoveStudent(batch._id, s._id)}
                                    style={{ color: 'var(--error)', fontSize: '0.75rem' }}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>person_remove</span>
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--on-secondary-container)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-xl)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '2rem', opacity: 0.4, display: 'block', marginBottom: '0.5rem' }}>person_add</span>
                        <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>No students in this batch yet. Add them above.</p>
                      </div>
                    )}

                    {/* Delete Batch */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="btn-ghost"
                        onClick={() => setDeleteTarget(batch)}
                        style={{ color: 'var(--error)', fontSize: '0.8125rem' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                        Delete Batch
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmModal
          open={!!deleteTarget}
          title="Delete Batch"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This will remove the batch but won't delete the students.`}
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
