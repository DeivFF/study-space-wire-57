import { useState } from 'react';
import { ListTodo, Trash2, Plus, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useStudyStore } from '@/lib/calendar-store';
import { splitTags } from '@/lib/utils';

export function TasksPanel() {
  const [subjectId, setSubjectId] = useState('none');
  const [title, setTitle] = useState('');
  const [estMin, setEstMin] = useState(60);
  const [priority, setPriority] = useState(3);
  const [tags, setTags] = useState('');

  const { subjects, tasks, addTask, deleteTask } = useStudyStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || subjectId === 'none') return;
    addTask(subjectId, title.trim(), estMin, priority, splitTags(tags));
    setTitle('');
    setTags('');
  };

  const sortedTasks = [...tasks].sort((a, b) => a.priority - b.priority);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
        <ListTodo className="h-4 w-4" />
        <h3 className="font-medium">Backlog (arraste para o calendário)</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="flex-1">
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
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tópico/Assunto"
              className="flex-2"
            />
          </div>
          
          <div className="flex gap-2">
            <Input
              type="number"
              min="15"
              step="5"
              value={estMin}
              onChange={(e) => setEstMin(Number(e.target.value))}
              placeholder="Minutos (est.)"
              className="w-32"
            />
            <Select value={priority.toString()} onValueChange={(v) => setPriority(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Muito alta</SelectItem>
                <SelectItem value="2">Alta</SelectItem>
                <SelectItem value="3">Prioridade média</SelectItem>
                <SelectItem value="4">Baixa</SelectItem>
                <SelectItem value="5">Muito baixa</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="#tags (opcional)"
              className="flex-1"
            />
          </div>
          
          <Button type="submit" variant="outline" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Adicionar ao backlog
          </Button>
        </form>

        <div className="space-y-2">
          {sortedTasks.map((task) => {
            const subject = subjects.find(s => s.id === task.subjectId);
            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                className="flex items-center gap-3 p-3 rounded-lg border-dashed border bg-background cursor-grab active:cursor-grabbing hover:bg-muted/50"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: subject?.color || '#999' }}
                />
                <div className="flex-1">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>{subject?.name || 'Sem matéria'}</span>
                    <span>•</span>
                    <span>{task.estMin}min</span>
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTask(task.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}