
import React, { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useQuestionRatings } from '@/hooks/useQuestionRatings';

interface QuestionRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string;
  questionText: string;
}

interface QuestionRating {
  id: string;
  difficulty_rating: number;
  comment?: string;
  created_at: string;
}

const QuestionRatingModal = ({ isOpen, onClose, questionId, questionText }: QuestionRatingModalProps) => {
  const { addRating, getRatingsForQuestion, loading } = useQuestionRatings();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [ratingHistory, setRatingHistory] = useState<QuestionRating[]>([]);
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  const loadRatingHistory = useCallback(async () => {
    const history = await getRatingsForQuestion(questionId);
    setRatingHistory(history);
    
    // Se houver uma avaliação anterior, carregar os dados
    if (history.length > 0) {
      const latestRating = history[0];
      setRating(latestRating.difficulty_rating);
      setComment(latestRating.comment || '');
    }
  }, [getRatingsForQuestion, questionId]);

  useEffect(() => {
    if (isOpen) {
      loadRatingHistory();
    }
  }, [isOpen, loadRatingHistory]);

  const handleSubmit = async () => {
    if (rating === 0) {
      return;
    }

    const success = await addRating(questionId, rating, comment);
    if (success) {
      onClose();
      // Reset form
      setRating(0);
      setComment('');
      setShowHistory(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setShowHistory(false);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingColor = (ratingValue: number) => {
    if (ratingValue <= 3) return 'text-green-600';
    if (ratingValue <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingText = (ratingValue: number) => {
    if (ratingValue <= 3) return 'Fácil';
    if (ratingValue <= 6) return 'Médio';
    return 'Difícil';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>Avaliar Dificuldade da Questão</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Questão */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Questão:</p>
            <p className="text-gray-800 line-clamp-3">{questionText}</p>
          </div>

          {!showHistory ? (
            <>
              {/* Avaliação de Dificuldade */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Qual a dificuldade desta questão? (0 = Muito Fácil, 10 = Muito Difícil)
                </Label>
                
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`p-1 transition-colors ${
                        star <= (hoveredStar || rating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setRating(star)}
                    >
                      <Star className="w-8 h-8 fill-current" />
                    </button>
                  ))}
                  
                  {rating > 0 && (
                    <div className="ml-4 flex items-center space-x-2">
                      <span className="text-lg font-bold">{rating}</span>
                      <span className={`text-sm font-medium ${getRatingColor(rating)}`}>
                        {getRatingText(rating)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Comentário */}
              <div className="space-y-3">
                <Label htmlFor="comment" className="text-base font-medium">
                  Comentário (opcional)
                </Label>
                <Textarea
                  id="comment"
                  placeholder="Adicione um comentário sobre esta questão..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Histórico Button */}
              {ratingHistory.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowHistory(true)}
                  className="w-full"
                >
                  <History className="w-4 h-4 mr-2" />
                  Ver Histórico de Avaliações ({ratingHistory.length})
                </Button>
              )}

              {/* Botões */}
              <div className="flex justify-end space-x-3">
                <Button onClick={handleClose} variant="outline">
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={rating === 0 || loading}>
                  {loading ? 'Salvando...' : 'Salvar Avaliação'}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Histórico de Avaliações */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Histórico de Avaliações</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(false)}
                  >
                    Voltar
                  </Button>
                </div>
                
                <Separator />

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {ratingHistory.map((historyItem, index) => (
                    <div key={historyItem.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= historyItem.difficulty_rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-medium">{historyItem.difficulty_rating}/10</span>
                          <span className={`text-sm font-medium ${getRatingColor(historyItem.difficulty_rating)}`}>
                            {getRatingText(historyItem.difficulty_rating)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(historyItem.created_at)}
                        </span>
                      </div>
                      
                      {historyItem.comment && (
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700">{historyItem.comment}</p>
                          </div>
                        </div>
                      )}
                      
                      {index === 0 && (
                        <div className="text-xs text-blue-600 font-medium">
                          Avaliação mais recente
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionRatingModal;
