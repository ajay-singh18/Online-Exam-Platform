import { useToastStore } from '../store/toastStore';

const ICONS: Record<string, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const COLORS: Record<string, { bg: string; color: string }> = {
  success: { bg: 'rgba(78,222,163,0.15)', color: 'var(--on-tertiary-container)' },
  error:   { bg: 'var(--error-container)', color: 'var(--on-error-container)' },
  warning: { bg: '#FEF3C7', color: '#92400E' },
  info:    { bg: 'var(--secondary-container)', color: 'var(--on-primary-container)' },
};

export default function ToastContainer() {
  const toasts = useToastStore((s: any) => s.toasts);
  const removeToast = useToastStore((s: any) => s.removeToast);

  if (!toasts.length) return null;

  return (
    <div style={{
      position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
      maxWidth: '24rem', width: '100%',
    }}>
      {toasts.map((toast: any) => {
        const c = COLORS[toast.type] || COLORS.info;
        return (
          <div
            key={toast.id}
            style={{
              background: c.bg, color: c.color,
              padding: '0.875rem 1.25rem', borderRadius: 'var(--radius-xl)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              boxShadow: '0 8px 32px rgba(0,23,75,0.15)',
              animation: 'toastIn 0.3s ease-out',
              fontWeight: 600, fontSize: '0.875rem',
            }}
          >
            <span className="material-symbols-outlined filled" style={{ fontSize: '1.25rem', flexShrink: 0 }}>
              {ICONS[toast.type] || 'info'}
            </span>
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.25rem', display: 'flex' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
            </button>
          </div>
        );
      })}
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(100%); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
  );
}
