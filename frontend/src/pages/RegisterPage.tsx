import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/authApi';

type RoleTab = 'student' | 'admin' | 'superAdmin';

interface RoleConfig {
  label: string;
  icon: string;
  description: string;
  color: string;
}

const ROLE_CONFIG: Record<RoleTab, RoleConfig> = {
  student: {
    label: 'Student',
    icon: 'school',
    description: 'Join your institution to take proctored exams',
    color: 'var(--on-primary-container)',
  },
  admin: {
    label: 'Administrator',
    icon: 'admin_panel_settings',
    description: 'Register your institution and manage examinations',
    color: 'var(--primary-container)',
  },
  superAdmin: {
    label: 'Super Admin',
    icon: 'shield_person',
    description: 'Platform-level access for system management',
    color: 'var(--on-tertiary-container)',
  },
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState<RoleTab>('student');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [instituteName, setInstituteName] = useState('');
  const [instituteId, setInstituteId] = useState('');
  const [superAdminKey, setSuperAdminKey] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentConfig = ROLE_CONFIG[activeRole];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!agreeTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }
    if (activeRole === 'admin' && !instituteName.trim()) {
      setError('Institute name is required for administrator registration');
      return;
    }
    if (activeRole === 'student' && !instituteId.trim()) {
      setError('Institute ID is required for student registration');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = {
        name,
        email,
        password,
        role: activeRole,
      };

      if (activeRole === 'admin') {
        payload.instituteName = instituteName;
      }
      if (activeRole === 'student') {
        payload.instituteId = instituteId;
      }
      if (activeRole === 'superAdmin') {
        payload.superAdminKey = superAdminKey;
      }

      await registerUser(payload);
      setSuccess('Registration successful! Please check your email to verify your account.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Shared input wrapper for ghost inputs
  const renderInput = (
    id: string,
    label: string,
    icon: string,
    type: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    extra?: React.ReactNode,
  ) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label className="label-xs" style={{ color: 'var(--secondary)' }} htmlFor={id}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.25rem' }}>{icon}</span>
        <input
          className="ghost-input"
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          style={{ borderRadius: 'var(--radius-sm)' }}
        />
        <div className="input-underline" />
        {extra}
      </div>
    </div>
  );

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
        }} className="register-hero">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlVhzt_VjpgkhUxK3RLSNuelOhIB2VI0LIJzeN55tRSspz6ilOMRDQmR4aQFleiuTouZXAWSBhQn6t79swPLSwze_INO7SIpeid90s2HSUkG3SOuxbZPYE040v5AwzekOb1eHYQuvE5g6wCUn1mMOr1lv1H_36KWjObUMjPb1HT1esJy0__jU39pW-EHa9O7ugHz-aHN6KTDYW6u-SGs3yqVi7zjK5_zjjHZdtX6im_pPdZTcnZCPv1OdhUz2KSYPFu6Ae9-sSfg"
            alt="Academic Hall"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,23,75,0.45)' }} />
          <div style={{ position: 'relative', zIndex: 10, padding: '4rem', maxWidth: '40rem' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="material-symbols-outlined filled" style={{ color: 'var(--surface)', fontSize: '2.25rem' }}>shield_lock</span>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 900, letterSpacing: '-0.05em', color: 'var(--surface)', textTransform: 'uppercase' }}>AcademicPro</h1>
            </div>
            <h2 style={{ fontSize: '2.75rem', fontWeight: 800, color: 'var(--surface)', lineHeight: 1.1, marginBottom: '1.5rem' }}>
              Join the Future of Academic Assessment
            </h2>
            <p style={{ color: 'var(--surface-container-high)', fontSize: '1.125rem', lineHeight: 1.7, fontWeight: 500 }}>
              Create your account to access our AI-powered proctoring platform.
              Whether you're a student, administrator, or platform manager — get started in minutes.
            </p>

            {/* Role Benefits */}
            <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: 'verified_user', text: 'AI-Powered Identity Verification' },
                { icon: 'lock', text: 'End-to-End AES-256 Encryption' },
                { icon: 'speed', text: '99.9% Platform Uptime Guarantee' },
                { icon: 'analytics', text: 'Real-Time Analytics & Insights' },
              ].map(benefit => (
                <div key={benefit.text} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="material-symbols-outlined filled" style={{ color: 'rgba(78,222,163,0.8)', fontSize: '1.25rem' }}>{benefit.icon}</span>
                  <span style={{ color: 'var(--surface)', fontWeight: 600, fontSize: '0.9375rem' }}>{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Glass status bar */}
          <div className="glass-panel" style={{ position: 'absolute', bottom: '2rem', left: '4rem', zIndex: 10, padding: '1rem', borderRadius: 'var(--radius-xl)', maxWidth: '24rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="animate-pulse" style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'var(--on-tertiary-container)' }} />
              <p className="label-xs" style={{ color: 'var(--on-primary-fixed)' }}>Trusted by 248 Institutions Worldwide</p>
            </div>
          </div>
        </section>

        {/* Right Registration Form */}
        <section style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          padding: '2.5rem 4rem',
          background: 'var(--surface)',
          overflowY: 'auto',
        }}>
          <div style={{ maxWidth: '30rem', width: '100%', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>Create Your Account</h3>
              <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500 }}>Select your role and complete registration</p>
            </div>

            {/* Role Selector — 3 panel cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
              {(Object.keys(ROLE_CONFIG) as RoleTab[]).map(role => {
                const cfg = ROLE_CONFIG[role];
                const isActive = activeRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => setActiveRole(role)}
                    style={{
                      padding: '1rem 0.75rem',
                      borderRadius: 'var(--radius-xl)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease',
                      background: isActive ? 'var(--primary-container)' : 'var(--surface-container-low)',
                      color: isActive ? 'var(--on-primary)' : 'var(--on-surface)',
                      boxShadow: isActive ? '0 4px 16px rgba(0,23,75,0.2)' : 'none',
                      transform: isActive ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: isActive ? 'var(--primary-fixed-dim)' : cfg.color }}>{cfg.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{cfg.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Role Description */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: currentConfig.color }}>info</span>
              <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--on-surface-variant)' }}>{currentConfig.description}</p>
            </div>

            {/* Alerts */}
            {error && (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--error-container)', color: 'var(--on-error-container)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>error</span>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(78,222,163,0.15)', color: 'var(--on-tertiary-container)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined filled" style={{ fontSize: '1.125rem' }}>check_circle</span>
                {success}
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Full Name */}
              {renderInput('name', 'Full Name', 'person', 'text', name, setName, 'John Doe')}

              {/* Email */}
              {renderInput('reg-email', 'Institutional Email', 'mail', 'email', email, setEmail, 'name@university.edu')}

              {/* Conditional Fields Based on Role */}
              {activeRole === 'admin' && (
                renderInput('instituteName', 'Institute Name', 'business', 'text', instituteName, setInstituteName, 'e.g. MIT School of Engineering')
              )}

              {activeRole === 'student' && (
                renderInput('instituteId', 'Institute ID', 'tag', 'text', instituteId, setInstituteId, 'Provided by your institution admin')
              )}

              {activeRole === 'superAdmin' && (
                renderInput('superAdminKey', 'Platform Access Key', 'vpn_key', 'password', superAdminKey, setSuperAdminKey, 'Enter your platform authorization key')
              )}

              {/* Password */}
              {renderInput('reg-password', 'Create Password', 'lock', showPassword ? 'text' : 'password', password, setPassword, '••••••••••••',
                <span
                  className="material-symbols-outlined"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', cursor: 'pointer', fontSize: '1.25rem' }}
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              )}

              {/* Confirm Password */}
              {renderInput('confirmPassword', 'Confirm Password', 'lock_reset', showPassword ? 'text' : 'password', confirmPassword, setConfirmPassword, '••••••••••••')}

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {[1, 2, 3, 4].map(level => (
                    <div key={level} style={{
                      flex: 1, height: '3px', borderRadius: 'var(--radius-full)',
                      background: password.length >= level * 3
                        ? level <= 1 ? 'var(--error)' : level <= 2 ? '#F59E0B' : 'var(--on-tertiary-container)'
                        : 'var(--surface-container-high)',
                      transition: 'background 0.3s ease',
                    }} />
                  ))}
                </div>
              )}

              {/* Terms */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.25rem 0' }}>
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{ width: '1rem', height: '1rem', accentColor: 'var(--on-primary-container)', marginTop: '0.125rem', flexShrink: 0 }}
                />
                <label htmlFor="terms" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--secondary)', lineHeight: 1.5 }}>
                  I agree to the{' '}
                  <a href="#" style={{ color: 'var(--on-primary-container)', fontWeight: 700, textDecoration: 'none' }}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" style={{ color: 'var(--on-primary-container)', fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</a>
                </label>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-pulse" style={{ fontSize: '1.25rem' }}>hourglass_top</span>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create {currentConfig.label} Account
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Already have an account */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--surface-container-high)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--secondary)', marginBottom: '0.75rem' }}>Already have an account?</p>
              <button
                className="btn-secondary"
                style={{ width: '100%' }}
                onClick={() => navigate('/login')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem', marginRight: '0.5rem' }}>login</span>
                Sign In to Your Account
              </button>
            </div>

            {/* Security badge */}
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--tertiary-container)', padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-full)' }}>
                <span className="material-symbols-outlined filled" style={{ fontSize: '0.875rem', color: 'var(--on-tertiary-container)' }}>verified_user</span>
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--on-tertiary-container)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AES-256 Encrypted Registration</span>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', opacity: 0.4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>fingerprint</span>
                <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>face_retouching_natural</span>
                <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>enhanced_encryption</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--surface)', padding: '1.5rem 3rem', borderTop: '1px solid var(--surface-container-high)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '90rem', margin: '0 auto' }}>
          <p className="label-xs" style={{ color: 'var(--outline)' }}>© 2024 AcademicPro Proctoring Systems. Secure Assessment Environment.</p>
          <div style={{ display: 'flex', gap: '2rem' }}>
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
          .register-hero { display: flex !important; }
          section:last-of-type { width: 40% !important; padding: 2.5rem 4rem !important; }
        }
      `}</style>
    </div>
  );
}
