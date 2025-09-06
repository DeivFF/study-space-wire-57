import { useState } from 'react';
import { Clock, Plus, Trash2, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useStudyStore, Session } from '@/lib/calendar-store';
import { DOW, ymd, minutesBetween, addMinutes } from '@/lib/utils';

export function AvailabilityPanel() {
  const { availability, updateAvailability, tasks, upsertSession, sessions } = useStudyStore();

  const handleTimeChange = (dowIndex: number, slotIndex: number, field: 'start' | 'end', value: string) => {
    const newAvailability = [...availability];
    newAvailability[dowIndex].slots[slotIndex][field] = value;
    updateAvailability(newAvailability);
  };

  const removeSlot = (dowIndex: number, slotIndex: number) => {
    const newAvailability = [...availability];
    newAvailability[dowIndex].slots.splice(slotIndex, 1);
    updateAvailability(newAvailability);
  };

  const addSlot = () => {
    const dowStr = prompt('Adicionar janela: digite o dia (0=Dom .. 6=Sáb)');
    if (dowStr === null) return;
    
    const dow = Number(dowStr);
    if (!(dow >= 0 && dow <= 6)) {
      alert('Dia inválido');
      return;
    }

    const start = prompt('Início (HH:MM)', '18:00');
    if (!start) return;
    
    const end = prompt('Fim (HH:MM)', '20:00');
    if (!end) return;

    const newAvailability = [...availability];
    newAvailability[dow].slots.push({ start, end });
    updateAvailability(newAvailability);
  };

  const checkConflicts = (session: Session): boolean => {
    return sessions.some(s => 
      s.date === session.date && 
      s.id !== session.id && 
      !(
        addMinutes(session.start, session.durationMin) <= s.start ||
        addMinutes(s.start, s.durationMin) <= session.start
      )
    );
  };

  const autoPlanNextWeek = () => {
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + (1 - today.getDay() + 7) % 7);
    
    const endOfWeek = new Date(nextMonday);
    endOfWeek.setDate(nextMonday.getDate() + 6);

    // Sort tasks by priority
    const sortedTasks = [...tasks].sort((a, b) => a.priority - b.priority);
    let taskQueue = [...sortedTasks];

    for (let d = new Date(nextMonday); d <= endOfWeek; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      const dayAvailability = availability.find(a => a.dow === dow);
      
      if (!dayAvailability) continue;

      for (const slot of dayAvailability.slots) {
        let currentTime = slot.start;
        
        while (minutesBetween(currentTime, slot.end) >= 15 && taskQueue.length > 0) {
          const task = taskQueue[0];
          const availableTime = minutesBetween(currentTime, slot.end);
          const sessionDuration = Math.min(task.estMin, availableTime);
          
          const session: Session = {
            id: crypto.randomUUID(),
            subjectId: task.subjectId,
            title: task.title,
            date: ymd(d),
            start: currentTime,
            durationMin: sessionDuration,
            pomos: Math.round(sessionDuration / 25),
            tags: task.tags,
            status: 'open'
          };

          if (!checkConflicts(session)) {
            upsertSession(session);
            currentTime = addMinutes(currentTime, sessionDuration);
            
            if (sessionDuration >= task.estMin) {
              taskQueue.shift(); // Remove completed task
            } else {
              // Update task with remaining time
              taskQueue[0] = {
                ...task,
                estMin: task.estMin - sessionDuration
              };
            }
          } else {
            currentTime = addMinutes(currentTime, 15);
          }
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
        <Clock className="h-4 w-4" />
        <h3 className="font-medium">Janelas de estudo</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Defina horários padrão por dia da semana para o auto-agendamento.
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2 text-sm font-medium text-muted-foreground">
            <div>Dia</div>
            <div>Início</div>
            <div>Fim</div>
            <div></div>
          </div>

          {availability.map((dayAvail) => (
            <div key={dayAvail.dow}>
              {dayAvail.slots.length === 0 ? (
                <div className="grid grid-cols-4 gap-2 items-center">
                  <Badge variant="outline" className="text-xs justify-center">
                    {DOW[dayAvail.dow]}
                  </Badge>
                  <div className="col-span-3 text-sm text-muted-foreground">—</div>
                </div>
              ) : (
                dayAvail.slots.map((slot, slotIndex) => (
                  <div key={slotIndex} className="grid grid-cols-4 gap-2 items-center">
                    {slotIndex === 0 && (
                      <Badge variant="outline" className="text-xs justify-center">
                        {DOW[dayAvail.dow]}
                      </Badge>
                    )}
                    {slotIndex > 0 && <div></div>}
                    
                    <Input
                      type="time"
                      value={slot.start}
                      onChange={(e) => handleTimeChange(dayAvail.dow, slotIndex, 'start', e.target.value)}
                      className="text-sm"
                    />
                    
                    <Input
                      type="time"
                      value={slot.end}
                      onChange={(e) => handleTimeChange(dayAvail.dow, slotIndex, 'end', e.target.value)}
                      className="text-sm"
                    />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSlot(dayAvail.dow, slotIndex)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addSlot}>
            <Plus className="h-4 w-4 mr-2" />
            Nova janela
          </Button>
          <Button size="sm" onClick={autoPlanNextWeek}>
            <Wand2 className="h-4 w-4 mr-2" />
            Sugerir próxima semana
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}