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
      <main style={{ flexGrow: 1, display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Left Hero Section */}
        <section style={{
          display: 'none',
          width: '60%',
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }} className="login-hero">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlVhzt_VjpgkhUxK3RLSNuelOhIB2VI0LIJzeN55tRSspz6ilOMRDQmR4aQFleiuTouZXAWSBhQn6t79swPLSwze_INO7SIpeid90s2HSUkG3SOuxbZPYE040v5AwzekOb1eHYQuvE5g6wCUn1mMOr1lv1H_36KWjObUMjPb1HT1esJy0__jU39pW-EHa9O7ugHz-aHN6KTDYW6u-SGs3yqVi7zjK5_zjjHZdtX6im_pPdZTcnZCPv1OdhUz2KSYPFu6Ae9-sSfg"
            alt="Academic Hall"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,23,75,0.4)' }} />
          <div style={{ position: 'relative', zIndex: 10, padding: '4rem', maxWidth: '40rem' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="material-symbols-outlined filled" style={{ color: 'var(--surface)', fontSize: '2.25rem' }}>shield_lock</span>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 900, letterSpacing: '-0.05em', color: 'var(--surface)', textTransform: 'uppercase' }}>AcademicPro</h1>
            </div>
            <h2 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--surface)', lineHeight: 1.1, marginBottom: '1.5rem' }}>
              Secure Assessment Environment
            </h2>
            <p style={{ color: 'var(--surface-container-high)', fontSize: '1.25rem', lineHeight: 1.6, fontWeight: 500 }}>
              Integrated AI proctoring and encrypted data transmission for high-stakes examinations.
              Ensuring academic integrity for institutions worldwide.
            </p>
            <div style={{ marginTop: '3rem', display: 'flex', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--surface)' }}>1.2M+</span>
                <span style={{ color: 'var(--surface-container-high)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Exams Proctored</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--surface)' }}>99.9%</span>
                <span style={{ color: 'var(--surface-container-high)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Uptime Reliability</span>
              </div>
            </div>
          </div>
          {/* Glass status bar */}
          <div className="glass-panel" style={{ position: 'absolute', bottom: '2rem', left: '4rem', zIndex: 10, padding: '1rem', borderRadius: 'var(--radius-xl)', maxWidth: '24rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="animate-pulse" style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'var(--on-tertiary-container)' }} />
              <p className="label-xs" style={{ color: 'var(--on-primary-fixed)' }}>System Status: All Services Operational</p>
            </div>
          </div>
        </section>

        {/* Right Login Form */}
        <section className="login-form-section" style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '3rem 1.5rem',
          background: 'var(--surface)',
          overflowY: 'auto',
        }}>
          <div style={{ maxWidth: '28rem', width: '100%', margin: 'auto' }}>
            <div className="text-center-mobile" style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.025em', marginBottom: '0.5rem', lineHeight: 1.3, paddingTop: '0.2rem' }}>Welcome Back</h3>
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
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.25rem' }}>mail</span>
                  <input className="ghost-input" id="email" type="email" placeholder="name@university.edu" style={{ borderRadius: 'var(--radius-sm)' }} value={email} onChange={e => setEmail(e.target.value)} required />
                  <div className="input-underline" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="label-xs" style={{ color: 'var(--secondary)' }} htmlFor="password">Access Key</label>
                  <a href="#" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-primary-container)', textDecoration: 'none' }}>Forgot Access Key?</a>
                </div>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.25rem' }}>lock</span>
                  <input className="ghost-input" id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••••••" style={{ borderRadius: 'var(--radius-sm)' }} value={password} onChange={e => setPassword(e.target.value)} required />
                  <div className="input-underline" />
                  <span
                    className="material-symbols-outlined"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', cursor: 'pointer', fontSize: '1.25rem' }}
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
                Register Your Institution
              </button>
            </div>

            <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--tertiary-container)', padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-full)' }}>
                <span className="material-symbols-outlined filled" style={{ fontSize: '0.875rem', color: 'var(--on-tertiary-container)' }}>verified_user</span>
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--on-tertiary-container)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AES-256 Encrypted Tunnel</span>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', opacity: 0.4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.875rem' }}>fingerprint</span>
                <span className="material-symbols-outlined" style={{ fontSize: '1.875rem' }}>face_retouching_natural</span>
                <span className="material-symbols-outlined" style={{ fontSize: '1.875rem' }}>location_on</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="auth-footer" style={{ background: 'var(--surface)', padding: '1.5rem 1.5rem', borderTop: '1px solid var(--surface-container-high)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', maxWidth: '90rem', margin: '0 auto', textAlign: 'center' }}>
          <p className="label-xs" style={{ color: 'var(--outline)' }}>© 2024 AcademicPro Proctoring Systems.</p>
          <div className="auth-footer-links" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
            {['Privacy Policy', 'Terms of Service', 'Security Whitepaper', 'Accessibility'].map(link => (
              <a key={link} href="#" style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--secondary)', textTransform: 'uppercase', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--on-primary-fixed)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--secondary)'}
              >{link}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @media (min-width: 768px) {
          .login-hero { display: flex !important; }
          .login-form-section { width: 40% !important; padding: 3rem 2rem !important; }
          .auth-footer { padding: 1.5rem 3rem !important; }
          .auth-footer > div { flex-direction: row !important; justify-content: space-between !important; text-align: left !important; }
        }
      `}</style>
    </div>
  );
}
