import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { loginUser } from '../api/authApi';

export default function LoginPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s: any) => s.setAuth);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await loginUser({ email, password });
      setAuth(data.user, data.accessToken);

      const redirectMap: Record<string, string> = {
        superAdmin: '/superadmin',
        admin: '/admin',
        student: '/student',
      };
      navigate(redirectMap[data.user.role] || '/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.5rem', background: 'transparent' }}>
        <div className="auth-card" style={{ maxWidth: '28rem', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', marginBottom: '1.5rem' }}>
              <span className="material-symbols-outlined filled" style={{ color: 'var(--on-primary-container)', fontSize: '2rem' }}>shield_lock</span>
              <span style={{ fontSize: '1.375rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--primary-container)' }}>AcademicPro</span>
            </div>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.025em', marginBottom: '0.5rem', lineHeight: 1.3 }}>Welcome Back</h3>
            <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500 }}>Log in to your secure proctoring portal</p>
          </div>

          {/* Tab Switcher */}
          <div className="tab-switcher" style={{ marginBottom: '2rem' }}>
            <button className={activeTab === 'student' ? 'active' : ''} onClick={() => setActiveTab('student')}>Student Access</button>
            <button className={activeTab === 'admin' ? 'active' : ''} onClick={() => setActiveTab('admin')}>Administrator</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {error && <div style={{ padding: '0.75rem', background: 'var(--error-container)', color: 'var(--on-error-container)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>{error}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="label-xs" style={{ color: 'var(--secondary)' }} htmlFor="email">Institutional Email</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.25rem', pointerEvents: 'none', zIndex: 1 }}>mail</span>
                <input className="ghost-input" id="email" type="email" placeholder="name@university.edu" style={{ borderRadius: 'var(--radius-sm)', paddingLeft: '3rem' }} value={email} onChange={e => setEmail(e.target.value)} required />
                <div className="input-underline" />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="label-xs" style={{ color: 'var(--secondary)' }} htmlFor="password">Access Key</label>
                <a href="#" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-primary-container)', textDecoration: 'none' }}>Forgot Access Key?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.25rem', pointerEvents: 'none', zIndex: 1 }}>lock</span>
                <input className="ghost-input" id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••••••" style={{ borderRadius: 'var(--radius-sm)', paddingLeft: '3rem', paddingRight: '3rem' }} value={password} onChange={e => setPassword(e.target.value)} required />
                <div className="input-underline" />
                <span
                  className="material-symbols-outlined"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', cursor: 'pointer', fontSize: '1.25rem', zIndex: 1 }}
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
              <input type="checkbox" id="remember" style={{ width: '1rem', height: '1rem', accentColor: 'var(--on-primary-container)' }} />
              <label htmlFor="remember" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--secondary)' }}>Remember this device for 30 days</label>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Authenticating...' : 'Enter Secure Session'}
              {!loading && <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>arrow_forward</span>}
            </button>
          </form>

          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--surface-container-high)' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--secondary)', marginBottom: '1rem', textAlign: 'center' }}>New to AcademicPro?</p>
            <button className="btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/register')}>
              Register Your Account
            </button>
          </div>


        </div>
      </main>

      <footer style={{ background: 'transparent', padding: '1.5rem', borderTop: '1px solid var(--surface-container-high)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', maxWidth: '90rem', margin: '0 auto', textAlign: 'center' }}>
          <p className="label-xs" style={{ color: 'var(--outline)' }}>© 2024 AcademicPro Proctoring Systems.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
            {['Privacy Policy', 'Terms of Service', 'Security Whitepaper', 'Accessibility'].map(link => (
              <a key={link} href="#" style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--secondary)', textTransform: 'uppercase', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--on-primary-fixed)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--secondary)'}
              >{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
