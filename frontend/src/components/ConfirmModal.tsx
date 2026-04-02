interface ConfirmModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly variant?: 'danger' | 'primary';
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export default function ConfirmModal({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'primary', onConfirm, onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-2xl)',
          padding: '2rem', maxWidth: '28rem', width: '90%',
          boxShadow: '0 24px 64px rgba(0,23,75,0.2)',
          animation: 'modalIn 0.2s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-lg)',
            background: variant === 'danger' ? 'var(--error-container)' : 'var(--secondary-container)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{
              color: variant === 'danger' ? 'var(--on-error-container)' : 'var(--on-primary-container)',
              fontSize: '1.25rem',
            }}>
              {variant === 'danger' ? 'warning' : 'help'}
            </span>
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--on-surface)' }}>{title}</h3>
        </div>

        <p style={{ color: 'var(--on-secondary-container)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button
            className="btn-primary"
            onClick={onConfirm}
            style={variant === 'danger' ? { background: 'var(--error)' } : {}}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`}</style>
    </div>
  );
}
