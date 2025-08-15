
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useStudySessions } from '@/hooks/useStudySessions';

interface LessonQuestion {
  id: string;
  lesson_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  created_at: string;
  updated_at: string;
}

interface QuestionAttempt {
  id: string;
  question_id: string;
  user_id: string;
  selected_answer: number;
  is_correct: boolean;
  completed_at: string;
}

export const useSupabaseLessonQuestions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { criarEMarcarConcluida } = useStudySessions();
  const [questions, setQuestions] = useState<LessonQuestion[]>([]);
  const [attempts, setAttempts] = useState<QuestionAttempt[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarQuestoes = async (lessonId?: string) => {
    if (!user) return;

    try {
      let query = supabase
        .from('annotation_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (lessonId) {
        query = query.eq('document_id', lessonId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const questionsData = (data || []).map(item => ({
        id: item.id,
        lesson_id: item.document_id, // document_id é usado como lesson_id
        question: item.question,
        options: item.options as string[],
        correct_answer: item.correct_answer,
        explanation: item.explanation,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setQuestions(questionsData);
    } catch (error: any) {
      console.error('Erro ao carregar questões:', error);
      toast({
        title: "Erro ao carregar questões",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const criarQuestao = async (
    lessonId: string,
    question: string,
    options: string[],
    correctAnswer: number,
    explanation?: string
  ): Promise<LessonQuestion | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('annotation_questions')
        .insert([{
          document_id: lessonId, // Usando document_id para armazenar lesson_id
          question,
          options: options as any,
          correct_answer: correctAnswer,
          explanation
        }])
        .select()
        .single();

      if (error) throw error;

      const newQuestion = {
        id: data.id,
        lesson_id: data.document_id,
        question: data.question,
        options: data.options as string[],
        correct_answer: data.correct_answer,
        explanation: data.explanation,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setQuestions(prev => [newQuestion, ...prev]);
      
      toast({
        title: "Questão criada!",
        description: "Nova questão foi adicionada com sucesso"
      });

      return newQuestion;
    } catch (error: any) {
      console.error('Erro ao criar questão:', error);
      toast({
        title: "Erro ao criar questão",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const registrarTentativa = async (
    questionId: string,
    selectedAnswer: number,
    isCorrect: boolean
  ): Promise<QuestionAttempt | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('question_attempts')
        .insert([{
          question_id: questionId,
          user_id: user.id,
          selected_answer: selectedAnswer,
          is_correct: isCorrect
        }])
        .select()
        .single();

      if (error) throw error;

      const newAttempt = {
        id: data.id,
        question_id: data.question_id,
        user_id: data.user_id,
        selected_answer: data.selected_answer,
        is_correct: data.is_correct,
        completed_at: data.completed_at
      };

      setAttempts(prev => [newAttempt, ...prev]);

      // Criar sessão de estudo para contabilizar o exercício no histórico
      const question = questions.find(q => q.id === questionId);
      if (question) {
        // Buscar informações da aula para usar no título da sessão
        const { data: lessonData } = await supabase
          .from('lessons')
          .select('name')
          .eq('id', question.lesson_id)
          .single();

        const lessonName = lessonData?.name || 'Questão';
        const questionTitle = `${lessonName} - Questão ${questions.findIndex(q => q.id === questionId) + 1}`;
        
        // Estimar 2 minutos por questão respondida
        const timeSpent = 2;
        
        await criarEMarcarConcluida('questao', question.lesson_id, questionTitle, timeSpent);
      }

      return newAttempt;
    } catch (error: any) {
      console.error('Erro ao registrar tentativa:', error);
      toast({
        title: "Erro ao registrar tentativa",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const excluirQuestao = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('annotation_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      setQuestions(prev => prev.filter(q => q.id !== questionId));
      
      toast({
        title: "Questão excluída",
        description: "Questão foi removida com sucesso"
      });
    } catch (error: any) {
      console.error('Erro ao excluir questão:', error);
      toast({
        title: "Erro ao excluir questão",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const carregarTentativas = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('question_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      
      setAttempts(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar tentativas:', error);
    }
  };

  useEffect(() => {
    if (user) {
      carregarQuestoes();
      carregarTentativas();
    }
  }, [user]);

  return {
    questions,
    attempts,
    loading,
    criarQuestao,
    registrarTentativa,
    excluirQuestao,
    carregarQuestoes,
    recarregar: () => {
      carregarQuestoes();
      carregarTentativas();
    }
  };
};
