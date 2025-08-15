import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Questao {
  id: string;
  enunciado: string;
  alternativas: string[];
  resposta_correta: number;
  explicacao: string;
  materia: string;
  assunto: string;
  banca: string;
  ano: number;
  dificuldade: 'facil' | 'medio' | 'dificil';
  respondida: boolean;
  acertou?: boolean;
  tempo_resposta?: number;
  created_at: string;
}

export const useSupabaseQuestoes = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const carregarQuestoes = async (page = 1, limit = 10, searchTerm = '', materia = '', assunto = '', status = '') => {
    try {
      setLoading(true);
      let query = supabase
        .from('questoes')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.ilike('enunciado', `%${searchTerm}%`);
      }
      if (materia) {
        query = query.eq('materia', materia);
      }
      if (assunto) {
        query = query.eq('assunto', assunto);
      }
      
      // Apply status filter
      if (status) {
        switch (status) {
          case 'nao-respondidas':
            query = query.eq('respondida', false);
            break;
          case 'respondidas':
            query = query.eq('respondida', true);
            break;
          case 'acertadas':
            query = query.eq('respondida', true).eq('acertou', true);
            break;
          case 'erradas':
            query = query.eq('respondida', true).eq('acertou', false);
            break;
        }
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      
      // Type cast the data to match our interface
      const typedData = (data || []).map(item => ({
        ...item,
        alternativas: item.alternativas as string[],
        dificuldade: item.dificuldade as 'facil' | 'medio' | 'dificil'
      }));
      
      setQuestoes(typedData);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar questões",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarQuestao = async (questao: Omit<Questao, 'id' | 'created_at' | 'respondida'>) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('questoes')
        .insert([{
          ...questao,
          alternativas: questao.alternativas as any,
          respondida: false,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      const typedData = {
        ...data,
        alternativas: data.alternativas as string[],
        dificuldade: data.dificuldade as 'facil' | 'medio' | 'dificil'
      };
      
      // Reload the first page to show the new question
      await carregarQuestoes(1);
      
      toast({
        title: "Questão adicionada!",
        description: "Nova questão criada com sucesso"
      });
      
      return typedData;
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar questão",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const atualizarQuestao = async (id: string, updates: Partial<Questao>) => {
    try {
      const { data, error } = await supabase
        .from('questoes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const typedData = {
        ...data,
        alternativas: data.alternativas as string[],
        dificuldade: data.dificuldade as 'facil' | 'medio' | 'dificil'
      };
      
      setQuestoes(prev => prev.map(q => q.id === id ? typedData : q));
      return typedData;
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar questão",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const excluirQuestao = async (id: string) => {
    try {
      const { error } = await supabase
        .from('questoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setQuestoes(prev => prev.filter(q => q.id !== id));
      setTotalCount(prev => prev - 1);
      
      toast({
        title: "Questão excluída",
        description: "Questão removida com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir questão",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      carregarQuestoes();
    }
  }, [user]);

  return {
    questoes,
    loading,
    totalCount,
    adicionarQuestao,
    atualizarQuestao,
    excluirQuestao,
    carregarQuestoes,
    recarregar: () => carregarQuestoes()
  };
};
