import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/authApi';

type RoleTab = 'student' | 'admin';

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
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalContent, setModalContent] = useState<'terms' | 'privacy' | null>(null);

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
      <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.5rem', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '30rem', width: '100%', margin: '0 auto' }}>

          {/* Header */}
          <div className="text-center-mobile" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', marginBottom: '1.5rem' }}>
              <span className="material-symbols-outlined filled" style={{ color: 'var(--on-primary-container)', fontSize: '2rem' }}>shield_lock</span>
              <span style={{ fontSize: '1.375rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--primary-container)' }}>AcademicPro</span>
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.025em', marginBottom: '0.5rem', textAlign: 'center' }}>Create Your Account</h3>
            <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500, textAlign: 'center' }}>Select your role and complete registration</p>
          </div>

          {/* Role Selector — 2 panel cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
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
                <span onClick={() => setModalContent('terms')} style={{ color: 'var(--on-primary-container)', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>Terms of Service</span>
                {' '}and{' '}
                <span onClick={() => setModalContent('privacy')} style={{ color: 'var(--on-primary-container)', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>Privacy Policy</span>
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
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--surface)', padding: '1.5rem', borderTop: '1px solid var(--surface-container-high)' }}>
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

      {/* Terms & Privacy Modal */}
      {modalContent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', maxWidth: '35rem', width: '90%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--on-surface)' }}>
              {modalContent === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            </h2>
            <div style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              {modalContent === 'terms' ? (
                <>
                  <p>Welcome to AcademicPro. By accessing our platform, you agree to these terms.</p>
                  <h3 style={{ marginTop: '1.25rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--on-surface)' }}>1. Usage</h3>
                  <p>You agree to use this platform strictly for educational assessment purposes. Any unauthorized access, cheating, or reverse engineering of the proctoring system will result in immediate termination.</p>
                  <h3 style={{ marginTop: '1.25rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--on-surface)' }}>2. Responsibilities</h3>
                  <p>Institutions are responsible for accurate enrollment and oversight. Students are responsible for maintaining a stable internet connection and acceptable testing environment per proctoring guidelines.</p>
                  <h3 style={{ marginTop: '1.25rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--on-surface)' }}>3. Liability</h3>
                  <p>AcademicPro provides the tools "as is" and is not liable for indirect damages, temporary outages, or assessment outcomes.</p>
                </>
              ) : (
                <>
                  <p>Your privacy is critically important to us at AcademicPro.</p>
                  <h3 style={{ marginTop: '1.25rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--on-surface)' }}>1. Data Collection</h3>
                  <p>We collect essential profile data and continuous academic monitoring data during exams (including visibility changes and IP addresses) to ensure assessment integrity.</p>
                  <h3 style={{ marginTop: '1.25rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--on-surface)' }}>2. Data Usage</h3>
                  <p>Data is strictly utilized to facilitate examinations and report analytics to your governing institution. We do not sell personal data to third parties.</p>
                  <h3 style={{ marginTop: '1.25rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--on-surface)' }}>3. Security</h3>
                  <p>We implement AES-256 encryption at rest and in transit. Access to sensitive records is restricted using strict role-based access controllers.</p>
                </>
              )}
            </div>
            <button className="btn-primary" onClick={() => setModalContent(null)} style={{ width: '100%', justifyContent: 'center' }}>
              Accept & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
