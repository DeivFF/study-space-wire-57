
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface StudySession {
  id: string;
  user_id: string;
  study_type: 'livro' | 'questao' | 'audio' | 'website' | 'flashcard';
  resource_id: string;
  resource_title: string;
  is_completed: boolean;
  study_date: string;
  time_spent_minutes: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useStudySessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarSessoes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as sessões de estudo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const criarSessao = async (
    studyType: StudySession['study_type'],
    resourceId: string,
    resourceTitle: string,
    timeSpent: number = 0,
    notes?: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          study_type: studyType,
          resource_id: resourceId,
          resource_title: resourceTitle,
          time_spent_minutes: timeSpent,
          notes,
          is_completed: false
        })
        .select()
        .single();

      if (error) throw error;
      
      await carregarSessoes();
      return data;
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a sessão de estudo",
        variant: "destructive"
      });
      return null;
    }
  };

  const marcarConcluida = async (sessionId: string, isCompleted: boolean, timeSpent?: number) => {
    try {
      const updateData: any = { is_completed: isCompleted };
      if (timeSpent !== undefined) {
        updateData.time_spent_minutes = timeSpent;
      }

      const { error } = await supabase
        .from('study_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) throw error;
      
      await carregarSessoes();
      toast({
        title: "Sucesso",
        description: `Sessão marcada como ${isCompleted ? 'concluída' : 'pendente'}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a sessão",
        variant: "destructive"
      });
    }
  };

  const criarEMarcarConcluida = async (
    studyType: StudySession['study_type'],
    resourceId: string,
    resourceTitle: string,
    timeSpent: number
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          study_type: studyType,
          resource_id: resourceId,
          resource_title: resourceTitle,
          time_spent_minutes: timeSpent,
          is_completed: true
        })
        .select()
        .single();

      if (error) throw error;
      
      await carregarSessoes();
      return data;
    } catch (error) {
      console.error('Erro ao criar e marcar sessão como concluída:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a sessão de estudo",
        variant: "destructive"
      });
      return null;
    }
  };

  const excluirSessao = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('study_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      
      await carregarSessoes();
      toast({
        title: "Sucesso",
        description: "Sessão excluída com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir sessão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a sessão",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    carregarSessoes();
  }, [user]);

  return {
    sessions,
    loading,
    carregarSessoes,
    criarSessao,
    marcarConcluida,
    criarEMarcarConcluida,
    excluirSessao
  };
};
