import { useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpenCheck, CheckCircle2, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useStudyStore, Session } from '@/lib/calendar-store';
import { weeksMatrix, DOW, ymd, todayStr } from '@/lib/utils';
import { SessionModal } from './session-modal';
import { DayModal } from './day-modal';

export function CalendarGrid() {
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const { subjects, sessions, tasks, cursor, setCursor, upsertSession } = useStudyStore();

  const filteredSessions = sessions.filter(s => {
    if (subjectFilter && subjectFilter !== 'all' && s.subjectId !== subjectFilter) return false;
    if (statusFilter === 'done' && s.status !== 'done') return false;
    if (statusFilter === 'open' && s.status === 'done') return false;
    return true;
  });

  const cells = weeksMatrix(cursor);
  const month = cursor.getMonth();

  const goToMonth = (direction: number) => {
    const newDate = new Date(cursor);
    newDate.setMonth(newDate.getMonth() + direction);
    setCursor(newDate);
  };

  const goToday = () => {
    setCursor(new Date());
  };

  const clearFilters = () => {
    setSubjectFilter('all');
    setStatusFilter('all');
  };

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setDayModalOpen(true);
  };

  const handleDrop = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const session: Session = {
        id: crypto.randomUUID(),
        subjectId: task.subjectId,
        title: task.title,
        date,
        start: '08:00',
        durationMin: task.estMin,
        pomos: Math.round(task.estMin / 25),
        tags: task.tags,
        status: 'open'
      };
      setEditingSession(session);
      setSessionModalOpen(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => goToMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-medium">
              {cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            <Button variant="outline" size="sm" onClick={() => goToMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToday}>
              Hoje
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <BookOpenCheck className="h-4 w-4" />
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas as matérias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as matérias</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Planejados</SelectItem>
                  <SelectItem value="done">Concluídos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <Eraser className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => (
              <div key={dayIndex} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {DOW[dayIndex]}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {cells.map((date) => {
              const dateStr = ymd(date);
              const isOutsideMonth = date.getMonth() !== month;
              const isToday = dateStr === todayStr();
              const daySessions = filteredSessions.filter(s => s.date === dateStr);
              const totalMinutes = daySessions.reduce((acc, s) => acc + s.durationMin, 0);

              return (
                <div
                  key={dateStr}
                  className={`min-h-28 border rounded-lg p-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                    isOutsideMonth ? 'opacity-50' : ''
                  }`}
                  onClick={() => handleDayClick(dateStr)}
                  onDrop={(e) => handleDrop(e, dateStr)}
                  onDragOver={handleDragOver}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{date.getDate()}</span>
                      {isToday && (
                        <Badge variant="secondary" className="text-xs px-1">
                          Hoje
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(totalMinutes / 60)}h
                    </span>
                  </div>

                  {/* Heat map */}
                  <div className="h-1 bg-muted rounded mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded"
                      style={{ width: `${Math.min(100, totalMinutes / 6)}%` }}
                    />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {daySessions.length > 0 
                      ? `${daySessions.length} sessão${daySessions.length > 1 ? 'ões' : ''}`
                      : '—'
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <SessionModal
        open={sessionModalOpen}
        onOpenChange={setSessionModalOpen}
        session={editingSession}
        onSessionSaved={() => {
          setEditingSession(null);
        }}
      />

      <DayModal
        open={dayModalOpen}
        onOpenChange={setDayModalOpen}
        date={selectedDate}
        onNewSession={(session) => {
          setEditingSession(session as Session);
          setSessionModalOpen(true);
        }}
      />
    </>
  );
}