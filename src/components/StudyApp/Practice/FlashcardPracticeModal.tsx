import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useFlashcards } from '@/hooks/useFlashcards';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { PracticeSessionStats } from './PracticeSessionStats';
import { SessionConfigDialog } from './SessionConfigDialog';

interface FlashcardPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle: string;
}

const DifficultyButtons = [
  { value: 1, label: 'Muito Difícil', color: 'bg-red-500' },
  { value: 2, label: 'Difícil', color: 'bg-orange-500' },
  { value: 3, label: 'Normal', color: 'bg-yellow-500' },
  { value: 4, label: 'Fácil', color: 'bg-blue-500' },
  { value: 5, label: 'Muito Fácil', color: 'bg-green-500' },
];

export const FlashcardPracticeModal: React.FC<FlashcardPracticeModalProps> = ({
  isOpen,
  onClose,
  lessonId,
  lessonTitle,
}) => {
  const { allCards, reviewCard, isReviewing } = useFlashcards(lessonId);
  const { session, createSession, updateStats, nextItem, getCurrentItem, getProgress, endSession } = usePracticeSession();
  
  const [showConfig, setShowConfig] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const currentCard = getCurrentItem();
  const progress = getProgress();

  useEffect(() => {
    if (!isOpen) {
      setShowConfig(true);
      setShowAnswer(false);
      setShowResults(false);
      endSession();
    }
  }, [isOpen, endSession]);

  const handleStartSession = (limit: number) => {
    if (allCards.length === 0) {
      return;
    }

    createSession({
      lessonId,
      type: 'flashcards',
      limit,
    }, allCards);

    setShowConfig(false);
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleDifficultySelect = async (difficulty: number) => {
    if (!currentCard) return;

    try {
      await reviewCard(currentCard.id, difficulty);
      updateStats(difficulty >= 3);

      const hasNext = nextItem();
      if (!hasNext) {
        setShowResults(true);
      } else {
        setShowAnswer(false);
      }
    } catch (error) {
      console.error('Error reviewing card:', error);
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold">Prática de Flashcards</h2>
              <p className="text-sm text-muted-foreground">{lessonTitle}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Configuration */}
          {showConfig && (
            <SessionConfigDialog
              type="flashcards"
              totalItems={allCards.length}
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
                    {progress.current} de {progress.total} flashcards
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {session.stats.accuracy}% de acerto
                  </span>
                </div>
                <Progress value={progress.percentage} className="w-full" />
              </div>

              {/* Flashcard */}
              <div className="flex-1 flex items-center justify-center p-6">
                {currentCard && (
                  <Card className="w-full max-w-2xl min-h-[300px]">
                    <CardContent className="p-8">
                      <div className="text-center">
                        <Badge variant="secondary" className="mb-4">
                          {showAnswer ? 'Resposta' : 'Pergunta'}
                        </Badge>
                        
                        <div className="text-lg leading-relaxed mb-6">
                          {showAnswer ? currentCard.back_content : currentCard.front_content}
                        </div>

                        {!showAnswer ? (
                          <Button onClick={handleShowAnswer} className="w-full max-w-sm">
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Resposta
                          </Button>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">
                              Como foi a dificuldade desta pergunta?
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                              {DifficultyButtons.map((btn) => (
                                <Button
                                  key={btn.value}
                                  onClick={() => handleDifficultySelect(btn.value)}
                                  disabled={isReviewing}
                                  variant="outline"
                                  className="flex flex-col p-4 h-auto hover:scale-105 transition-transform"
                                >
                                  <div className={`w-4 h-4 rounded-full ${btn.color} mb-1`} />
                                  <span className="text-xs">{btn.label}</span>
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
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
              type="flashcards"
              onRestart={handleRestart}
              onClose={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};