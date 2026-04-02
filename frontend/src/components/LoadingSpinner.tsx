export default function LoadingSpinner({ message = 'Loading...' }: { readonly message?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '40vh', gap: '1.5rem',
    }}>
      <div style={{
        width: '3rem', height: '3rem', borderRadius: '50%',
        border: '3px solid var(--surface-container-high)',
        borderTopColor: 'var(--on-primary-container)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontWeight: 600, color: 'var(--on-secondary-container)', fontSize: '0.875rem' }}>{message}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
