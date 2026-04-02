import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../api/authApi';

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const { data } = await verifyEmail(token);
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may be expired or invalid.');
      }
    };
    if (token) verify();
  }, [token]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--background)', padding: '2rem',
    }}>
      <div style={{
        background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)',
        padding: '3rem', maxWidth: '28rem', width: '100%', textAlign: 'center',
        boxShadow: '0 16px 64px rgba(30,58,138,0.08)',
      }}>
        {status === 'loading' && (
          <>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', border: '3px solid var(--surface-container-high)', borderTopColor: 'var(--on-primary-container)', animation: 'spin 0.8s linear infinite', margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-container)' }}>Verifying your email...</h2>
            <p style={{ color: 'var(--on-secondary-container)', marginTop: '0.5rem', fontWeight: 500 }}>Please wait a moment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgba(78,222,163,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <span className="material-symbols-outlined filled" style={{ fontSize: '2rem', color: 'var(--on-tertiary-container)' }}>check_circle</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--on-tertiary-container)' }}>Email Verified!</h2>
            <p style={{ color: 'var(--on-secondary-container)', marginTop: '0.5rem', fontWeight: 500 }}>{message}</p>
            <button className="btn-primary" onClick={() => navigate('/login')} style={{ marginTop: '2rem', width: '100%', justifyContent: 'center' }}>
              Continue to Login
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'var(--error-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <span className="material-symbols-outlined filled" style={{ fontSize: '2rem', color: 'var(--on-error-container)' }}>error</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--error)' }}>Verification Failed</h2>
            <p style={{ color: 'var(--on-secondary-container)', marginTop: '0.5rem', fontWeight: 500 }}>{message}</p>
            <button className="btn-secondary" onClick={() => navigate('/register')} style={{ marginTop: '2rem', width: '100%', justifyContent: 'center' }}>
              Back to Register
            </button>
          </>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
