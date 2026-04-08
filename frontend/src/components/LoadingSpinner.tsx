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
      <svg 
        style={{
          width: size, 
          height: size, 
          animation: 'spin 0.8s linear infinite',
        }}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="var(--surface-container-high)" 
          strokeWidth="3" 
        />
        <path 
          d="M12 2C6.47715 2 2 6.47715 2 12" 
          stroke="var(--on-primary-container)" 
          strokeWidth="3" 
          strokeLinecap="round" 
        />
      </svg>
      {!inline && message && (
        <p style={{ fontWeight: 600, color: 'var(--on-secondary-container)', fontSize: '0.875rem' }}>{message}</p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
