import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, FileText, Upload, Play, CheckCircle, 
  Trash2, Filter, Calendar, Target, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useActivity } from '@/hooks/useActivity';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/advanced-loading';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface HistoryTabProps {
  lessonId: string;
}

const activityIcons = {
  file_upload: Upload,
  note_created: FileText,
  flashcard_reviewed: Target,
  exercise_completed: CheckCircle,
  session_started: Play,
  default: Clock,
};

const activityColors = {
  file_upload: 'text-blue-600',
  note_created: 'text-green-600',
  flashcard_reviewed: 'text-purple-600',
  exercise_completed: 'text-orange-600',
  session_started: 'text-red-600',
  default: 'text-app-text-muted',
};

const typeLabels = {
  file_upload: 'Arquivo',
  note_created: 'Anotação',
  flashcard_reviewed: 'Flashcard',
  exercise_completed: 'Exercício',
  session_started: 'Sessão',
  all: 'Todos',
};

export const HistoryTab = ({ lessonId }: HistoryTabProps) => {
  const [filter, setFilter] = useState<'all' | 'file_upload' | 'note_created' | 'flashcard_reviewed' | 'exercise_completed' | 'session_started'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(50);

  const {
    activities,
    isLoading,
    clearActivity,
    isClearing,
  } = useActivity(lessonId);

  const filteredActivities = activities.filter(activity => {
    const matchesType = filter === 'all' || activity.type === filter;
    const matchesSearch = searchTerm === '' || 
      activity.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInHours = Math.abs(now.getTime() - activityTime.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(activityTime, 'HH:mm', { locale: ptBR });
    } else {
      return format(activityTime, 'dd/MM HH:mm', { locale: ptBR });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-app-text">
            Linha do tempo da aula
          </h3>
          <p className="text-sm text-app-text-muted">
            Histórico completo de atividades realizadas
          </p>
        </div>
        <Button
          onClick={() => clearActivity()}
          disabled={isClearing || activities.length === 0}
          variant="outline"
          className="text-app-text border-app-border hover:bg-app-muted"
        >
          {isClearing ? <LoadingSpinner size="sm" /> : <Trash2 className="w-4 h-4 mr-2" />}
          Limpar histórico
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(typeLabels)
          .filter(([key]) => key !== 'all')
          .map(([type, label]) => {
            const count = activities.filter(a => a.type === type).length;
            const Icon = activityIcons[type as keyof typeof activityIcons] || activityIcons.default;
            const color = activityColors[type as keyof typeof activityColors] || activityColors.default;
            
            return (
              <div key={type} className="bg-app-bg border border-app-border rounded-xl p-3 text-center">
                <Icon className={cn("w-5 h-5 mx-auto mb-2", color)} />
                <div className="text-lg font-bold text-app-text">{count}</div>
                <div className="text-xs text-app-text-muted">{label}</div>
              </div>
            );
          })
        }
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-muted" />
          <Input
            placeholder="Buscar atividades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-app-bg border-app-border text-app-text"
          />
        </div>
        
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-48 bg-app-bg border-app-border text-app-text">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-app-bg border-app-border">
            {Object.entries(typeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
          <SelectTrigger className="w-32 bg-app-bg border-app-border text-app-text">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-app-bg border-app-border">
            <SelectItem value="20">20 itens</SelectItem>
            <SelectItem value="50">50 itens</SelectItem>
            <SelectItem value="100">100 itens</SelectItem>
            <SelectItem value="200">200 itens</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredActivities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 text-app-text-muted"
            >
              {activities.length === 0 
                ? 'Nenhuma atividade registrada ainda'
                : 'Nenhuma atividade encontrada com os filtros aplicados'
              }
            </motion.div>
          ) : (
            filteredActivities.map((activity, index) => {
              const Icon = activityIcons[activity.type as keyof typeof activityIcons] || activityIcons.default;
              const color = activityColors[activity.type as keyof typeof activityColors] || activityColors.default;
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-4 p-4 border border-app-border rounded-xl bg-app-bg hover:bg-app-bg-soft transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-app-muted flex items-center justify-center">
                      <Icon className={cn("w-5 h-5", color)} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-app-text mb-1">
                          {activity.details}
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs text-app-text-muted">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTimeAgo(activity.timestamp)}
                          </div>
                          
                          {activity.duration && (
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {formatDuration(activity.duration)}
                            </div>
                          )}
                          
                        </div>
                      </div>
                      
                      <Badge variant="outline" className="text-xs">
                        {typeLabels[activity.type as keyof typeof typeLabels] || activity.type}
                      </Badge>
                    </div>

                    {activity.data && Object.keys(activity.data).length > 0 && (
                      <div className="mt-2 p-2 bg-app-muted rounded-lg">
                        <pre className="text-xs text-app-text-muted overflow-hidden">
                          {JSON.stringify(activity.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {filteredActivities.length > 0 && filteredActivities.length >= limit && (
        <div className="text-center">
          <Button
            onClick={() => setLimit(limit + 50)}
            variant="outline"
            className="text-app-text border-app-border hover:bg-app-muted"
          >
            Carregar mais atividades
          </Button>
        </div>
      )}
    </div>
  );
};