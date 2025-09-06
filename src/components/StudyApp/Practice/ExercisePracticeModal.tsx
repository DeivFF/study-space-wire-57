import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, SkipForward } from 'lucide-react';
import { useExercises } from '@/hooks/useExercises';
import { toast } from '@/components/ui/enhanced-toast';

interface ExercisePracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle: string;
}

interface PracticeSession {
  exercises: any[];
  currentIndex: number;
  answers: Record<string, any>;
  completed: boolean;
  startTime: number;
}

export const ExercisePracticeModal: React.FC<ExercisePracticeModalProps> = ({
  isOpen,
  onClose,
  lessonId,
  lessonTitle
}) => {
  const { exercises, attemptExercise, isAttempting } = useExercises(lessonId);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ correct: boolean; explanation?: string } | null>(null);

  useEffect(() => {
    if (isOpen && exercises.length > 0 && !session) {
      setSession({
        exercises: exercises.slice(0, 10), // Limit to 10 exercises
        currentIndex: 0,
        answers: {},
        completed: false,
        startTime: Date.now()
      });
    } else if (isOpen && exercises.length === 0) {
      toast.info('Nenhum exercício disponível');
      onClose();
    }
  }, [isOpen, exercises, session, onClose]);

  const handleClose = () => {
    setSession(null);
    setSelectedAnswer('');
    setShowResult(false);
    setLastResult(null);
    onClose();
  };

  const handleAnswer = async () => {
    if (!session || !selectedAnswer.trim()) return;

    const currentExercise = session.exercises[session.currentIndex];
    
    try {
      const result = await attemptExercise({
        exerciseId: currentExercise.id,
        userAnswer: selectedAnswer,
        timeSpent: Math.round((Date.now() - session.startTime) / 1000)
      });

      setLastResult(result);
      setShowResult(true);

      // Update session with answer
      const newAnswers = { ...session.answers };
      newAnswers[currentExercise.id] = {
        answer: selectedAnswer,
        correct: result.correct,
        explanation: result.explanation
      };

      setSession({
        ...session,
        answers: newAnswers
      });

    } catch (error) {
      toast.error('Erro ao enviar resposta');
    }
  };

  const handleNext = () => {
    if (!session) return;

    const nextIndex = session.currentIndex + 1;
    
    if (nextIndex >= session.exercises.length) {
      // Session completed
      const correctAnswers = Object.values(session.answers).filter((a: any) => a.correct).length;
      const total = Object.keys(session.answers).length;
      const accuracy = Math.round((correctAnswers / total) * 100);
      
      toast.success(`Sessão concluída! ${correctAnswers}/${total} acertos (${accuracy}%)`);
      handleClose();
    } else {
      setSession({
        ...session,
        currentIndex: nextIndex
      });
      setSelectedAnswer('');
      setShowResult(false);
      setLastResult(null);
    }
  };

  if (!session) return null;

  const currentExercise = session.exercises[session.currentIndex];
  const progress = ((session.currentIndex + 1) / session.exercises.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Prática de Exercícios - {lessonTitle}</span>
            <Badge variant="secondary">
              {session.currentIndex + 1} de {session.exercises.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4">
          {/* Progress Bar */}
          <Progress value={progress} className="w-full" />

          {/* Exercise Content */}
          <div className="flex-1">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">{currentExercise.title}</h3>
                
                <div className="mb-6">
                  <div 
                    className="text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: currentExercise.question_text }}
                  />
                </div>

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentExercise.question_type === 'multiple_choice' && currentExercise.options && (
                    <div className="space-y-2">
                      {currentExercise.options.map((option: string, index: number) => (
                        <label 
                          key={index} 
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedAnswer === index.toString() ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        >
                          <input
                            type="radio"
                            name="answer"
                            value={index.toString()}
                            checked={selectedAnswer === index.toString()}
                            onChange={(e) => setSelectedAnswer(e.target.value)}
                            className="mr-3"
                            disabled={showResult}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {(currentExercise.question_type === 'true_false' || currentExercise.question_type === 'truefalse') && (
                    <div className="space-y-2">
                      {['Verdadeiro', 'Falso'].map((option, index) => (
                        <label 
                          key={index} 
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedAnswer === index.toString() ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        >
                          <input
                            type="radio"
                            name="answer"
                            value={index.toString()}
                            checked={selectedAnswer === index.toString()}
                            onChange={(e) => setSelectedAnswer(e.target.value)}
                            className="mr-3"
                            disabled={showResult}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentExercise.question_type === 'essay' && (
                    <Textarea
                      placeholder="Digite sua resposta..."
                      value={selectedAnswer}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      disabled={showResult}
                      rows={5}
                    />
                  )}
                </div>

                {/* Result Display */}
                {showResult && lastResult && (
                  <div className={`mt-6 p-4 rounded-lg border ${
                    lastResult.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {lastResult.correct ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-semibold ${
                        lastResult.correct ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {lastResult.correct ? 'Resposta Correta!' : 'Resposta Incorreta'}
                      </span>
                    </div>
                    
                    {lastResult.explanation && (
                      <div className="text-sm text-gray-700">
                        <strong>Explicação:</strong> {lastResult.explanation}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={handleClose}>
              Encerrar Sessão
            </Button>
            
            <div className="flex gap-2">
              {!showResult ? (
                <Button 
                  onClick={handleAnswer} 
                  disabled={!selectedAnswer.trim() || isAttempting}
                  className="min-w-[120px]"
                >
                  {isAttempting ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Responder'
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext} className="min-w-[120px]">
                  <SkipForward className="w-4 h-4 mr-2" />
                  {session.currentIndex + 1 >= session.exercises.length ? 'Finalizar' : 'Próximo'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};