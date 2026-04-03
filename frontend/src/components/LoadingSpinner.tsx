export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = '3rem',
  inline = false 
}: { 
  readonly message?: string; 
  readonly size?: string;
  readonly inline?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', 
      flexDirection: inline ? 'row' : 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: inline ? 'auto' : '40vh', 
      gap: '0.75rem',
    }}>
      <div style={{
        width: size, 
        height: size, 
        borderRadius: '50%',
        border: '3px solid var(--surface-container-high)',
        borderTopColor: 'var(--on-primary-container)',
        animation: 'spin 0.8s linear infinite',
      }} />
      {!inline && message && (
        <p style={{ fontWeight: 600, color: 'var(--on-secondary-container)', fontSize: '0.875rem' }}>{message}</p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
