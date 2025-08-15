
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Estatisticas {
  questoes_resolvidas: number;
  questoes_corretas: number;
}

export const useSupabaseStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Estatisticas>({
    questoes_resolvidas: 0,
    questoes_corretas: 0
  });
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  const carregarEstatisticas = async () => {
    if (!user) return;

    try {
      const hoje = new Date().toISOString().split('T')[0];

      // Carregar estatísticas de estudo do dia
      const { data: statsData, error: statsError } = await supabase
        .from('estatisticas_estudo')
        .select('*')
        .eq('user_id', user.id)
        .eq('data', hoje)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        throw statsError;
      }

      const estatisticas = {
        questoes_resolvidas: statsData?.questoes_resolvidas || 0,
        questoes_corretas: statsData?.questoes_corretas || 0
      };

      setStats(estatisticas);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarEstatisticas = async (novasStats: Partial<Estatisticas>) => {
    if (!user) return;

    try {
      const hoje = new Date().toISOString().split('T')[0];

      const { data: existingStats, error: selectError } = await supabase
        .from('estatisticas_estudo')
        .select('*')
        .eq('user_id', user.id)
        .eq('data', hoje)
        .single();

      const statsParaAtualizar = {
        questoes_resolvidas: (existingStats?.questoes_resolvidas || 0) + (novasStats.questoes_resolvidas || 0),
        questoes_corretas: (existingStats?.questoes_corretas || 0) + (novasStats.questoes_corretas || 0)
      };

      if (selectError && selectError.code === 'PGRST116') {
        // Não existe registro para hoje, criar um novo
        const { error: insertError } = await supabase
          .from('estatisticas_estudo')
          .insert([{
            user_id: user.id,
            data: hoje,
            ...statsParaAtualizar
          }]);

        if (insertError) throw insertError;
      } else if (selectError) {
        throw selectError;
      } else {
        // Atualizar registro existente
        const { error: updateError } = await supabase
          .from('estatisticas_estudo')
          .update(statsParaAtualizar)
          .eq('user_id', user.id)
          .eq('data', hoje);

        if (updateError) throw updateError;
      }

      // Recarregar estatísticas
      await carregarEstatisticas();
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  };

  // Configurar listener em tempo real para atualizações das estatísticas
  useEffect(() => {
    if (user && !isSubscribedRef.current) {
      carregarEstatisticas();

      // Escutar mudanças na tabela de estatísticas com nome único por usuário e timestamp
      const channelName = `stats-${user.id}-${Date.now()}`;
      channelRef.current = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'estatisticas_estudo',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            carregarEstatisticas();
          }
        )
        .subscribe();

      isSubscribedRef.current = true;
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [user]);

  return {
    stats,
    loading,
    atualizarEstatisticas,
    recarregar: carregarEstatisticas
  };
};
