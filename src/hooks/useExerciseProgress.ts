
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface QuestionResult {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  attempts: number;
}

interface ExerciseProgress {
  id?: string;
  lessonId: string;
  currentQuestionIndex: number;
  answers: number[];
  results: QuestionResult[];
  isFinished: boolean;
}

export const useExerciseProgress = (lessonId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progress, setProgress] = useState<ExerciseProgress>({
    lessonId,
    currentQuestionIndex: 0,
    answers: [],
    results: [],
    isFinished: false
  });
  const [isLoading, setIsLoading] = useState(true);

  // Carregar progresso salvo ao inicializar
  useEffect(() => {
    if (user && lessonId) {
      loadProgress();
    }
  }, [user, lessonId]);

  const loadProgress = async () => {
    if (!user || !lessonId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('exercise_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Conversão segura dos dados JSON para os tipos corretos
        const answers = Array.isArray(data.answers) ? data.answers as number[] : [];
        const results = Array.isArray(data.results) ? (data.results as unknown as QuestionResult[]) : [];

        setProgress({
          id: data.id,
          lessonId: data.lesson_id,
          currentQuestionIndex: data.current_question_index,
          answers,
          results,
          isFinished: data.is_finished
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar progresso:', error);
      toast({
        title: "Erro ao carregar progresso",
        description: "Não foi possível restaurar o progresso anterior",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = async (updatedProgress: Partial<ExerciseProgress>) => {
    if (!user || !lessonId) return;

    const newProgress = { ...progress, ...updatedProgress };
    setProgress(newProgress);

    try {
      const progressData = {
        user_id: user.id,
        lesson_id: lessonId,
        current_question_index: newProgress.currentQuestionIndex,
        answers: newProgress.answers as any,
        results: newProgress.results as any,
        is_finished: newProgress.isFinished
      };

      if (newProgress.id) {
        const { error } = await supabase
          .from('exercise_progress')
          .update(progressData)
          .eq('id', newProgress.id);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('exercise_progress')
          .insert(progressData)
          .select('id')
          .single();

        if (error) throw error;
        if (data) {
          setProgress(prev => ({ ...prev, id: data.id }));
        }
      }
    } catch (error: any) {
      console.error('Erro ao salvar progresso:', error);
      toast({
        title: "Erro ao salvar progresso",
        description: "Não foi possível salvar seu progresso",
        variant: "destructive"
      });
    }
  };

  const updateCurrentQuestion = (index: number) => {
    saveProgress({ currentQuestionIndex: index });
  };

  const addResult = (result: QuestionResult) => {
    const existingResultIndex = progress.results.findIndex(r => r.questionId === result.questionId);
    const newResults = [...progress.results];
    
    if (existingResultIndex >= 0) {
      newResults[existingResultIndex] = {
        ...newResults[existingResultIndex],
        selectedAnswer: result.selectedAnswer,
        isCorrect: result.isCorrect,
        attempts: newResults[existingResultIndex].attempts + 1
      };
    } else {
      newResults.push(result);
    }

    saveProgress({ results: newResults });
  };

  const finishExercise = () => {
    saveProgress({ isFinished: true });
  };

  const resetProgress = async () => {
    if (!user || !lessonId) return;

    try {
      if (progress.id) {
        await supabase
          .from('exercise_progress')
          .delete()
          .eq('id', progress.id);
      }

      const resetData = {
        lessonId,
        currentQuestionIndex: 0,
        answers: [],
        results: [],
        isFinished: false
      };
      
      setProgress(resetData);
    } catch (error: any) {
      console.error('Erro ao resetar progresso:', error);
      toast({
        title: "Erro ao resetar progresso",
        description: "Não foi possível resetar o progresso",
        variant: "destructive"
      });
    }
  };

  return {
    progress,
    isLoading,
    updateCurrentQuestion,
    addResult,
    finishExercise,
    resetProgress,
    saveProgress
  };
};
