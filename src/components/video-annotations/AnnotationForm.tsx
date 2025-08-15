
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

interface AnnotationFormProps {
  newAnnotation: string;
  setNewAnnotation: (content: string) => void;
  currentTime: number;
  onAddAnnotation: () => void;
}

const AnnotationForm = ({ newAnnotation, setNewAnnotation, currentTime, onAddAnnotation }: AnnotationFormProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Nova anotação</span>
            <span className="text-xs text-gray-500">
              Momento: {formatTime(Math.floor(currentTime))}
            </span>
          </div>
          <Textarea
            value={newAnnotation}
            onChange={(e) => setNewAnnotation(e.target.value)}
            placeholder="Digite sua anotação..."
            className="min-h-[80px]"
          />
          <Button onClick={onAddAnnotation} disabled={!newAnnotation.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Anotação
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnnotationForm;
