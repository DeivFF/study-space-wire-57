import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { useFlashcards } from '@/hooks/useFlashcards';
import { toast } from '@/components/ui/enhanced-toast';

interface FlashcardPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle: string;
}

export const FlashcardPracticeModal: React.FC<FlashcardPracticeModalProps> = ({
  isOpen,
  onClose,
  lessonId,
  lessonTitle
}) => {
  const {
    currentSession,
    getCurrentCard,
    getSessionProgress,
    showAnswer,
    setShowAnswer,
    startSession,
    endSession,
    reviewCard,
    isReviewing,
    dueCount
  } = useFlashcards(lessonId);

  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (isOpen && !currentSession) {
      if (dueCount > 0) {
        startSession(20);
      } else {
        toast.info('Nenhum flashcard disponível para revisão');
        onClose();
      }
    }
  }, [isOpen, currentSession, dueCount, startSession, onClose]);

  const handleClose = () => {
    if (currentSession) {
      endSession();
    }
    onClose();
  };

  const handleReview = (quality: number) => {
    const card = getCurrentCard();
    if (card) {
      reviewCard(card.id, quality);
    }
  };

  const progress = getSessionProgress();
  const currentCard = getCurrentCard();

  if (!currentSession || !currentCard) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Prática de Flashcards - {lessonTitle}</span>
            <Badge variant="secondary">
              {progress.current} de {progress.total}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4">
          {/* Progress Bar */}
          <Progress value={progress.percentage} className="w-full" />

          {/* Card Display */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="w-full max-w-2xl bg-card border rounded-lg p-8 min-h-[300px] flex items-center justify-center">
              <div className="text-center">
                {!showAnswer ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Frente</h3>
                    <div 
                      className="text-xl"
                      dangerouslySetInnerHTML={{ __html: currentCard.front_content }}
                    />
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Verso</h3>
                    <div 
                      className="text-xl text-muted-foreground mb-6"
                      dangerouslySetInnerHTML={{ __html: currentCard.front_content }}
                    />
                    <hr className="my-4" />
                    <div 
                      className="text-xl"
                      dangerouslySetInnerHTML={{ __html: currentCard.back_content }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-4">
              {!showAnswer ? (
                <Button 
                  onClick={() => setShowAnswer(true)}
                  size="lg"
                  className="min-w-[200px]"
                >
                  Mostrar Resposta
                </Button>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Como foi a dificuldade desta revisão?
                  </p>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant={rating <= 2 ? "destructive" : rating <= 3 ? "secondary" : "default"}
                        size="sm"
                        onClick={() => handleReview(rating)}
                        disabled={isReviewing}
                        className="flex flex-col items-center p-3"
                      >
                        <Star className={`w-4 h-4 ${rating <= 3 ? '' : 'fill-current'}`} />
                        <span className="text-xs mt-1">
                          {rating === 1 ? 'Muito Difícil' :
                           rating === 2 ? 'Difícil' :
                           rating === 3 ? 'Normal' :
                           rating === 4 ? 'Fácil' : 'Muito Fácil'}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Session Stats */}
          {currentSession.stats.total > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-center gap-6 text-sm text-muted-foreground">
                <span>Acertos: {currentSession.stats.correct}/{currentSession.stats.total}</span>
                <span>Precisão: {Math.round(currentSession.stats.accuracy)}%</span>
                <span>Tempo: {Math.round((Date.now() - startTime) / 1000)}s</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleClose}>
              Encerrar Sessão
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};