import { useState, useEffect } from 'react';
import { Files, BookOpen, Type, Calendar, Clock3, Hourglass, Flame, Hash, CheckCircle2, Save, Trash2, Repeat, CalendarRange, CalendarPlus, StickyNote } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useStudyStore, Session } from '@/lib/calendar-store';
import { splitTags, todayStr, ymd, addMinutes } from '@/lib/utils';

interface SessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: Session | null;
  onSessionSaved?: () => void;
}

export function SessionModal({ open, onOpenChange, session, onSessionSaved }: SessionModalProps) {
  const [formData, setFormData] = useState<Partial<Session>>({
    subjectId: 'none',
    title: '',
    date: todayStr(),
    start: '08:00',
    durationMin: 60,
    pomos: 2,
    tags: [],
    status: 'open',
    notes: ''
  });
  
  const [recurFreq, setRecurFreq] = useState('none');
  const [recurDays, setRecurDays] = useState<number[]>([]);
  const [recurUntil, setRecurUntil] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const { subjects, sessions, upsertSession, deleteSession } = useStudyStore();

  useEffect(() => {
    if (session) {
      setFormData(session);
      setTagsInput(session.tags?.join(' ') || '');
    } else {
      setFormData({
        subjectId: 'none',
        title: '',
        date: todayStr(),
        start: '08:00',
        durationMin: 60,
        pomos: 2,
        tags: [],
        status: 'open',
        notes: ''
      });
      setTagsInput('');
    }
    setRecurFreq('none');
    setRecurDays([]);
    setRecurUntil('');
  }, [session, open]);

  const checkConflicts = (sess: Session): boolean => {
    return sessions.some(s => 
      s.date === sess.date && 
      s.id !== sess.id && 
      !(
        addMinutes(sess.start, sess.durationMin) <= s.start ||
        addMinutes(s.start, s.durationMin) <= sess.start
      )
    );
  };

  const handleSave = () => {
    const sess: Session = {
      id: formData.id || crypto.randomUUID(),
      subjectId: formData.subjectId!,
      title: formData.title!,
      date: formData.date!,
      start: formData.start!,
      durationMin: formData.durationMin!,
      pomos: formData.pomos || 0,
      tags: splitTags(tagsInput),
      status: formData.status!,
      notes: formData.notes || ''
    };

    if (!sess.subjectId || sess.subjectId === 'none') {
      alert('Selecione a matéria');
      return;
    }

    if (checkConflicts(sess)) {
      if (!confirm('Existe sobreposição com outra sessão. Deseja manter mesmo assim?')) {
        return;
      }
    }

    if (recurFreq === 'none') {
      upsertSession(sess);
      onOpenChange(false);
      onSessionSaved?.();
      return;
    }

    // Handle recurrence
    const dates: string[] = [];
    const startDate = new Date(sess.date);
    const endDate = recurUntil ? new Date(recurUntil) : new Date(startDate);
    
    if (recurFreq === 'daily') {
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(ymd(d));
      }
    } else if (recurFreq === 'weekly') {
      const realEnd = recurUntil ? endDate : new Date(startDate);
      realEnd.setDate(realEnd.getDate() + 70); // 10 weeks
      
      for (let d = new Date(startDate); d <= realEnd; d.setDate(d.getDate() + 1)) {
        if (recurDays.includes(d.getDay())) {
          dates.push(ymd(d));
        }
      }
    }

    dates.forEach(date => {
      upsertSession({
        ...sess,
        id: crypto.randomUUID(),
        date
      });
    });

    onOpenChange(false);
    onSessionSaved?.();
  };

  const handleDelete = () => {
    if (formData.id && confirm('Excluir esta sessão?')) {
      deleteSession(formData.id);
      onOpenChange(false);
      onSessionSaved?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Files className="h-4 w-4" />
            {session ? 'Editar sessão' : 'Nova sessão'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <Select
                value={formData.subjectId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Matéria..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione uma matéria...</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Tópico/atividade"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              <Input
                type="time"
                value={formData.start}
                onChange={(e) => setFormData(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Hourglass className="h-4 w-4" />
              <Input
                type="number"
                min="15"
                step="5"
                value={formData.durationMin}
                onChange={(e) => setFormData(prev => ({ ...prev, durationMin: Number(e.target.value) }))}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              <Input
                type="number"
                min="0"
                max="16"
                value={formData.pomos}
                onChange={(e) => setFormData(prev => ({ ...prev, pomos: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="#revisão #lista-2 (opcional)"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'open' | 'done' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Planejado</SelectItem>
                  <SelectItem value="done">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Collapsible>
            <CollapsibleTrigger className="text-sm cursor-pointer hover:underline">
              Recorrência e opções avançadas
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  <Select value={recurFreq} onValueChange={setRecurFreq}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem recorrência</SelectItem>
                      <SelectItem value="daily">Diária</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {recurFreq === 'weekly' && (
                  <div className="flex items-center gap-2">
                    <CalendarRange className="h-4 w-4" />
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Dias da semana" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, i) => (
                          <SelectItem key={i} value={(i + 1).toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <CalendarPlus className="h-4 w-4" />
                  <Input
                    type="date"
                    value={recurUntil}
                    onChange={(e) => setRecurUntil(e.target.value)}
                    placeholder="Até..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas (opcional)"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-between">
            {session && (
              <Button variant="outline" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}