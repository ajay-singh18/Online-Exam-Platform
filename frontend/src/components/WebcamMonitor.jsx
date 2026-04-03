/**
 * WebcamMonitor — Compact PiP webcam preview for proctored exams.
 * Shows live feed, face count, gaze status, and AI violation count.
 */
export default function WebcamMonitor({ videoRef, faceStatus, cameraError, aiViolationCount }) {
  const { faceCount, isLookingAway, status } = faceStatus;

  /* Status color logic */
  const getStatusColor = () => {
    if (status === 'error' || status === 'denied') return '#6b7280';
    if (faceCount === 0 || faceCount >= 2) return '#ef4444';
    if (isLookingAway) return '#f59e0b';
    return '#22c55e';
  };

  const getStatusText = () => {
    if (status === 'initializing') return 'Starting camera...';
    if (status === 'denied') return 'Camera denied';
    if (status === 'error') return 'Camera error';
    if (faceCount === 0) return 'No face detected';
    if (faceCount >= 2) return `${faceCount} faces detected`;
    if (isLookingAway) return 'Looking away';
    return 'Face verified';
  };

  const statusColor = getStatusColor();

  return (
    <div style={{
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      background: 'var(--surface-container-highest)',
      boxShadow: 'var(--shadow-glass)',
    }}>
      {/* Webcam Feed */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#000' }}>
        {status === 'denied' || status === 'error' ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', padding: '1rem', textAlign: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              videocam_off
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#9ca3af', fontWeight: 600 }}>
              {cameraError || 'Camera unavailable'}
            </span>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transform: 'scaleX(-1)', /* Mirror */
              }}
            />
            {/* Live indicator */}
            <div style={{
              position: 'absolute', top: '0.375rem', left: '0.5rem',
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
              borderRadius: 'var(--radius-full)', padding: '0.125rem 0.5rem',
            }}>
              <span className="animate-pulse" style={{
                width: '0.375rem', height: '0.375rem', borderRadius: '50%',
                background: '#ef4444',
              }} />
              <span style={{ fontSize: '0.5625rem', color: 'white', fontWeight: 700, letterSpacing: '0.05em' }}>
                LIVE
              </span>
            </div>
            {/* Face count badge */}
            <div style={{
              position: 'absolute', top: '0.375rem', right: '0.5rem',
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
              borderRadius: 'var(--radius-full)', padding: '0.125rem 0.5rem',
              display: 'flex', alignItems: 'center', gap: '0.25rem',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '0.75rem', color: 'white' }}>
                face
              </span>
              <span style={{ fontSize: '0.5625rem', color: 'white', fontWeight: 700 }}>
                {faceCount}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Status Bar */}
      <div style={{
        padding: '0.5rem 0.625rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface-container-high)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{
            width: '0.5rem', height: '0.5rem', borderRadius: '50%',
            background: statusColor,
            boxShadow: `0 0 6px ${statusColor}`,
            transition: 'all 0.3s',
          }} />
          <span style={{
            fontSize: '0.625rem', fontWeight: 700,
            color: statusColor === '#22c55e' ? 'var(--on-surface)' : statusColor,
            transition: 'color 0.3s',
          }}>
            {getStatusText()}
          </span>
        </div>
        {aiViolationCount > 0 && (
          <span style={{
            fontSize: '0.5625rem', fontWeight: 800, color: 'var(--error)',
            background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-full)',
            padding: '0.125rem 0.375rem',
          }}>
            AI: {aiViolationCount}/5
          </span>
        )}
      </div>
    </div>
  );
}
