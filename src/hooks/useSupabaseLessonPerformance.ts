
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

type LessonPerformance = Tables<'lesson_performances'>;

export const useSupabaseLessonPerformance = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [performances, setPerformances] = useState<LessonPerformance[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPerformances = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lesson_performances')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPerformances(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar desempenho das aulas:', error);
      toast({
        title: "Erro ao carregar desempenho",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addOrUpdatePerformance = async (
    lessonId: string, 
    questionsCorrect: number, 
    questionsIncorrect: number,
    incorrectQuestions?: string,
    notes?: string
  ) => {
    if (!user) return null;

    try {
      setLoading(true);
      const totalQuestions = questionsCorrect + questionsIncorrect;
      const accuracyPercentage = totalQuestions > 0 ? Math.round((questionsCorrect / totalQuestions) * 100) : 0;

      // Sempre criar um novo registro (não mais verificar se existe)
      const { data, error } = await supabase
        .from('lesson_performances')
        .insert({
          lesson_id: lessonId,
          user_id: user.id,
          questions_correct: questionsCorrect,
          questions_incorrect: questionsIncorrect,
          total_questions: totalQuestions,
          accuracy_percentage: accuracyPercentage,
          incorrect_questions: incorrectQuestions || null,
          notes: notes || null
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar estado local
      setPerformances(prev => [data, ...prev]);

      toast({
        title: "Desempenho registrado!",
        description: `${accuracyPercentage}% de aproveitamento`
      });

      return data;
    } catch (error: any) {
      console.error('Erro ao salvar desempenho:', error);
      toast({
        title: "Erro ao salvar desempenho",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePerformance = async (performanceId: string, updates: Partial<LessonPerformance>) => {
    if (!user) return false;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lesson_performances')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', performanceId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Atualizar estado local
      setPerformances(prev => 
        prev.map(p => p.id === performanceId ? data : p)
      );

      toast({
        title: "Desempenho atualizado!",
        description: "As alterações foram salvas com sucesso"
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar desempenho:', error);
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deletePerformance = async (performanceId: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('lesson_performances')
        .delete()
        .eq('id', performanceId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Atualizar estado local
      setPerformances(prev => prev.filter(p => p.id !== performanceId));

      return true;
    } catch (error: any) {
      console.error('Erro ao excluir desempenho:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceByLesson = (lessonId: string): LessonPerformance[] => {
    return performances.filter(p => p.lesson_id === lessonId);
  };

  useEffect(() => {
    if (user) {
      loadPerformances();
    }
  }, [user]);

  return {
    performances,
    loading,
    addOrUpdatePerformance,
    updatePerformance,
    deletePerformance,
    getPerformanceByLesson,
    loadPerformances
  };
};
