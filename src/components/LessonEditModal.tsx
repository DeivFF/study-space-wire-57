
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Lesson {
  id: string;
  name: string;
  duration_minutes: number;
}

interface LessonEditModalProps {
  lesson: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (lessonId: string, name: string, duration: number) => Promise<boolean>;
}

export const LessonEditModal = ({ lesson, isOpen, onClose, onSave }: LessonEditModalProps) => {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleOpen = () => {
    if (lesson) {
      setName(lesson.name);
      setDuration(lesson.duration_minutes);
    }
  };

  const handleSave = async () => {
    if (!lesson || !name.trim() || duration <= 0) return;
    
    setSaving(true);
    const success = await onSave(lesson.id, name.trim(), duration);
    setSaving(false);
    
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onOpenAutoFocus={handleOpen}>
        <DialogHeader>
          <DialogTitle>Editar Aula</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="lesson-name">Nome da Aula</Label>
            <Input
              id="lesson-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome da aula"
            />
          </div>
          
          <div>
            <Label htmlFor="lesson-duration">Duração (minutos)</Label>
            <Input
              id="lesson-duration"
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              placeholder="Duração em minutos"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim() || duration <= 0}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
