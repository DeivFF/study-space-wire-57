
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface TranscriptionSegment {
  id: string;
  start_time: number;
  end_time: number;
  text: string;
}

export const useSupabaseLessonTranscriptions = (lessonId: string) => {
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && lessonId) {
      loadTranscriptions();
    }
  }, [user, lessonId]);

  const loadTranscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lesson_transcriptions')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedSegments: TranscriptionSegment[] = data.map(item => ({
        id: item.id,
        start_time: item.start_time,
        end_time: item.end_time,
        text: item.text
      }));

      setSegments(formattedSegments);
    } catch (error) {
      console.error('Erro ao carregar transcrições:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as transcrições",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSegment = async (segment: Omit<TranscriptionSegment, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('lesson_transcriptions')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          start_time: segment.start_time,
          end_time: segment.end_time,
          text: segment.text
        })
        .select()
        .single();

      if (error) throw error;

      const newSegment: TranscriptionSegment = {
        id: data.id,
        start_time: data.start_time,
        end_time: data.end_time,
        text: data.text
      };

      setSegments(prev => [...prev, newSegment].sort((a, b) => a.start_time - b.start_time));
      
      toast({
        title: "Segmento adicionado!",
        description: "Transcrição foi salva com sucesso"
      });

      return newSegment;
    } catch (error) {
      console.error('Erro ao salvar segmento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a transcrição",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateSegment = async (segmentId: string, updates: Partial<Omit<TranscriptionSegment, 'id'>>) => {
    try {
      const { error } = await supabase
        .from('lesson_transcriptions')
        .update({
          start_time: updates.start_time,
          end_time: updates.end_time,
          text: updates.text
        })
        .eq('id', segmentId);

      if (error) throw error;

      setSegments(prev => 
        prev.map(seg => 
          seg.id === segmentId 
            ? { ...seg, ...updates }
            : seg
        ).sort((a, b) => a.start_time - b.start_time)
      );

      toast({
        title: "Segmento atualizado!",
        description: "Transcrição foi atualizada com sucesso"
      });
    } catch (error) {
      console.error('Erro ao atualizar segmento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a transcrição",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteSegment = async (segmentId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_transcriptions')
        .delete()
        .eq('id', segmentId);

      if (error) throw error;

      setSegments(prev => prev.filter(seg => seg.id !== segmentId));
      
      toast({
        title: "Segmento excluído!",
        description: "Transcrição foi removida"
      });
    } catch (error) {
      console.error('Erro ao excluir segmento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a transcrição",
        variant: "destructive"
      });
      throw error;
    }
  };

  const bulkImportSegments = async (newSegments: Omit<TranscriptionSegment, 'id'>[]) => {
    if (!user) return;

    try {
      const segmentsToInsert = newSegments.map(segment => ({
        user_id: user.id,
        lesson_id: lessonId,
        start_time: segment.start_time,
        end_time: segment.end_time,
        text: segment.text
      }));

      const { data, error } = await supabase
        .from('lesson_transcriptions')
        .insert(segmentsToInsert)
        .select();

      if (error) throw error;

      const formattedSegments: TranscriptionSegment[] = data.map(item => ({
        id: item.id,
        start_time: item.start_time,
        end_time: item.end_time,
        text: item.text
      }));

      setSegments(prev => [...prev, ...formattedSegments].sort((a, b) => a.start_time - b.start_time));
      
      toast({
        title: "Transcrições importadas!",
        description: `${newSegments.length} segmentos foram adicionados com sucesso`
      });
    } catch (error) {
      console.error('Erro ao importar segmentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível importar as transcrições",
        variant: "destructive"
      });
      throw error;
    }
  };

  const clearAllSegments = async () => {
    try {
      const { error } = await supabase
        .from('lesson_transcriptions')
        .delete()
        .eq('lesson_id', lessonId);

      if (error) throw error;

      setSegments([]);
      
      toast({
        title: "Transcrições removidas!",
        description: "Todas as transcrições foram excluídas"
      });
    } catch (error) {
      console.error('Erro ao limpar segmentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover as transcrições",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    segments,
    loading,
    saveSegment,
    updateSegment,
    deleteSegment,
    bulkImportSegments,
    clearAllSegments,
    refreshSegments: loadTranscriptions
  };
};
