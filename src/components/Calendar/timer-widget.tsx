import { useState, useEffect, useRef } from 'react';
import { Focus, Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useStudyStore, Session } from '@/lib/calendar-store';
import { formatTime } from '@/lib/utils';
import { useGamification } from '@/contexts/GamificationContext';
import { toast } from '@/hooks/use-toast';

interface TimerWidgetProps {
  session: Session | null;
  onClose: () => void;
}

export function TimerWidget({ session, onClose }: TimerWidgetProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const { upsertSession } = useStudyStore();
  const { addXP, checkAchievements } = useGamification();

  useEffect(() => {
    if (!session) {
      setElapsed(0);
      setIsRunning(false);
    }
  }, [session]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    startTimeRef.current = Date.now() - elapsed;
    setIsRunning(true);
    
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 100);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const stopTimer = () => {
    pauseTimer();
    
    if (session) {
      const actualMinutes = Math.round(elapsed / 60000);
      const updatedSession = {
        ...session,
        status: 'done' as const,
        actualMin: (session.actualMin || 0) + actualMinutes
      };
      upsertSession(updatedSession);
      
      // Add XP for completing study session
      addXP('study_session_completed');
      
      // Check for achievements
      checkAchievements();
      
      // Show success toast
      toast({
        title: "🎉 Sessão de estudo concluída!",
        description: `Você estudou por ${actualMinutes} minutos e ganhou XP.`,
      });
    }
    
    setElapsed(0);
    onClose();
  };

  if (!session) return null;

  return (
    <Card className="fixed right-4 bottom-4 p-4 shadow-lg border bg-card z-50">
      <div className="flex items-center gap-3">
        <Focus className="h-5 w-5" />
        
        <div className="flex flex-col">
          <div className="text-sm font-medium">{session.title}</div>
          <div className="text-lg font-bold tabular-nums">
            {formatTime(elapsed)}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!isRunning ? (
            <Button size="sm" onClick={startTimer}>
              <Play className="h-4 w-4 mr-1" />
              Iniciar
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={pauseTimer}>
              <Pause className="h-4 w-4 mr-1" />
              Pausar
            </Button>
          )}
          
          <Button size="sm" variant="outline" onClick={stopTimer}>
            <Square className="h-4 w-4 mr-1" />
            Concluir
          </Button>
        </div>
      </div>
    </Card>
  );
}