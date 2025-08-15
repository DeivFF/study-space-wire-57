import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useStudySessions } from '@/hooks/useStudySessions';
import { useToast } from '@/hooks/use-toast';

interface TimerState {
  isRunning: boolean;
  time: number;
  startTimestamp: number | null;
  studyType: 'livro' | 'questao';
  resourceId: string;
  resourceTitle: string;
}

interface TimerPersistenceConfig {
  key: string;
  studyType: 'livro' | 'questao';
  resourceId: string;
  resourceTitle: string;
}

export const useTimerPersistence = (config: TimerPersistenceConfig) => {
  const { key, studyType, resourceId, resourceTitle } = config;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [timerState, setTimerState] = useLocalStorage<TimerState>(`timer-${key}`, {
    isRunning: false,
    time: 0,
    startTimestamp: null,
    studyType,
    resourceId,
    resourceTitle,
  });

  const { criarEMarcarConcluida } = useStudySessions();
  const { toast } = useToast();

  // Calculate actual time accounting for time spent while away
  const calculateCurrentTime = useCallback(() => {
    if (!timerState.isRunning || !timerState.startTimestamp) {
      return timerState.time;
    }
    
    const now = Date.now();
    const elapsedWhileAway = Math.floor((now - timerState.startTimestamp) / 1000);
    return timerState.time + elapsedWhileAway;
  }, [timerState]);

  const [displayTime, setDisplayTime] = useState(calculateCurrentTime());

  // Update display time every second when running
  useEffect(() => {
    if (timerState.isRunning) {
      intervalRef.current = setInterval(() => {
        setDisplayTime(calculateCurrentTime());
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, calculateCurrentTime]);

  // Sync display time when timer state changes
  useEffect(() => {
    setDisplayTime(calculateCurrentTime());
  }, [calculateCurrentTime]);

  const startTimer = useCallback(() => {
    const now = Date.now();
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      startTimestamp: now,
    }));
  }, [setTimerState]);

  const pauseTimer = useCallback(() => {
    const currentTime = calculateCurrentTime();
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      time: currentTime,
      startTimestamp: null,
    }));
    setDisplayTime(currentTime);
  }, [setTimerState, calculateCurrentTime]);

  const completeTimer = useCallback(async () => {
    const finalTime = calculateCurrentTime();
    
    if (finalTime > 0) {
      const minutes = Math.ceil(finalTime / 60);
      await criarEMarcarConcluida(studyType, resourceId, resourceTitle, minutes);
      
      toast({
        title: "Tempo registrado!",
        description: `${minutes} minutos de estudo foram registrados`
      });
    }

    // Reset timer
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      time: 0,
      startTimestamp: null,
    }));
    setDisplayTime(0);
  }, [calculateCurrentTime, criarEMarcarConcluida, studyType, resourceId, resourceTitle, toast, setTimerState]);

  const resetTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      time: 0,
      startTimestamp: null,
    }));
    setDisplayTime(0);
  }, [setTimerState]);

  return {
    time: displayTime,
    isRunning: timerState.isRunning,
    startTimer,
    pauseTimer,
    completeTimer,
    resetTimer,
  };
};