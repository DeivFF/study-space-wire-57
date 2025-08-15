
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseLessonPerformance } from '@/hooks/useSupabaseLessonPerformance';
import LessonPerformanceHistory from './LessonPerformanceHistory';

interface LessonPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonTitle: string;
  lessonId: string;
}

const LessonPerformanceModal = ({
  isOpen,
  onClose,
  lessonTitle,
  lessonId
}: LessonPerformanceModalProps) => {
  const { addOrUpdatePerformance, loading } = useSupabaseLessonPerformance();
  const [questionsCorrect, setQuestionsCorrect] = useState(0);
  const [questionsIncorrect, setQuestionsIncorrect] = useState(0);
  const [incorrectQuestions, setIncorrectQuestions] = useState('');
  const [notes, setNotes] = useState('');
  const [refreshHistory, setRefreshHistory] = useState(0);

  // Auto-refresh history when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('LessonPerformanceModal opened for lesson:', lessonId);
      setRefreshHistory(prev => prev + 1);
    }
  }, [isOpen, lessonId]);

  const totalQuestions = questionsCorrect + questionsIncorrect;
  const accuracyPercentage = totalQuestions > 0 ? Math.round((questionsCorrect / totalQuestions) * 100) : 0;

  const handleSave = async () => {
    if (questionsCorrect < 0 || questionsIncorrect < 0) {
      return;
    }
    
    const result = await addOrUpdatePerformance(
      lessonId, 
      questionsCorrect, 
      questionsIncorrect,
      incorrectQuestions,
      notes
    );

    if (result) {
      // Reset form
      setQuestionsCorrect(0);
      setQuestionsIncorrect(0);
      setIncorrectQuestions('');
      setNotes('');
      
      // Refresh history
      setRefreshHistory(prev => prev + 1);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setQuestionsCorrect(0);
    setQuestionsIncorrect(0);
    setIncorrectQuestions('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Desempenho em Exercícios</DialogTitle>
          <p className="text-sm text-gray-600">{lessonTitle}</p>
        </DialogHeader>
        
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">Novo Registro</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="new" className="space-y-4">
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
              <Label htmlFor="incorrectQuestions">Questões que Errei (opcional)</Label>
              <Textarea
                id="incorrectQuestions"
                value={incorrectQuestions}
                onChange={(e) => setIncorrectQuestions(e.target.value)}
                placeholder="Ex: 1, 5, 12, 18 ou descreva as questões que teve dificuldade..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Anotações (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre o desempenho, pontos de melhoria, tópicos para revisar..."
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
                {loading ? 'Salvando...' : 'Salvar Registro'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <LessonPerformanceHistory 
              lessonId={lessonId} 
              refreshTrigger={refreshHistory}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LessonPerformanceModal;
