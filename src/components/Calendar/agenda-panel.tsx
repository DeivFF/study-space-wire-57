import { NotebookPen, Focus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStudyStore, Session } from '@/lib/calendar-store';
import { ymd } from '@/lib/utils';

interface AgendaPanelProps {
  onEditSession: (session: Session) => void;
  onStartTimer: (session: Session) => void;
}

export function AgendaPanel({ onEditSession, onStartTimer }: AgendaPanelProps) {
  const { subjects, sessions, cursor, deleteSession } = useStudyStore();
  
  const cursorDate = ymd(cursor);
  const dayLabel = cursor.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  });

  const daySessions = sessions
    .filter(s => s.date === cursorDate)
    .sort((a, b) => a.start.localeCompare(b.start));

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('Excluir esta sessão?')) {
      deleteSession(sessionId);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <NotebookPen className="h-4 w-4" />
          <h3 className="font-medium">Agenda do dia</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {dayLabel}
        </Badge>
      </CardHeader>
      <CardContent>
        {daySessions.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Sem sessões para este dia.
          </div>
        ) : (
          <div className="space-y-3">
            {daySessions.map((session) => {
              const subject = subjects.find(s => s.id === session.subjectId);
              return (
                <div
                  key={session.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg ${
                    session.status === 'done' ? 'opacity-70' : ''
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: subject?.color || '#999' }}
                  />
                  
                  <div className="flex-1">
                    <div className="font-medium">
                      {session.start} — {session.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {subject?.name || '—'} • {session.durationMin}min • {session.pomos || 0} pomodoros
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStartTimer(session)}
                    >
                      <Focus className="h-4 w-4 mr-2" />
                      Focar
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditSession(session)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSession(session.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}