import { useState } from 'react';
import { Play, Pause, Square, Clock, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useStudySessions } from '@/hooks/useStudySessions';
import { useTimerPersistence } from '@/hooks/useTimerPersistence';
import { useGlobalTimers } from '@/hooks/useGlobalTimers';

interface StudyTimerProps {
  lessonId: string;
  lessonTitle: string;
}

export const StudyTimer = ({ lessonId, lessonTitle }: StudyTimerProps) => {
  const [showHistory, setShowHistory] = useState(false);
  
  const { sessions, carregarSessoes } = useStudySessions();
  const { addActiveTimer, removeActiveTimer } = useGlobalTimers();
  
  const { time, isRunning, startTimer, pauseTimer, completeTimer } = useTimerPersistence({
    key: `resumos-${lessonId}`,
    studyType: 'livro',
    resourceId: lessonId,
    resourceTitle: lessonTitle,
  });

  // Filtrar sessões desta aula específica
  const lessonSessions = sessions.filter(
    session => session.resource_id === lessonId && session.study_type === 'livro'
  );

  // Calcular tempo total gasto nesta aula
  const totalTimeSpent = lessonSessions.reduce(
    (total, session) => total + (session.time_spent_minutes || 0), 
    0
  );

  const handleStart = () => {
    startTimer();
    addActiveTimer({
      key: `resumos-${lessonId}`,
      resourceTitle: lessonTitle,
      studyType: 'livro',
      startTimestamp: Date.now(),
    });
  };

  const handlePause = () => {
    pauseTimer();
    removeActiveTimer(`resumos-${lessonId}`);
  };

  const handleComplete = async () => {
    removeActiveTimer(`resumos-${lessonId}`);
    await completeTimer();
    // Reload sessions to update history immediately
    await carregarSessoes();
  };

  const formatTimeDisplay = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Timer Display */}
      <div className="flex items-center space-x-2 bg-muted/50 px-3 py-2 rounded-lg">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="font-mono text-lg font-semibold">
          {formatTimeDisplay(time)}
        </span>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center space-x-2">
        {!isRunning ? (
          <Button onClick={handleStart} size="sm" variant="outline">
            <Play className="w-4 h-4 mr-1" />
            Iniciar
          </Button>
        ) : (
          <Button onClick={handlePause} size="sm" variant="outline">
            <Pause className="w-4 h-4 mr-1" />
            Pausar
          </Button>
        )}
        
        <Button 
          onClick={handleComplete} 
          size="sm" 
          variant="default"
          disabled={time === 0}
        >
          <Square className="w-4 h-4 mr-1" />
          Concluir
        </Button>

        {/* History Button */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <History className="w-4 h-4 mr-1" />
              Histórico
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Histórico de Estudo - {lessonTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Resumo</h4>
                <p className="text-sm text-muted-foreground">
                  Tempo total de estudo: <span className="font-medium">{totalTimeSpent} minutos</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Número de sessões: <span className="font-medium">{lessonSessions.length}</span>
                </p>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <h4 className="font-semibold">Sessões de Estudo</h4>
                {lessonSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma sessão de estudo registrada ainda.</p>
                ) : (
                  lessonSessions
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((session, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-background border rounded-lg">
                        <div>
                          <p className="font-medium">{session.resource_title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{session.time_spent_minutes} min</p>
                          <p className="text-xs text-muted-foreground capitalize">{session.study_type}</p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};