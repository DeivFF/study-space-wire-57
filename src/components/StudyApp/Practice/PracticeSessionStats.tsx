import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Clock, Target, RotateCcw, X } from 'lucide-react';
import { SessionStats } from '@/types/practice';

interface PracticeSessionStatsProps {
  stats: SessionStats;
  type: 'flashcards' | 'exercises';
  onRestart: () => void;
  onClose: () => void;
}

export const PracticeSessionStats: React.FC<PracticeSessionStatsProps> = ({
  stats,
  type,
  onRestart,
  onClose,
}) => {
  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getPerformanceMessage = () => {
    if (stats.accuracy >= 90) return { message: 'Excelente!', color: 'text-green-600' };
    if (stats.accuracy >= 70) return { message: 'Muito bom!', color: 'text-blue-600' };
    if (stats.accuracy >= 50) return { message: 'Bom!', color: 'text-yellow-600' };
    return { message: 'Continue praticando!', color: 'text-orange-600' };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <Trophy className="w-12 h-12 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Sessão Concluída!</CardTitle>
          <p className={`text-lg font-medium ${performance.color}`}>
            {performance.message}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {stats.correct}/{stats.total}
              </div>
              <div className="text-sm text-muted-foreground">
                {type === 'flashcards' ? 'Flashcards' : 'Exercícios'} Corretos
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {stats.accuracy}%
              </div>
              <div className="text-sm text-muted-foreground">
                Taxa de Acerto
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{stats.correct} de {stats.total}</span>
            </div>
            <Progress value={stats.accuracy} className="w-full" />
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{formatTime(stats.timeSpent)}</div>
                <div className="text-xs text-muted-foreground">Tempo Total</div>
              </div>
            </div>
            
            {stats.avgTimePerCard && (
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{formatTime(stats.avgTimePerCard)}</div>
                  <div className="text-xs text-muted-foreground">Tempo Médio</div>
                </div>
              </div>
            )}
          </div>

          {/* Performance Badges */}
          <div className="flex flex-wrap gap-2 justify-center pt-4">
            {stats.accuracy === 100 && (
              <Badge className="bg-gold text-white">Perfeito!</Badge>
            )}
            {stats.accuracy >= 90 && (
              <Badge className="bg-green-500 text-white">Expert</Badge>
            )}
            {stats.total >= 20 && (
              <Badge className="bg-blue-500 text-white">Maratonista</Badge>
            )}
            {stats.avgTimePerCard && stats.avgTimePerCard < 10000 && (
              <Badge className="bg-purple-500 text-white">Rápido</Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6">
            <Button onClick={onRestart} variant="outline" className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Nova Sessão
            </Button>
            <Button onClick={onClose} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Finalizar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};