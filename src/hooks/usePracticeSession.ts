import { useState, useCallback } from 'react';
import { PracticeSession, PracticeSessionConfig, SessionStats } from '@/types/practice';
import { useGamification } from '@/contexts/GamificationContext';
import { toast } from '@/components/ui/enhanced-toast';

export const usePracticeSession = () => {
  const [session, setSession] = useState<PracticeSession | null>(null);
  const { addXP } = useGamification();

  const createSession = useCallback((config: PracticeSessionConfig, items: any[]): PracticeSession => {
    const newSession: PracticeSession = {
      id: `session_${Date.now()}`,
      config,
      currentIndex: 0,
      items: items.slice(0, config.limit || items.length),
      stats: {
        correct: 0,
        total: 0,
        accuracy: 0,
        timeSpent: 0,
        startTime: Date.now(),
      },
      isActive: true,
    };
    
    setSession(newSession);
    return newSession;
  }, []);

  const updateStats = useCallback((isCorrect: boolean) => {
    if (!session) return;

    const newStats: SessionStats = {
      ...session.stats,
      total: session.stats.total + 1,
      correct: session.stats.correct + (isCorrect ? 1 : 0),
      timeSpent: Date.now() - session.stats.startTime,
    };
    
    newStats.accuracy = newStats.total > 0 ? Math.round((newStats.correct / newStats.total) * 100) : 0;
    newStats.avgTimePerCard = newStats.timeSpent / newStats.total;

    setSession(prev => prev ? { ...prev, stats: newStats } : null);

    // Add XP for participation
    if (isCorrect) {
      addXP('question_answered_correct');
    } else {
      addXP('question_answered_wrong');
    }
  }, [session, addXP]);

  const nextItem = useCallback(() => {
    if (!session) return false;

    const nextIndex = session.currentIndex + 1;
    if (nextIndex >= session.items.length) {
      // Session completed
      return false;
    }

    setSession(prev => prev ? { ...prev, currentIndex: nextIndex } : null);
    return true;
  }, [session]);

  const getCurrentItem = useCallback(() => {
    if (!session || session.currentIndex >= session.items.length) {
      return null;
    }
    return session.items[session.currentIndex];
  }, [session]);

  const getProgress = useCallback(() => {
    if (!session) return { current: 0, total: 0, percentage: 0 };
    
    const current = session.currentIndex + 1;
    const total = session.items.length;
    const percentage = (current / total) * 100;
    
    return { current, total, percentage };
  }, [session]);

  const endSession = useCallback(() => {
    if (session && session.stats.total > 0) {
      // Show completion toast
      toast.success(`Sessão concluída! ${session.stats.correct}/${session.stats.total} corretas`);
      
      // Add completion XP
      addXP('study_session_completed');
    }
    
    setSession(null);
  }, [session, addXP]);

  return {
    session,
    createSession,
    updateStats,
    nextItem,
    getCurrentItem,
    getProgress,
    endSession,
  };
};