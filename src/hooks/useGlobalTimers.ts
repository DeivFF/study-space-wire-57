import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface ActiveTimer {
  key: string;
  resourceTitle: string;
  studyType: 'livro' | 'questao';
  startTimestamp: number;
}

export const useGlobalTimers = () => {
  const [activeTimers, setActiveTimers] = useLocalStorage<ActiveTimer[]>('activeTimers', []);
  const [totalActiveTime, setTotalActiveTime] = useState(0);

  // Calculate total active time
  useEffect(() => {
    const calculateTotalTime = () => {
      const now = Date.now();
      const total = activeTimers.reduce((sum, timer) => {
        const elapsed = Math.floor((now - timer.startTimestamp) / 1000);
        return sum + elapsed;
      }, 0);
      setTotalActiveTime(total);
    };

    if (activeTimers.length > 0) {
      const interval = setInterval(calculateTotalTime, 1000);
      calculateTotalTime(); // Initial calculation
      return () => clearInterval(interval);
    } else {
      setTotalActiveTime(0);
    }
  }, [activeTimers]);

  const addActiveTimer = (timer: ActiveTimer) => {
    setActiveTimers(prev => {
      const filtered = prev.filter(t => t.key !== timer.key);
      return [...filtered, timer];
    });
  };

  const removeActiveTimer = (key: string) => {
    setActiveTimers(prev => prev.filter(t => t.key !== key));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    activeTimers,
    totalActiveTime,
    addActiveTimer,
    removeActiveTimer,
    formatTime,
    hasActiveTimers: activeTimers.length > 0,
  };
};