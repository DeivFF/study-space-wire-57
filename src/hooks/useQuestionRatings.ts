
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface QuestionRating {
  id: string;
  user_id: string;
  question_id: string;
  difficulty_rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export const useQuestionRatings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ratings, setRatings] = useState<QuestionRating[]>([]);
  const [loading, setLoading] = useState(false);

  const addRating = async (questionId: string, rating: number, comment?: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Criar nova avaliação (sempre cria um novo comentário)
      const { data, error } = await supabase
        .from('question_ratings')
        .insert({
          user_id: user.id,
          question_id: questionId,
          difficulty_rating: rating,
          comment: comment || null
        })
        .select()
        .single();

      if (error) throw error;

      setRatings(prev => [...prev, data]);
      
      toast({
        title: "Comentário adicionado!",
        description: "Seu comentário foi salvo com sucesso"
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao salvar avaliação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a avaliação",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getRatingsForQuestion = async (questionId: string) => {
    try {
      const { data, error } = await supabase
        .from('question_ratings')
        .select('*')
        .eq('question_id', questionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      return [];
    }
  };

  const updateRating = async (ratingId: string, rating: number, comment?: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return false;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('question_ratings')
        .update({
          difficulty_rating: rating,
          comment: comment || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', ratingId)
        .eq('user_id', user.id) // Só permite editar próprios comentários
        .select()
        .single();

      if (error) throw error;

      setRatings(prev => prev.map(r => r.id === ratingId ? data : r));
      
      toast({
        title: "Comentário atualizado!",
        description: "Sua alteração foi salva com sucesso"
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar comentário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o comentário",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteRating = async (ratingId: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return false;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('question_ratings')
        .delete()
        .eq('id', ratingId)
        .eq('user_id', user.id); // Só permite excluir próprios comentários

      if (error) throw error;

      setRatings(prev => prev.filter(r => r.id !== ratingId));
      
      toast({
        title: "Comentário excluído!",
        description: "O comentário foi removido com sucesso"
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao excluir comentário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o comentário",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getCurrentRating = (questionId: string) => {
    return ratings.find(r => r.question_id === questionId);
  };

  return {
    addRating,
    updateRating,
    deleteRating,
    getRatingsForQuestion,
    getCurrentRating,
    loading
  };
};
