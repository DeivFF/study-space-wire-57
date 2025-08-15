
import { useState } from 'react';
import { History, CheckCircle, X, ChevronDown, ChevronUp, Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QuestionAttempt {
  id: string;
  selected_answer: number;
  is_correct: boolean;
  completed_at: string;
}

interface QuestionHistoryCardProps {
  questionId: string;
  lessonName?: string;
  categoryName?: string;
  lastAttemptResult?: 'correct' | 'incorrect' | null;
  totalAttempts: number;
  attempts: QuestionAttempt[];
}

const QuestionHistoryCard = ({ 
  questionId, 
  lessonName, 
  categoryName, 
  lastAttemptResult, 
  totalAttempts,
  attempts 
}: QuestionHistoryCardProps) => {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-blue-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>Informações da Questão</span>
          </div>
          {attempts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs"
            >
              <History className="w-3 h-3 mr-1" />
              Histórico
              {showHistory ? (
                <ChevronUp className="w-3 h-3 ml-1" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-1" />
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {lessonName && (
            <div>
              <span className="font-medium text-blue-700">Aula:</span>
              <p className="text-blue-600 truncate">{lessonName}</p>
            </div>
          )}
          
          {categoryName && (
            <div>
              <span className="font-medium text-blue-700">Categoria:</span>
              <p className="text-blue-600 truncate">{categoryName}</p>
            </div>
          )}

          <div>
            <span className="font-medium text-blue-700">Tentativas:</span>
            <p className="text-blue-600">{totalAttempts}</p>
          </div>
        </div>

        {lastAttemptResult && (
          <div className="flex items-center space-x-2">
            <span className="font-medium text-blue-700 text-sm">Último resultado:</span>
            <Badge 
              variant="outline" 
              className={lastAttemptResult === 'correct' ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'}
            >
              {lastAttemptResult === 'correct' ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Acertou
                </>
              ) : (
                <>
                  <X className="w-3 h-3 mr-1" />
                  Errou
                </>
              )}
            </Badge>
          </div>
        )}

        {/* Histórico expandido */}
        {showHistory && attempts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <h4 className="text-sm font-medium text-blue-700 mb-3">
              Histórico de Tentativas ({attempts.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {attempts.map((attempt, index) => (
                <div key={attempt.id} className="flex items-center justify-between text-xs bg-white/50 p-2 rounded">
                  <div className="flex items-center space-x-2">
                    {attempt.is_correct ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <X className="w-3 h-3 text-red-500" />
                    )}
                    <span className={attempt.is_correct ? 'text-green-700' : 'text-red-700'}>
                      Alternativa {String.fromCharCode(65 + attempt.selected_answer)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(attempt.completed_at).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(attempt.completed_at).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionHistoryCard;
