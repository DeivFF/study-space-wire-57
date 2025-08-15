
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ExerciseStats {
  totalAttempts: number;
  correctAttempts: number;
  accuracyRate: number;
  averageTimePerQuestion: number;
  totalQuestionsAttempted: number;
  uniqueQuestionsAttempted: number;
  categoriesStats: CategoryExerciseStats[];
  dailyStats: DailyExerciseStats[];
  weeklyStats: WeeklyExerciseStats[];
}

interface CategoryExerciseStats {
  categoryName: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracyRate: number;
  uniqueQuestions: number;
}

interface DailyExerciseStats {
  date: string;
  attempts: number;
  correct: number;
  accuracyRate: number;
}

interface WeeklyExerciseStats {
  week: string;
  attempts: number;
  correct: number;
  accuracyRate: number;
}

export const useSupabaseExerciseStats = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<ExerciseStats>({
    totalAttempts: 0,
    correctAttempts: 0,
    accuracyRate: 0,
    averageTimePerQuestion: 0,
    totalQuestionsAttempted: 0,
    uniqueQuestionsAttempted: 0,
    categoriesStats: [],
    dailyStats: [],
    weeklyStats: []
  });
  const [loading, setLoading] = useState(true);

  const carregarEstatisticas = async (categoryId?: string) => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar dados consolidados da tabela estatisticas_estudo (últimos 7 dias)
      const hoje = new Date();
      const seteDiasAtras = new Date(hoje);
      seteDiasAtras.setDate(hoje.getDate() - 6);

      const { data: estatisticasData, error: estatisticasError } = await supabase
        .from('estatisticas_estudo')
        .select('*')
        .eq('user_id', user.id)
        .gte('data', seteDiasAtras.toISOString().split('T')[0])
        .order('data', { ascending: true });

      if (estatisticasError) throw estatisticasError;

      // Buscar tentativas de questões de aulas (annotation_questions)
      let queryLessonQuestions = supabase
        .from('question_attempts')
        .select(`
          *,
          annotation_questions!inner(
            id,
            document_id,
            lessons!inner(
              id,
              name,
              category_id,
              lesson_categories!inner(
                id,
                name
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (categoryId && categoryId !== 'all') {
        queryLessonQuestions = queryLessonQuestions.eq('annotation_questions.lessons.category_id', categoryId);
      }

      const { data: lessonAttempts, error: lessonError } = await queryLessonQuestions;

      if (lessonError) throw lessonError;

      // Buscar tentativas de questões standalone
      const { data: standaloneAttempts, error: standaloneError } = await supabase
        .from('questao_tentativas')
        .select(`
          *,
          questoes!inner(
            id,
            materia,
            assunto
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (standaloneError) throw standaloneError;

      // Combinar dados de ambas as fontes
      const allAttempts = [
        ...(lessonAttempts || []).map(attempt => ({
          ...attempt,
          source: 'lesson',
          is_correct: attempt.is_correct,
          categoryName: attempt.annotation_questions?.lessons?.lesson_categories?.name || 'Sem categoria'
        })),
        ...(standaloneAttempts || []).map(attempt => ({
          ...attempt,
          source: 'standalone',
          is_correct: attempt.acertou,
          categoryName: attempt.questoes?.materia || 'Questões Avulsas'
        }))
      ];

      // Calcular estatísticas gerais
      const totalAttempts = allAttempts.length;
      const correctAttempts = allAttempts.filter(a => a.is_correct).length;
      const accuracyRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

      // Calcular estatísticas por categoria
      const categoryMap = new Map<string, { attempts: any[], name: string }>();
      
      allAttempts.forEach(attempt => {
        const categoryName = attempt.categoryName;
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, { name: categoryName, attempts: [] });
        }
        categoryMap.get(categoryName)!.attempts.push(attempt);
      });

      const categoriesStats: CategoryExerciseStats[] = Array.from(categoryMap.entries()).map(([name, data]) => {
        const categoryAttempts = data.attempts;
        const categoryCorrect = categoryAttempts.filter(a => a.is_correct).length;
        const categoryAccuracy = categoryAttempts.length > 0 ? (categoryCorrect / categoryAttempts.length) * 100 : 0;

        return {
          categoryName: name,
          totalAttempts: categoryAttempts.length,
          correctAttempts: categoryCorrect,
          accuracyRate: categoryAccuracy,
          uniqueQuestions: new Set(categoryAttempts.map(a => 
            a.source === 'lesson' ? a.question_id : a.questao_id
          )).size
        };
      });

      // Calcular estatísticas diárias baseadas na tabela estatisticas_estudo
      const dailyStats: DailyExerciseStats[] = [];
      for (let i = 6; i >= 0; i--) {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() - i);
        const dateStr = data.toISOString().split('T')[0];
        
        const dayData = estatisticasData?.find(e => e.data === dateStr);
        const attempts = dayData?.questoes_resolvidas || 0;
        const correct = dayData?.questoes_corretas || 0;
        const dayAccuracy = attempts > 0 ? (correct / attempts) * 100 : 0;

        dailyStats.push({
          date: dateStr,
          attempts,
          correct,
          accuracyRate: dayAccuracy
        });
      }

      setStats({
        totalAttempts,
        correctAttempts,
        accuracyRate,
        averageTimePerQuestion: 0, // TODO: implementar quando tiver tracking de tempo
        totalQuestionsAttempted: totalAttempts,
        uniqueQuestionsAttempted: new Set(allAttempts.map(a => 
          a.source === 'lesson' ? (a as any).question_id : (a as any).questao_id
        )).size,
        categoriesStats,
        dailyStats,
        weeklyStats: [] // TODO: implementar estatísticas semanais
      });

    } catch (error: any) {
      console.error('Erro ao carregar estatísticas de exercícios:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas de exercícios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      carregarEstatisticas();
    }
  }, [user]);

  return {
    stats,
    loading,
    carregarEstatisticas
  };
};
