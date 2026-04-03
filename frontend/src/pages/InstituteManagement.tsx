import { useState, useEffect } from 'react';
import { getInstitutes, createInstitute, updateInstitute, deleteInstitute } from '../api/instituteApi';
import { useToastStore } from '../store/toastStore';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';

export default function InstituteManagement() {
  const addToast = useToastStore((s: any) => s.addToast);

  const [institutes, setInstitutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Create form
  const [newName, setNewName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newPlan, setNewPlan] = useState('free');
  const [saving, setSaving] = useState(false);

  const fetchInstitutes = async () => {
    try {
      const { data } = await getInstitutes();
      setInstitutes(data.institutes || data || []);
    } catch { addToast('Failed to load institutes', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInstitutes(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { addToast('Institute name required', 'warning'); return; }
    setSaving(true);
    try {
      await createInstitute({ name: newName, ownerEmail: newOwnerEmail, plan: newPlan });
      addToast('Institute created', 'success');
      setShowCreate(false);
      setNewName(''); setNewOwnerEmail(''); setNewPlan('free');
      fetchInstitutes();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to create', 'error');
    } finally { setSaving(false); }
  };

  const handleUpdatePlan = async (id: string, plan: string) => {
    try {
      await updateInstitute(id, { plan });
      setInstitutes(prev => prev.map(i => i._id === id ? { ...i, plan } : i));
      addToast('Plan updated', 'success');
    } catch { addToast('Update failed', 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInstitute(deleteTarget._id);
      setInstitutes(prev => prev.filter(i => i._id !== deleteTarget._id));
      addToast('Institute deleted completely', 'success');
      setDeleteTarget(null);
    } catch {
      addToast('Failed to delete institute', 'error');
    }
  };

  if (loading) return <LoadingSpinner message="Loading institutes..." />;

  return (
    <div style={{ padding: '2rem', maxWidth: '72rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)' }}>Institute Management</h2>
          <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500 }}>{institutes.length} institute{institutes.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{showCreate ? 'close' : 'add'}</span>
          {showCreate ? 'Cancel' : 'Add Institute'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontWeight: 800, color: 'var(--primary-container)', fontSize: '1rem' }}>Create New Institute</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="label-xs" style={{ color: 'var(--secondary)' }}>Institute Name *</label>
              <input className="ghost-input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. MIT Engineering" style={{ borderRadius: 'var(--radius-sm)' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="label-xs" style={{ color: 'var(--secondary)' }}>Owner Email *</label>
              <input className="ghost-input" type="email" value={newOwnerEmail} onChange={(e) => setNewOwnerEmail(e.target.value)} placeholder="admin@institute.edu" style={{ borderRadius: 'var(--radius-sm)' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="label-xs" style={{ color: 'var(--secondary)' }}>Plan</label>
              <select className="ghost-input" value={newPlan} onChange={(e) => setNewPlan(e.target.value)} style={{ borderRadius: 'var(--radius-sm)', paddingLeft: '1rem' }}>
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
            {saving ? 'Creating...' : 'Create Institute'}
          </button>
        </form>
      )}

      {/* Institute Cards */}
      {institutes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-secondary-container)', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)' }}>
          <p style={{ fontWeight: 600 }}>No institutes registered yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {institutes.map((inst: any) => (
            <div key={inst._id} style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', boxShadow: '0 4px 16px rgba(30,58,138,0.04)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '1.0625rem' }}>{inst.name}</h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--on-secondary-container)', marginTop: '0.25rem' }}>{inst.ownerEmail}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`badge ${inst.plan === 'pro' ? 'badge-success' : inst.plan === 'starter' ? 'badge-info' : ''}`}>
                    {(inst.plan || 'free').toUpperCase()}
                  </span>
                  <button className="btn-ghost" style={{ padding: '0.25rem', color: 'var(--error)' }} onClick={() => setDeleteTarget(inst)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>delete</span>
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem' }}>
                <div><span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>Student Limit</span><p style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{inst.studentLimit ?? '∞'}</p></div>
                <div><span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>Admin Limit</span><p style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{inst.adminLimit ?? '∞'}</p></div>
                <div><span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>Created</span><p style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{inst.createdAt ? new Date(inst.createdAt).toLocaleDateString() : '—'}</p></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                {['free', 'starter', 'pro'].map(plan => (
                  <button key={plan} onClick={() => handleUpdatePlan(inst._id, plan)}
                    className={inst.plan === plan ? 'btn-primary' : 'btn-secondary'}
                    style={{ flex: 1, fontSize: '0.75rem', padding: '0.5rem', justifyContent: 'center' }}
                    disabled={inst.plan === plan}
                  >
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Institute"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This action is irreversible and will cascade-delete ALL users, exams, questions, and attempts under this institute.`}
        confirmLabel="Delete Permanently"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
