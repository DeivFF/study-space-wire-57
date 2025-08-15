
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseLessonPerformance } from '@/hooks/useSupabaseLessonPerformance';
import type { Tables } from '@/integrations/supabase/types';

type LessonPerformance = Tables<'lesson_performances'>;

interface LessonPerformanceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  performance: LessonPerformance;
  onSave: () => void;
}

const LessonPerformanceEditModal = ({
  isOpen,
  onClose,
  performance,
  onSave
}: LessonPerformanceEditModalProps) => {
  const { updatePerformance, loading } = useSupabaseLessonPerformance();
  const [questionsCorrect, setQuestionsCorrect] = useState(0);
  const [questionsIncorrect, setQuestionsIncorrect] = useState(0);
  const [incorrectQuestions, setIncorrectQuestions] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (performance) {
      setQuestionsCorrect(performance.questions_correct || 0);
      setQuestionsIncorrect(performance.questions_incorrect || 0);
      setIncorrectQuestions(performance.incorrect_questions || '');
      setNotes(performance.notes || '');
    }
  }, [performance]);

  const totalQuestions = questionsCorrect + questionsIncorrect;
  const accuracyPercentage = totalQuestions > 0 ? Math.round((questionsCorrect / totalQuestions) * 100) : 0;

  const handleSave = async () => {
    if (questionsCorrect < 0 || questionsIncorrect < 0) {
      return;
    }
    
    const success = await updatePerformance(performance.id, {
      questions_correct: questionsCorrect,
      questions_incorrect: questionsIncorrect,
      total_questions: totalQuestions,
      accuracy_percentage: accuracyPercentage,
      incorrect_questions: incorrectQuestions,
      notes: notes
    });

    if (success) {
      onSave();
    }
  };

  const handleClose = () => {
    // Reset to original values when closing without saving
    if (performance) {
      setQuestionsCorrect(performance.questions_correct || 0);
      setQuestionsIncorrect(performance.questions_incorrect || 0);
      setIncorrectQuestions(performance.incorrect_questions || '');
      setNotes(performance.notes || '');
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Desempenho</DialogTitle>
          <p className="text-sm text-gray-600">
            Registrado em {new Date(performance?.created_at).toLocaleDateString('pt-BR')}
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="correct">Questões Corretas</Label>
              <Input
                id="correct"
                type="number"
                min="0"
                max="200"
                value={questionsCorrect}
                onChange={(e) => setQuestionsCorrect(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
              />
            </div>
            
            <div>
              <Label htmlFor="incorrect">Questões Erradas</Label>
              <Input
                id="incorrect"
                type="number"
                min="0"
                max="200"
                value={questionsIncorrect}
                onChange={(e) => setQuestionsIncorrect(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="incorrectQuestions">Questões que Errei</Label>
            <Textarea
              id="incorrectQuestions"
              value={incorrectQuestions}
              onChange={(e) => setIncorrectQuestions(e.target.value)}
              placeholder="Ex: 1, 5, 12, 18 ou descreva as questões..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">Anotações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre o desempenho..."
              rows={4}
            />
          </div>

          {totalQuestions > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Aproveitamento</span>
                <span className="font-medium">{accuracyPercentage}%</span>
              </div>
              <Progress value={accuracyPercentage} className="h-2" />
              <div className="text-xs text-gray-500 text-center">
                {questionsCorrect} corretas de {totalQuestions} questões
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={totalQuestions === 0 || loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonPerformanceEditModal;
