
import { useState } from 'react';
import { Star, Play, Clock, BarChart3, Calendar, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReviewCardProps {
  review: {
    id: string;
    lesson_id: string;
    rating: number;
    ease_factor: number;
    interval_days: number;
    repetition: number;
    next_review_date: string;
    lessons?: {
      id: string;
      name: string;
      category_id: string;
      lesson_categories: {
        id: string;
        name: string;
      };
    };
  };
  lessonName: string;
  categoryName?: string;
  onRate: (lessonId: string, rating: number) => void;
  onShowHistory: (lessonId: string) => void;
  isSelected: boolean;
  onSelect: (lessonId: string) => void;
}

const ReviewCard = ({ 
  review, 
  lessonName, 
  categoryName,
  onRate, 
  onShowHistory, 
  isSelected, 
  onSelect 
}: ReviewCardProps) => {
  const getDifficultyColor = (easeFactor: number) => {
    if (easeFactor < 2.0) return 'bg-red-100 text-red-700 border-red-200';
    if (easeFactor < 2.5) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getDifficultyLabel = (easeFactor: number) => {
    if (easeFactor < 2.0) return 'Difícil';
    if (easeFactor < 2.5) return 'Médio';
    return 'Fácil';
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 2) return 'text-red-600';
    if (rating <= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{lessonName}</h4>
            {categoryName && (
              <div className="flex items-center gap-1 mb-2">
                <BookOpen className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-blue-600 font-medium">{categoryName}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                <span>Rep: {review.repetition}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{review.interval_days}d</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge 
              variant="outline" 
              className={`${getDifficultyColor(review.ease_factor)} border`}
            >
              {getDifficultyLabel(review.ease_factor)}
            </Badge>
            <div className="text-xs text-gray-500">
              {new Date(review.next_review_date).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>

        {isSelected ? (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Como foi sua revisão?
              </h3>
              <p className="text-sm text-gray-600">
                Avalie a dificuldade desta aula para personalizar suas revisões futuras
              </p>
            </div>
            
            <div className="grid grid-cols-5 gap-2 mb-6">
              {[
                { value: 1, label: 'Muito Difícil', color: 'bg-red-500 hover:bg-red-600', emoji: '😰' },
                { value: 2, label: 'Difícil', color: 'bg-orange-500 hover:bg-orange-600', emoji: '😅' },
                { value: 3, label: 'Médio', color: 'bg-yellow-500 hover:bg-yellow-600', emoji: '😐' },
                { value: 4, label: 'Fácil', color: 'bg-green-500 hover:bg-green-600', emoji: '😊' },
                { value: 5, label: 'Muito Fácil', color: 'bg-emerald-500 hover:bg-emerald-600', emoji: '🤩' }
              ].map((rating) => (
                <button
                  key={rating.value}
                  onClick={() => onRate(review.lesson_id, rating.value)}
                  className={`${rating.color} text-white rounded-lg p-4 transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[80px] flex flex-col items-center justify-center`}
                >
                  <div className="text-center w-full">
                    <div className="text-xl mb-1">{rating.emoji}</div>
                    <div className="font-bold text-sm mb-1">{rating.value}</div>
                    <div className="text-xs font-medium opacity-90 leading-tight break-words px-1">{rating.label}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelect('')}
                className="bg-white hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShowHistory(review.lesson_id)}
                className="hover:bg-white/70"
              >
                Ver Histórico
              </Button>
            </div>
            
            <div className="mt-4 text-center">
              <div className="text-xs text-gray-500 bg-white/50 rounded-lg p-2">
                💡 <strong>Dica:</strong> Avaliações baixas (1-2) reiniciam o intervalo • Avaliações altas (4-5) aumentam o intervalo
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onSelect(review.lesson_id)}
              className="bg-blue-600 hover:bg-blue-700 flex-1"
            >
              <Play className="w-3 h-3 mr-1" />
              Revisar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onShowHistory(review.lesson_id)}
            >
              Histórico
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewCard;
