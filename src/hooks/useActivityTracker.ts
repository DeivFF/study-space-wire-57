import { useEffect, useCallback } from 'react';

interface UseActivityTrackerProps {
  onActivity: () => void;
  debounceMs?: number;
}

export const useActivityTracker = ({ onActivity, debounceMs = 1000 }: UseActivityTrackerProps) => {
  const debouncedActivity = useCallback(() => {
    let timeoutId: NodeJS.Timeout;
    
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(onActivity, debounceMs);
    };
  }, [onActivity, debounceMs]);

  const handleActivity = debouncedActivity();

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [handleActivity]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        onActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [onActivity]);
};