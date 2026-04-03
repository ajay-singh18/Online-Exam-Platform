import { useEffect, useCallback, useRef } from 'react';
import { useExamStore } from '../store/examStore';

/**
 * Custom hook for exam proctoring:
 * - Force fullscreen on mount
 * - Detect tab switches (visibilitychange)
 * - Detect fullscreen exits
 * - Disable right-click / Ctrl+C / Ctrl+V
 */
export function useProctoring(enabled = true) {
  const addViolation = useExamStore((s) => s.addViolation);
  const violations = useExamStore((s) => s.violations);
  const showOverlayRef = useRef(false);
  const startTime = useRef(Date.now());
  const WARM_UP_MS = 3000;

  /* Request fullscreen */
  const requestFullscreen = useCallback(async () => {
    if (!enabled) return;
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    requestFullscreen();
    startTime.current = Date.now();

    /* Tab switch detection */
    const handleVisibility = () => {
      if (document.hidden) {
        addViolation({ type: 'tabSwitch', timestamp: new Date().toISOString() });
        showOverlayRef.current = true;
      }
    };

    /* Fullscreen exit detection */
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && enabled) {
        // Skip check during warm-up (3s) to allow auto-fullscreen to settle
        if (Date.now() - startTime.current < WARM_UP_MS) return;

        addViolation({ type: 'fullscreenExit', timestamp: new Date().toISOString() });
        showOverlayRef.current = true;
      }
    };

    /* Disable right-click */
    const handleContextMenu = (e) => e.preventDefault();

    /* Disable Ctrl+C, Ctrl+V */
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v')) {
        e.preventDefault();
        addViolation({ type: 'copyPaste', timestamp: new Date().toISOString() });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);

      /* Exit fullscreen on unmount */
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [enabled, addViolation, requestFullscreen]);

  return {
    violations,
    requestFullscreen,
    violationCount: violations.length,
    shouldForceSubmit: violations.length >= 3,
  };
}
