import { useState, useEffect } from 'react';
import { useToastStore } from '../store/toastStore';
import { getAllPlans, createPlan, updatePlan, deletePlan } from '../api/planApi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PlanManagement() {
  const addToast = useToastStore((s: any) => s.addToast);

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const [formData, setFormData] = useState({
    planId: '',
    name: '',
    price: 0,
    studentLimit: 50,
    adminLimit: 2,
    features: '',
    colorHint: '#3b82f6',
    isRecommended: false,
    isActive: true,
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data } = await getAllPlans();
      setPlans(data.plans || []);
    } catch {
      addToast('Failed to load plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openAddModal = () => {
    setFormData({
      planId: '', name: '', price: 0, studentLimit: 50, adminLimit: 2,
      features: '', colorHint: '#3b82f6', isRecommended: false, isActive: true
    });
    setEditingPlan(null);
    setShowModal(true);
  };

  const openEditModal = (plan: any) => {
    setFormData({
      planId: plan.planId,
      name: plan.name,
      price: plan.price,
      studentLimit: plan.studentLimit,
      adminLimit: plan.adminLimit,
      features: plan.features.join('\n'), // Convert array to newline string
      colorHint: plan.colorHint,
      isRecommended: plan.isRecommended,
      isActive: plan.isActive,
    });
    setEditingPlan(plan);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.planId || !formData.name) return;

    const payload = {
      ...formData,
      features: formData.features.split('\n').filter(f => f.trim() !== '')
    };

    try {
      if (editingPlan) {
        await updatePlan(editingPlan._id, payload);
        addToast('Plan updated successfully', 'success');
      } else {
        await createPlan(payload);
        addToast('Plan created successfully', 'success');
      }
      setShowModal(false);
      fetchPlans();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the ${name} plan?`)) return;
    try {
      await deletePlan(id);
      addToast('Plan deleted', 'success');
      fetchPlans();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to delete plan', 'error');
    }
  };

  if (loading) return <LoadingSpinner message="Loading plans..." />;

  return (
    <div style={{ padding: '2rem', maxWidth: '72rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--primary-container)', letterSpacing: '-0.025em' }}>
            Subscription Plans
          </h2>
          <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500, marginTop: '0.25rem' }}>
            Manage pricing tiers, limits, and features.
          </p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add</span>
          Create Plan
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {plans.map(plan => (
          <div key={plan._id} style={{
            background: 'var(--surface-container-lowest)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.5rem',
            border: `2px solid ${plan.isActive ? plan.colorHint : 'var(--surface-container-high)'}`,
            opacity: plan.isActive ? 1 : 0.6,
            position: 'relative'
          }}>
            {plan.isRecommended && (
              <span style={{ position: 'absolute', top: -12, right: 20, background: plan.colorHint, color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' }}>RECOMMENDED</span>
            )}
            {!plan.isActive && (
              <span style={{ position: 'absolute', top: -12, right: 20, background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' }}>INACTIVE</span>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--on-surface)' }}>{plan.name}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => openEditModal(plan)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}><span className="material-symbols-outlined">edit</span></button>
                {plan.planId !== 'free' && (
                  <button onClick={() => handleDelete(plan._id, plan.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><span className="material-symbols-outlined">delete</span></button>
                )}
              </div>
            </div>

            <div style={{ margin: '1rem 0' }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: plan.colorHint }}>
                {plan.price === 0 ? 'Free' : `₹${plan.price}`}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--surface-container)', padding: '1rem', borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--on-secondary-container)', fontWeight: 600, textTransform: 'uppercase' }}>Students</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--on-surface)' }}>{plan.studentLimit.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--on-secondary-container)', fontWeight: 600, textTransform: 'uppercase' }}>Admins</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--on-surface)' }}>{plan.adminLimit.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.875rem', color: 'var(--on-secondary-container)' }}>
              <strong>Features ({plan.features.length})</strong>
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                {plan.features.slice(0, 3).map((f: string, i: number) => <li key={i}>{f}</li>)}
                {plan.features.length > 3 && <li>+{plan.features.length - 3} more</li>}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface-container-lowest)', padding: '2rem', borderRadius: 'var(--radius-2xl)', width: '100%', maxWidth: '32rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--on-surface)' }}>
              {editingPlan ? 'Edit Plan' : 'Create Plan'}
            </h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label className="label-xs" style={{ color: 'var(--secondary)' }}>Internal ID (e.g. starter)</label>
                  <input className="ghost-input" value={formData.planId} onChange={e => setFormData({ ...formData, planId: e.target.value })} disabled={!!editingPlan} required />
                  <div className="input-underline" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label className="label-xs" style={{ color: 'var(--secondary)' }}>Display Name</label>
                  <input className="ghost-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                  <div className="input-underline" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label className="label-xs" style={{ color: 'var(--secondary)' }}>Price (₹)</label>
                  <input type="number" className="ghost-input" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} required />
                  <div className="input-underline" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label className="label-xs" style={{ color: 'var(--secondary)' }}>Student Limit</label>
                  <input type="number" className="ghost-input" value={formData.studentLimit} onChange={e => setFormData({ ...formData, studentLimit: Number(e.target.value) })} required />
                  <div className="input-underline" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label className="label-xs" style={{ color: 'var(--secondary)' }}>Admin Limit</label>
                  <input type="number" className="ghost-input" value={formData.adminLimit} onChange={e => setFormData({ ...formData, adminLimit: Number(e.target.value) })} required />
                  <div className="input-underline" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label className="label-xs" style={{ color: 'var(--secondary)' }}>Features (One per line)</label>
                <textarea 
                  value={formData.features} 
                  onChange={e => setFormData({ ...formData, features: e.target.value })} 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-container-highest)', minHeight: '100px', background: 'var(--surface-container-lowest)', color: 'var(--on-surface)', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                  <label className="label-xs" style={{ color: 'var(--secondary)' }}>Theme Color</label>
                  <input type="color" value={formData.colorHint} onChange={e => setFormData({ ...formData, colorHint: e.target.value })} style={{ width: '100%', height: '40px', padding: '0 2px', border: '1px solid var(--surface-container-highest)', borderRadius: '4px', cursor: 'pointer' }} />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, marginTop: '1.25rem' }}>
                  <input type="checkbox" id="isRec" checked={formData.isRecommended} onChange={e => setFormData({ ...formData, isRecommended: e.target.checked })} style={{ width: '1.2rem', height: '1.2rem' }} />
                  <label htmlFor="isRec" style={{ fontWeight: 600, color: 'var(--on-surface)' }}>Recommended</label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, marginTop: '1.25rem' }}>
                  <input type="checkbox" id="isAct" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} style={{ width: '1.2rem', height: '1.2rem' }} />
                  <label htmlFor="isAct" style={{ fontWeight: 600, color: 'var(--on-surface)' }}>Active</label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
