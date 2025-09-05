import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Target, Clock, CheckCircle, XCircle, 
  FileText, Upload, Calendar, Award, BarChart3,
  Download, RefreshCw, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStatistics } from '@/hooks/useStatistics';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/advanced-loading';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface StatsTabProps {
  lessonId: string;
}

export const StatsTab = ({ lessonId }: StatsTabProps) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  
  const {
    statistics,
    isLoading,
    error,
  } = useStatistics(lessonId);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getAccuracyColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'from-green-500 to-green-600';
    if (percentage >= 70) return 'from-yellow-500 to-yellow-600';
    if (percentage >= 40) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-app-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium text-app-text mb-2">
          Sem dados estatísticos
        </h3>
        <p className="text-app-text-muted mb-4">
          Comece a estudar para gerar estatísticas
        </p>
        <Button
          onClick={() => {/* TODO: Refresh functionality */}}
          disabled={isLoading}
          className="bg-app-accent text-white hover:bg-app-accent/90"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Atualizar dados
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-app-text">
            Estatísticas da aula
          </h3>
          <p className="text-sm text-app-text-muted">
            Consolidadas do histórico de atividades
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {/* TODO: Export functionality */}}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="text-app-text border-app-border hover:bg-app-muted"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <Download className="w-4 h-4 mr-2" />}
            Exportar
          </Button>
          <Button
            onClick={() => {/* TODO: Refresh functionality */}}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="text-app-text border-app-border hover:bg-app-muted"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-app-bg border border-app-border rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-app-text">Tempo Total</span>
          </div>
          <div className="text-2xl font-bold text-app-text mb-1">
            {formatTime(statistics.total_study_time)}
          </div>
          <div className="text-xs text-app-text-muted">
            Última atividade: {statistics.last_activity 
              ? format(new Date(statistics.last_activity), 'dd/MM HH:mm', { locale: ptBR })
              : 'Nunca'
            }
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-app-bg border border-app-border rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-app-text">Precisão</span>
          </div>
          <div className={cn("text-2xl font-bold mb-1", getAccuracyColor(statistics.accuracy_percentage))}>
            {statistics.accuracy_percentage.toFixed(1)}%
          </div>
          <div className="text-xs text-app-text-muted">
            {statistics.correct_reviews} de {statistics.total_reviews} corretos
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-app-bg border border-app-border rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-app-text">Conteúdo</span>
          </div>
          <div className="text-2xl font-bold text-app-text mb-1">
            {statistics.files_count + statistics.notes_count}
          </div>
          <div className="text-xs text-app-text-muted">
            {statistics.files_count} arquivos, {statistics.notes_count} notas
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-app-bg border border-app-border rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-app-text">Atividades</span>
          </div>
          <div className="text-2xl font-bold text-app-text mb-1">
            {statistics.flashcards_count + statistics.exercises_count}
          </div>
          <div className="text-xs text-app-text-muted">
            Total de exercícios e cards
          </div>
        </motion.div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Flashcards Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-app-bg border border-app-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-app-accent" />
            <h4 className="font-semibold text-app-text">Flashcards</h4>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-app-text-muted">Total de cards</span>
              <span className="font-semibold text-app-text">{statistics.flashcards_count}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-app-text-muted">Devidos hoje</span>
                <span className="font-semibold text-red-600">{statistics.flashcards_due}</span>
              </div>
              <Progress 
                value={(statistics.flashcards_due / Math.max(statistics.flashcards_count, 1)) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-app-text-muted">Taxa de acerto</span>
                <span className={cn("font-semibold", getAccuracyColor(statistics.accuracy_percentage))}>
                  {statistics.accuracy_percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-app-muted rounded-full h-2">
                <div 
                  className={cn("h-2 rounded-full bg-gradient-to-r", getProgressColor(statistics.accuracy_percentage))}
                  style={{ width: `${statistics.accuracy_percentage}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Exercises Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-app-bg border border-app-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-app-text">Exercícios</h4>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-app-text-muted">Total de exercícios</span>
              <span className="font-semibold text-app-text">{statistics.exercises_count}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {statistics.correct_reviews}
                </div>
                <div className="text-xs text-green-700">Acertos</div>
              </div>
              
              <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-lg font-bold text-red-600">
                  {statistics.total_reviews - statistics.correct_reviews}
                </div>
                <div className="text-xs text-red-700">Erros</div>
              </div>
            </div>

            {statistics.total_reviews > 0 && (
              <div className="pt-2">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-app-text-muted">Progresso geral</span>
                  <span className="font-semibold text-app-text">
                    {Math.round((statistics.correct_reviews / statistics.total_reviews) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(statistics.correct_reviews / statistics.total_reviews) * 100} 
                  className="h-2"
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Content Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-app-bg border border-app-border rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-app-text">Análise de Conteúdo</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {statistics.files_count}
            </div>
            <div className="text-sm text-app-text-muted mb-3">Arquivos anexados</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-app-text-muted">PDFs</span>
                <span className="text-app-text">-</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-app-text-muted">Áudios</span>
                <span className="text-app-text">-</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-app-text-muted">Imagens</span>
                <span className="text-app-text">-</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {statistics.notes_count}
            </div>
            <div className="text-sm text-app-text-muted mb-3">Anotações criadas</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-app-text-muted">Palavras est.</span>
                <span className="text-app-text">-</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-app-text-muted">Com tags</span>
                <span className="text-app-text">-</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-app-text-muted">Última edição</span>
                <span className="text-app-text">-</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {Math.round(statistics.total_study_time / 3600) || 0}h
            </div>
            <div className="text-sm text-app-text-muted mb-3">Tempo investido</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-app-text-muted">Sessões</span>
                <span className="text-app-text">-</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-app-text-muted">Média/sessão</span>
                <span className="text-app-text">-</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-app-text-muted">Mais ativo</span>
                <span className="text-app-text">-</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};