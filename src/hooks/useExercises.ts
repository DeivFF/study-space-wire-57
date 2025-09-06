import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studyAPI, Exercise } from '@/services/studyApi';
import { toast } from '@/components/ui/enhanced-toast';

export const useExercises = (lessonId: string) => {
  const queryClient = useQueryClient();

  const { data: exercises, isLoading, error } = useQuery({
    queryKey: ['exercises', lessonId],
    queryFn: () => studyAPI.getLessonExercises(lessonId),
    enabled: !!lessonId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Exercise, 'id'>) =>
      studyAPI.createExercise(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises', lessonId] });
      toast.success('Exercício criado com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar exercício', { description: error.message });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ exerciseId, data }: { exerciseId: string; data: Partial<Exercise> }) =>
      studyAPI.updateExercise(exerciseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises', lessonId] });
      toast.success('Exercício atualizado');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar exercício', { description: error.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (exerciseId: string) => studyAPI.deleteExercise(exerciseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises', lessonId] });
      toast.success('Exercício removido');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover exercício', { description: error.message });
    }
  });

  const attemptMutation = useMutation({
    mutationFn: ({ exerciseId, userAnswer, timeSpent }: { 
      exerciseId: string; 
      userAnswer: string; 
      timeSpent?: number 
    }) => studyAPI.attemptExercise(exerciseId, userAnswer, timeSpent),
    onSuccess: (result) => {
      if (result.correct) {
        toast.exercise.correct();
      } else {
        toast.exercise.incorrect(result.explanation);
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao enviar resposta', { description: error.message });
    }
  });

  return {
    exercises: exercises || [],
    isLoading,
    error,
    createExercise: createMutation.mutate,
    updateExercise: updateMutation.mutate,
    deleteExercise: deleteMutation.mutate,
    attemptExercise: attemptMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAttempting: attemptMutation.isPending,
    lastAttemptResult: attemptMutation.data,
  };
};