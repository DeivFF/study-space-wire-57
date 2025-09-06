import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useExercises } from '@/hooks/useExercises';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { PracticeSessionStats } from './PracticeSessionStats';
import { SessionConfigDialog } from './SessionConfigDialog';

interface ExercisePracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle: string;
}

export const ExercisePracticeModal: React.FC<ExercisePracticeModalProps> = ({
  isOpen,
  onClose,
  lessonId,
  lessonTitle,
}) => {
  const { exercises, attemptExercise, isAttempting, lastAttemptResult } = useExercises(lessonId);
  const { session, createSession, updateStats, nextItem, getCurrentItem, getProgress, endSession } = usePracticeSession();
  
  const [showConfig, setShowConfig] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);

  const currentExercise = getCurrentItem();
  const progress = getProgress();

  useEffect(() => {
    if (!isOpen) {
      setShowConfig(true);
      setShowResults(false);
      setUserAnswer('');
      setShowFeedback(false);
      endSession();
    }
  }, [isOpen, endSession]);

  const handleStartSession = (limit: number) => {
    if (exercises.length === 0) {
      return;
    }

    createSession({
      lessonId,
      type: 'exercises',
      limit,
    }, exercises);

    setShowConfig(false);
    setSessionStartTime(Date.now());
  };

  const handleSubmitAnswer = async () => {
    if (!currentExercise || !userAnswer.trim()) return;

    const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);

    try {
      await attemptExercise({
        exerciseId: currentExercise.id,
        userAnswer: userAnswer.trim(),
        timeSpent,
      });

      setShowFeedback(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleNextExercise = () => {
    if (!lastAttemptResult) return;

    updateStats(lastAttemptResult.correct);

    const hasNext = nextItem();
    if (!hasNext) {
      setShowResults(true);
    } else {
      setUserAnswer('');
      setShowFeedback(false);
      setSessionStartTime(Date.now());
    }
  };

  const handleClose = () => {
    endSession();
    onClose();
  };

  const handleRestart = () => {
    setShowResults(false);
    setShowConfig(true);
    endSession();
  };

  const renderExerciseContent = () => {
    if (!currentExercise) return null;

    const isMultipleChoice = currentExercise.question_type === 'multiple_choice';
    const isTrueFalse = currentExercise.question_type === 'true_false';
    const isEssay = currentExercise.question_type === 'essay';

    if (isMultipleChoice && Array.isArray(currentExercise.options)) {
      return (
        <RadioGroup value={userAnswer} onValueChange={setUserAnswer}>
          {currentExercise.options.map((option: string, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    if (isTrueFalse) {
      return (
        <RadioGroup value={userAnswer} onValueChange={setUserAnswer}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="0" id="true" />
            <Label htmlFor="true" className="cursor-pointer">Verdadeiro</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="1" id="false" />
            <Label htmlFor="false" className="cursor-pointer">Falso</Label>
          </div>
        </RadioGroup>
      );
    }

    if (isEssay) {
      return (
        <Textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Digite sua resposta..."
          className="min-h-[120px]"
        />
      );
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold">Prática de Exercícios</h2>
              <p className="text-sm text-muted-foreground">{lessonTitle}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Configuration */}
          {showConfig && (
            <SessionConfigDialog
              type="exercises"
              totalItems={exercises.length}
              onStart={handleStartSession}
              onCancel={handleClose}
            />
          )}

          {/* Practice Session */}
          {session && !showConfig && !showResults && (
            <div className="flex-1 flex flex-col">
              {/* Progress */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {progress.current} de {progress.total} exercícios
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {session.stats.accuracy}% de acerto
                  </span>
                </div>
                <Progress value={progress.percentage} className="w-full" />
              </div>

              {/* Exercise */}
              <div className="flex-1 overflow-auto p-6">
                {currentExercise && (
                  <Card className="w-full max-w-3xl mx-auto">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {currentExercise.title}
                        </CardTitle>
                        <Badge variant="outline">
                          {currentExercise.difficulty || 'Médio'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="prose prose-sm max-w-none">
                        <p>{currentExercise.question_text}</p>
                      </div>

                      {!showFeedback ? (
                        <div className="space-y-4">
                          {renderExerciseContent()}
                          
                          <div className="flex justify-end pt-4">
                            <Button 
                              onClick={handleSubmitAnswer}
                              disabled={!userAnswer.trim() || isAttempting}
                              className="min-w-[120px]"
                            >
                              {isAttempting ? (
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                              ) : null}
                              Responder
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Feedback */}
                          <div className={`p-4 rounded-lg border ${
                            lastAttemptResult?.correct 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-red-50 border-red-200'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              {lastAttemptResult?.correct ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                              <span className="font-medium">
                                {lastAttemptResult?.correct ? 'Correto!' : 'Incorreto'}
                              </span>
                            </div>
                            
                            {lastAttemptResult?.explanation && (
                              <p className="text-sm text-gray-700">
                                {lastAttemptResult.explanation}
                              </p>
                            )}
                          </div>

                          <div className="flex justify-end">
                            <Button onClick={handleNextExercise}>
                              {progress.current < progress.total ? 'Próximo' : 'Finalizar'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {showResults && session && (
            <PracticeSessionStats
              stats={session.stats}
              type="exercises"
              onRestart={handleRestart}
              onClose={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};