import { useState } from 'react';
import { BookOpen, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useStudyStore } from '@/lib/calendar-store';

export function SubjectsPanel() {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2962ff');
  
  const { subjects, addSubject, deleteSubject } = useStudyStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addSubject(name.trim(), color);
    setName('');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
        <BookOpen className="h-4 w-4" />
        <h3 className="font-medium">Minhas matérias</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nova matéria"
            className="flex-1"
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-9 rounded border border-border cursor-pointer"
          />
          <Button type="submit" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </form>

        <div className="space-y-2">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: subject.color }}
              />
              <span className="flex-1 font-medium">{subject.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteSubject(subject.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}