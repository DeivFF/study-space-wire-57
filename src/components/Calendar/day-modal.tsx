import { CalendarDays, Plus, Pencil, CheckCircle2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStudyStore, Session } from '@/lib/calendar-store';

interface DayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string | null;
  onNewSession: (session: Partial<Session>) => void;
}

export function DayModal({ open, onOpenChange, date, onNewSession }: DayModalProps) {
  const { subjects, sessions, upsertSession, deleteSession } = useStudyStore();

  if (!date) return null;

  const daySessions = sessions
    .filter(s => s.date === date)
    .sort((a, b) => a.start.localeCompare(b.start));

  const dateLabel = new Date(date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handleNewSession = () => {
    onNewSession({
      date,
      start: '08:00',
      durationMin: 60,
      status: 'open'
    });
    onOpenChange(false);
  };

  const toggleSessionStatus = (session: Session) => {
    upsertSession({
      ...session,
      status: session.status === 'done' ? 'open' : 'done'
    });
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('Excluir esta sessão?')) {
      deleteSession(sessionId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {dateLabel}
            </div>
            <Button onClick={handleNewSession} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova sessão
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {daySessions.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Nenhuma sessão neste dia. Use "Nova sessão" para adicionar.
            </div>
          ) : (
            daySessions.map((session) => {
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
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>{subject?.name || '—'}</span>
                      <span>•</span>
                      <span>{session.durationMin}min</span>
                      <span>•</span>
                      <span>{session.pomos || 0} pomodoros</span>
                      {session.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNewSession(session)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSessionStatus(session)}
                      title="Alternar status"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSession(session.id)}
                      title="Excluir"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}