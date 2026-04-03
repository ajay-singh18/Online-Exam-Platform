import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { updateMe } from '../api/userApi';

export default function Settings() {
  const user = useAuthStore((s: any) => s.user);
  const updateUser = useAuthStore((s: any) => s.updateUser);
  const addToast = useToastStore((s: any) => s.addToast);

  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Name cannot be empty', 'warning');
      return;
    }
    if (password && password !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = { name };
      if (password) {
        if (password.length < 6) {
          addToast('Password must be at least 6 characters', 'warning');
          setSubmitting(false);
          return;
        }
        payload.password = password;
      }

      const { data } = await updateMe(payload);
      if (data.success && data.user) {
        updateUser(data.user);
        addToast('Profile updated successfully', 'success');
        setPassword('');
        setConfirmPassword('');
        setIsEditing(false);
      } else {
        addToast('Failed to update profile', 'error');
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Error updating profile', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '40rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)' }}>Settings</h2>
        <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500 }}>Update your profile and account preferences</p>
      </div>

      {!isEditing ? (
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '1.125rem' }}>Personal Information</h3>
            <button className="btn-secondary" onClick={() => setIsEditing(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit</span>
              Edit Profile
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span className="label-xs" style={{ color: 'var(--secondary)' }}>Full Name</span>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--on-surface)' }}>{user?.name || '-'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span className="label-xs" style={{ color: 'var(--secondary)' }}>Email</span>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--on-surface)' }}>{user?.email || '-'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span className="label-xs" style={{ color: 'var(--secondary)' }}>Role</span>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--on-surface)', textTransform: 'capitalize' }}>{user?.role || '-'}</span>
            </div>
          </div>
        </div>
      ) : (
      <form onSubmit={handleSubmit} style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '1.125rem', marginBottom: '0.5rem' }}>Personal Information</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label className="label-xs" style={{ color: 'var(--secondary)' }}>Full Name</label>
          <input className="ghost-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" style={{ borderRadius: 'var(--radius-sm)' }} required />
          <div className="input-underline" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label className="label-xs" style={{ color: 'var(--secondary)' }}>Email <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 'normal', color: 'var(--outline)' }}>(cannot be changed)</span></label>
          <input className="ghost-input" value={user?.email || ''} readOnly style={{ borderRadius: 'var(--radius-sm)', opacity: 0.6, cursor: 'not-allowed' }} disabled />
        </div>

        <div style={{ height: '1px', background: 'var(--surface-container-high)', margin: '1rem 0' }} />

        <h3 style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '1.125rem', marginBottom: '0.5rem' }}>Security</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label className="label-xs" style={{ color: 'var(--secondary)' }}>New Password <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 'normal', color: 'var(--outline)' }}>(leave blank to keep current)</span></label>
          <input type="password" className="ghost-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ borderRadius: 'var(--radius-sm)' }} minLength={6} />
          <div className="input-underline" />
        </div>

        {password && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="label-xs" style={{ color: 'var(--secondary)' }}>Confirm New Password</label>
            <input type="password" className="ghost-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" style={{ borderRadius: 'var(--radius-sm)' }} required />
            <div className="input-underline" />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <button type="button" className="btn-secondary" onClick={() => { setIsEditing(false); setName(user?.name || ''); setPassword(''); setConfirmPassword(''); }}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
