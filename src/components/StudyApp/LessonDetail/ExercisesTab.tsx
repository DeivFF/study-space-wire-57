import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, Play, CheckCircle, XCircle, 
  Clock, Target, BookOpen, Edit3, Trash2, Eye
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
import { useExercises } from '@/hooks/useExercises';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/advanced-loading';
import { cn } from '@/lib/utils';

interface ExercisesTabProps {
  lessonId: string;
}

const difficultyColors = {
  facil: 'bg-green-500/20 text-green-600 border-green-500/30',
  medio: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
  dificil: 'bg-red-500/20 text-red-600 border-red-500/30',
};

const difficultyLabels = {
  facil: 'Fácil',
  medio: 'Médio', 
  dificil: 'Difícil',
};

const typeLabels = {
  multiple_choice: 'Múltipla escolha',
  essay: 'Dissertativo',
  true_false: 'Verdadeiro/Falso',
  fill_blank: 'Preencher lacunas',
};

export const ExercisesTab = ({ lessonId }: ExercisesTabProps) => {
  const [filter, setFilter] = useState<'all' | 'multiple_choice' | 'essay' | 'true_false' | 'fill_blank'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'facil' | 'medio' | 'dificil'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    exercises,
    isLoading,
    createExercise,
    updateExercise,
    deleteExercise,
    attemptExercise,
    isCreating,
    isUpdating,
    isDeleting,
  } = useExercises(lessonId);

  const filteredExercises = exercises.filter(exercise => {
    const matchesType = filter === 'all' || exercise.question_type === filter;
    const matchesDifficulty = difficultyFilter === 'all' || exercise.difficulty === difficultyFilter;
    const matchesSearch = searchTerm === '' || 
      exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesType && matchesDifficulty && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
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
            Banco de exercícios
          </h3>
          <p className="text-sm text-app-text-muted">
            Pratique e avalie seu conhecimento
          </p>
        </div>
        <Button 
          onClick={() => {/* TODO: Open create exercise modal */}}
          className="bg-app-accent text-white hover:bg-app-accent/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo exercício
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-app-bg border border-app-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-app-text mb-1">{exercises.length}</div>
          <div className="text-xs text-app-text-muted">Total</div>
        </div>
        <div className="bg-app-bg border border-app-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            0
          </div>
          <div className="text-xs text-app-text-muted">Concluídos</div>
        </div>
        <div className="bg-app-bg border border-app-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-app-accent mb-1">
            0
          </div>
          <div className="text-xs text-app-text-muted">Acertos</div>
        </div>
        <div className="bg-app-bg border border-app-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-app-text mb-1">
            0%
          </div>
          <div className="text-xs text-app-text-muted">Precisão</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-muted" />
          <Input
            placeholder="Buscar exercícios..."
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
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="multiple_choice">Múltipla escolha</SelectItem>
            <SelectItem value="essay">Dissertativo</SelectItem>
            <SelectItem value="true_false">Verdadeiro/Falso</SelectItem>
            <SelectItem value="fill_blank">Preencher lacunas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={difficultyFilter} onValueChange={(value: any) => setDifficultyFilter(value)}>
          <SelectTrigger className="w-40 bg-app-bg border-app-border text-app-text">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-app-bg border-app-border">
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="facil">Fácil</SelectItem>
            <SelectItem value="medio">Médio</SelectItem>
            <SelectItem value="dificil">Difícil</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Exercises List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredExercises.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 text-app-text-muted"
            >
              {exercises.length === 0 
                ? 'Nenhum exercício criado ainda'
                : 'Nenhum exercício encontrado com os filtros aplicados'
              }
            </motion.div>
          ) : (
            filteredExercises.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="border border-app-border rounded-xl p-4 bg-app-bg hover:bg-app-bg-soft transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-app-text mb-1">
                            {exercise.title}
                          </h4>
                          <p className="text-sm text-app-text-muted line-clamp-2">
                            {exercise.question_text}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-app-accent">
                            {exercise.points}
                          </div>
                          <div className="text-xs text-app-text-muted">pontos</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          className={cn(
                            "text-xs",
                            difficultyColors[exercise.difficulty]
                          )}
                        >
                          {difficultyLabels[exercise.difficulty]}
                        </Badge>
                        
                        <Badge variant="outline" className="text-xs">
                          {typeLabels[exercise.question_type]}
                        </Badge>

                        {exercise.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* TODO: Start exercise */}}
                      className="text-app-text border-app-border hover:bg-app-muted"
                    >
                      <Play className="w-4 h-4" />
                      Resolver
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {/* TODO: Edit exercise */}}
                      className="text-app-text-muted hover:text-app-text hover:bg-app-muted"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {/* TODO: Delete exercise */}}
                      className="text-app-text-muted hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};