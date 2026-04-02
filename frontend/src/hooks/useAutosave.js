import { useEffect, useRef } from 'react';
import { useExamStore } from '../store/examStore';
import { saveAttempt } from '../api/attemptApi';

/**
 * Autosave hook: saves responses every 30 seconds.
 */
export function useAutosave() {
  const attempt = useExamStore((s) => s.attempt);
  const responses = useExamStore((s) => s.responses);
  const violations = useExamStore((s) => s.violations);
  const lastSavedRef = useRef(0);

  useEffect(() => {
    if (!attempt?._id) return;

    const interval = setInterval(async () => {
      try {
        /* Only send new violations since last save */
        const newViolations = lastSavedRef.current
          ? violations.slice(lastSavedRef.current)
          : violations;

        await saveAttempt(attempt._id, {
          responses,
          violations: newViolations,
        });

        lastSavedRef.current = violations.length;
        console.log('[AUTOSAVE] Progress saved');
      } catch (error) {
        console.warn('[AUTOSAVE] Failed:', error.message);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [attempt, responses, violations]);
}
