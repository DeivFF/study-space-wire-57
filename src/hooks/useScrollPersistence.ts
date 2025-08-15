
import { useEffect, useRef, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export function useScrollPersistence(elementId: string, deps: any[] = [], waitForData = false) {
  const [scrollPositions, setScrollPositions] = useLocalStorage('scroll-positions', {});
  const elementRef = useRef<HTMLElement | null>(null);
  const isRestoringRef = useRef(false);
  const hasRestoredRef = useRef(false);
  const saveIntervalRef = useRef<NodeJS.Timeout>();
  const currentSection = deps[0] || 'default';

  // Save scroll position
  const saveScrollPosition = useCallback(() => {
    if (elementRef.current && !isRestoringRef.current) {
      setScrollPositions(prev => ({
        ...prev,
        [currentSection]: elementRef.current!.scrollTop
      }));
    }
  }, [setScrollPositions, currentSection]);

  // Restore scroll position with enhanced retry mechanism
  const restoreScrollPosition = useCallback(() => {
    const scrollPosition = scrollPositions[currentSection] || 0;
    if (elementRef.current && scrollPosition > 0 && !hasRestoredRef.current) {
      isRestoringRef.current = true;
      hasRestoredRef.current = true;
      
      const attemptRestore = (attempts = 0) => {
        if (elementRef.current && attempts < 8) {
          // Use requestAnimationFrame for better timing
          requestAnimationFrame(() => {
            if (elementRef.current) {
              elementRef.current.scrollTop = scrollPosition;
              
              // Verify the scroll was applied with a longer timeout
              setTimeout(() => {
                if (elementRef.current && Math.abs(elementRef.current.scrollTop - scrollPosition) > 10 && attempts < 7) {
                  attemptRestore(attempts + 1);
                } else {
                  isRestoringRef.current = false;
                }
              }, attempts < 3 ? 50 : 200); // Shorter initial delays, longer later ones
            }
          });
        } else {
          isRestoringRef.current = false;
        }
      };
      
      attemptRestore();
    }
  }, [scrollPositions, currentSection]);

  useEffect(() => {
    const element = document.getElementById(elementId);
    elementRef.current = element;
    hasRestoredRef.current = false; // Reset for new section

    if (element) {
      // Enhanced restore attempts with better timing
      const restoreTimers = [
        setTimeout(() => restoreScrollPosition(), 100),
        setTimeout(() => restoreScrollPosition(), 300),
        setTimeout(() => restoreScrollPosition(), 600),
        setTimeout(() => restoreScrollPosition(), 1000),
        setTimeout(() => restoreScrollPosition(), 2000)
      ];

      // Save scroll position on scroll with debounce
      const handleScroll = () => saveScrollPosition();
      element.addEventListener('scroll', handleScroll, { passive: true });

      // Auto-save every 5 seconds while scrolling
      saveIntervalRef.current = setInterval(() => {
        if (elementRef.current && elementRef.current.scrollTop > 0) {
          saveScrollPosition();
        }
      }, 5000);

      return () => {
        restoreTimers.forEach(clearTimeout);
        element.removeEventListener('scroll', handleScroll);
        if (saveIntervalRef.current) {
          clearInterval(saveIntervalRef.current);
        }
      };
    }
  }, [elementId, restoreScrollPosition, saveScrollPosition]);

  // Additional effect to restore scroll when data loads (if waitForData is true)
  useEffect(() => {
    if (waitForData && deps.length > 0) {
      // Wait for data to be loaded, then attempt restore
      const timer = setTimeout(() => {
        restoreScrollPosition();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, deps);

  // Save scroll position before page unload and on section changes
  useEffect(() => {
    const handleBeforeUnload = () => saveScrollPosition();
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      saveScrollPosition(); // Save when section changes
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveScrollPosition, currentSection]);

  return { restoreScrollPosition };
}
