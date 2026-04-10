import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { updateMe } from '../api/userApi';
import { getSubscriptionStatus, getTeamMembers, inviteAdmin, removeAdmin } from '../api/paymentApi';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const user = useAuthStore((s: any) => s.user);
  const updateUser = useAuthStore((s: any) => s.updateUser);
  const addToast = useToastStore((s: any) => s.addToast);
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState<'profile' | 'billing' | 'team'>('profile');

  /* ── Profile State ─── */
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  /* ── Billing State ─── */
  const [billing, setBilling] = useState<any>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  /* ── Team State ─── */
  const [team, setTeam] = useState<any[]>([]);
  const [teamMeta, setTeamMeta] = useState<any>({});
  const [teamLoading, setTeamLoading] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', password: '' });
  const [inviting, setInviting] = useState(false);

  useEffect(() => { if (user?.name) setName(user.name); }, [user]);

  useEffect(() => {
    if (tab === 'billing' && isAdmin && !billing) {
      setBillingLoading(true);
      getSubscriptionStatus()
        .then(({ data }) => setBilling(data))
        .catch(() => addToast('Failed to load billing info', 'error'))
        .finally(() => setBillingLoading(false));
    }
    if (tab === 'team' && isAdmin && team.length === 0) {
      fetchTeam();
    }
  }, [tab]);

  const fetchTeam = async () => {
    setTeamLoading(true);
    try {
      const { data } = await getTeamMembers();
      setTeam(data.members || []);
      setTeamMeta({ adminLimit: data.adminLimit, plan: data.plan });
    } catch {
      addToast('Failed to load team', 'error');
    } finally {
      setTeamLoading(false);
    }
  };

  /* ── Profile Handlers ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { addToast('Name cannot be empty', 'warning'); return; }
    if (password && password !== confirmPassword) { addToast('Passwords do not match', 'error'); return; }

    setSubmitting(true);
    try {
      const payload: any = { name };
      if (password) {
        if (password.length < 6) { addToast('Password must be at least 6 characters', 'warning'); setSubmitting(false); return; }
        payload.password = password;
      }
      const { data } = await updateMe(payload);
      if (data.success && data.user) {
        updateUser(data.user);
        addToast('Profile updated successfully', 'success');
        setPassword(''); setConfirmPassword(''); setIsEditing(false);
      } else {
        addToast('Failed to update profile', 'error');
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Error updating profile', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Team Handlers ─── */
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email || !inviteForm.password) {
      addToast('All fields are required', 'warning'); return;
    }
    setInviting(true);
    try {
      await inviteAdmin(inviteForm);
      addToast(`Admin ${inviteForm.name} invited successfully!`, 'success');
      setInviteForm({ name: '', email: '', password: '' });
      setShowInvite(false);
      fetchTeam();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to invite admin', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the team?`)) return;
    try {
      await removeAdmin(userId);
      addToast(`${memberName} removed`, 'success');
      fetchTeam();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to remove admin', 'error');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    ...(isAdmin ? [
      { id: 'billing', label: 'Billing', icon: 'credit_card' },
      { id: 'team', label: 'Team', icon: 'group' },
    ] : []),
  ];

  const ownerEmail = user?.instituteId?.ownerEmail || '';
  const isOwner = user?.email === ownerEmail || team.some((m: any) => m.email === user?.email && m.isOwner);

  return (
    <div style={{ padding: '2rem', maxWidth: '48rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)' }}>Settings</h2>
        <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500 }}>Manage your profile, billing, and team</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-container)', borderRadius: 'var(--radius-xl)', padding: '0.25rem' }}>
        {tabs.map((t: any) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.75rem', border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.875rem',
              background: tab === t.id ? 'var(--surface-container-lowest)' : 'transparent',
              color: tab === t.id ? 'var(--primary-container)' : 'var(--on-secondary-container)',
              boxShadow: tab === t.id ? '0 2px 8px rgba(30,58,138,0.08)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ Profile Tab ═══ */}
      {tab === 'profile' && (
        <>
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
                <button type="button" className="btn-secondary" onClick={() => { setIsEditing(false); setName(user?.name || ''); setPassword(''); setConfirmPassword(''); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          )}
        </>
      )}

      {/* ═══ Billing Tab ═══ */}
      {tab === 'billing' && isAdmin && (
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '1.125rem' }}>Subscription</h3>
            <button className="btn-primary" onClick={() => navigate('/admin/pricing')}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>upgrade</span>
              Manage Plan
            </button>
          </div>

          {billingLoading ? (
            <p style={{ color: 'var(--on-secondary-container)', fontWeight: 600 }}>Loading...</p>
          ) : billing ? (
            <>
              {/* Plan badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  padding: '0.5rem 1.25rem', borderRadius: '999px', fontWeight: 900, fontSize: '0.875rem', letterSpacing: '0.05em', textTransform: 'uppercase',
                  background: billing.plan === 'pro' ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : billing.plan === 'starter' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'var(--surface-container-high)',
                  color: billing.plan === 'free' ? 'var(--on-secondary-container)' : '#fff',
                }}>
                  {billing.plan} Plan
                </div>
                <span style={{ fontSize: '0.875rem', color: 'var(--on-secondary-container)', fontWeight: 600 }}>
                  {billing.instituteName}
                </span>
              </div>

              {/* Usage bars */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {[
                  { label: 'Students', current: billing.studentCount, limit: billing.studentLimit, color: '#3b82f6' },
                  { label: 'Admins', current: billing.adminCount, limit: billing.adminLimit, color: '#8b5cf6' },
                ].map((u) => {
                  const pct = Math.min((u.current / u.limit) * 100, 100);
                  const isNearLimit = pct > 80;
                  return (
                    <div key={u.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--on-surface)' }}>{u.label}</span>
                        <span style={{ fontWeight: 800, fontSize: '0.875rem', color: isNearLimit ? '#ef4444' : u.color }}>
                          {u.current} / {u.limit}
                        </span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--surface-container-high)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: isNearLimit ? '#ef4444' : u.color,
                          borderRadius: '4px',
                          transition: 'width 0.5s',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ═══ Team Tab ═══ */}
      {tab === 'team' && isAdmin && (
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '1.125rem' }}>Team Members</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--on-secondary-container)', fontWeight: 600 }}>
                {team.length} of {teamMeta.adminLimit || '?'} admin slots used
              </p>
            </div>
            {isOwner && (
              <button className="btn-primary" onClick={() => setShowInvite(!showInvite)} disabled={team.length >= (teamMeta.adminLimit || 2)}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>person_add</span>
                {team.length >= (teamMeta.adminLimit || 2) ? 'Limit Reached' : 'Add Admin'}
              </button>
            )}
          </div>

          {/* Invite form */}
          {showInvite && (
            <form onSubmit={handleInvite} style={{ background: 'var(--surface-container)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '1rem' }}>Invite New Admin</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label className="label-xs" style={{ color: 'var(--secondary)' }}>Full Name</label>
                  <input className="ghost-input" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} placeholder="Admin name" style={{ borderRadius: 'var(--radius-sm)' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label className="label-xs" style={{ color: 'var(--secondary)' }}>Email</label>
                  <input type="email" className="ghost-input" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="admin@email.com" style={{ borderRadius: 'var(--radius-sm)' }} required />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label className="label-xs" style={{ color: 'var(--secondary)' }}>Temporary Password</label>
                <input type="password" className="ghost-input" value={inviteForm.password} onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })} placeholder="Set a password for the new admin" style={{ borderRadius: 'var(--radius-sm)' }} required minLength={6} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowInvite(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={inviting}>{inviting ? 'Inviting...' : 'Send Invite'}</button>
              </div>
            </form>
          )}

          {/* Team list */}
          {teamLoading ? (
            <p style={{ color: 'var(--on-secondary-container)', fontWeight: 600, textAlign: 'center', padding: '2rem' }}>Loading team...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {team.map((m: any) => (
                <div key={m._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem 1.25rem', background: 'var(--surface-container)', borderRadius: 'var(--radius-xl)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%',
                      background: m.isOwner ? 'linear-gradient(135deg, #f59e0b30, #f59e0b10)' : 'var(--surface-container-high)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: '0.875rem', color: m.isOwner ? '#f59e0b' : 'var(--on-secondary-container)',
                    }}>
                      {m.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--on-surface)' }}>{m.name}</span>
                        {m.isOwner && (
                          <span style={{
                            fontSize: '0.6875rem', fontWeight: 800, color: '#f59e0b',
                            background: '#f59e0b15', padding: '0.125rem 0.5rem', borderRadius: '999px',
                          }}>OWNER</span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--on-secondary-container)' }}>{m.email}</span>
                    </div>
                  </div>
                  {isOwner && !m.isOwner && (
                    <button
                      onClick={() => handleRemove(m._id, m.name)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.375rem',
                        fontWeight: 700, fontSize: '0.8125rem',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>person_remove</span>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upgrade prompt if near limit */}
          {team.length >= (teamMeta.adminLimit || 2) && (
            <div style={{
              background: '#f59e0b10', border: '1px solid #f59e0b30',
              borderRadius: 'var(--radius-xl)', padding: '1rem 1.5rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: '#f59e0b' }}>warning</span>
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface)', fontWeight: 600 }}>
                You've reached the admin limit for your <strong>{teamMeta.plan}</strong> plan.{' '}
                <span
                  onClick={() => navigate('/admin/pricing')}
                  style={{ color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', fontWeight: 800 }}
                >
                  Upgrade now
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
