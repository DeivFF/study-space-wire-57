
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface BulkLessonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (lessons: { name: string; duration_minutes: number }[]) => Promise<void>;
  categoryId: string;
}

export const BulkLessonForm = ({ isOpen, onClose, onSubmit, categoryId }: BulkLessonFormProps) => {
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!jsonInput.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o JSON com as aulas",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const lessons = JSON.parse(jsonInput);
      
      if (!Array.isArray(lessons)) {
        throw new Error('O JSON deve ser um array de aulas');
      }

      const validatedLessons = lessons.map((lesson, index) => {
        if (!lesson.name || typeof lesson.name !== 'string') {
          throw new Error(`Aula ${index + 1}: campo 'name' é obrigatório e deve ser uma string`);
        }
        if (!lesson.duration_minutes || typeof lesson.duration_minutes !== 'number') {
          throw new Error(`Aula ${index + 1}: campo 'duration_minutes' é obrigatório e deve ser um número`);
        }
        return {
          name: lesson.name.trim(),
          duration_minutes: lesson.duration_minutes
        };
      });

      await onSubmit(validatedLessons);
      setJsonInput('');
      onClose();
      
    } catch (error: any) {
      console.error('Erro ao processar JSON:', error);
      toast({
        title: "Erro no JSON",
        description: error.message || "Formato JSON inválido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exampleJson = `[
  {
    "name": "1 - Introdução ao Direito Constitucional",
    "duration_minutes": 45
  },
  {
    "name": "2 - Princípios Constitucionais",
    "duration_minutes": 60
  },
  {
    "name": "3 - Direitos Fundamentais",
    "duration_minutes": 55
  }
]`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Aulas em Lote</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="json-input">JSON das Aulas</Label>
            <Textarea
              id="json-input"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Cole aqui o JSON com as aulas..."
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">Exemplo de formato:</p>
            <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
              {exampleJson}
            </pre>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !jsonInput.trim()}>
            {loading ? 'Adicionando...' : 'Adicionar Aulas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
