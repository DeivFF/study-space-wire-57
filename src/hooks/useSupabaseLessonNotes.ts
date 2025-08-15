
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface LessonNote {
  id: string;
  lesson_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseLessonNotes = (lessonId: string) => {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Carregar anotações da aula
  const loadNotes = async () => {
    if (!user || !lessonId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lesson_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Erro ao carregar anotações:', error);
      toast({
        title: "Erro ao carregar anotações",
        description: "Não foi possível carregar as anotações da aula",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Criar nova anotação
  const createNote = async (content: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('lesson_notes')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          title: content.substring(0, 50) + (content.length > 50 ? '...' : ''), // Auto-gerar título
          content: content.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => [data, ...prev]);
      toast({
        title: "Anotação criada!",
        description: "Sua anotação foi salva com sucesso"
      });
      return true;
    } catch (error) {
      console.error('Erro ao criar anotação:', error);
      toast({
        title: "Erro ao criar anotação",
        description: "Não foi possível salvar a anotação",
        variant: "destructive"
      });
      return false;
    }
  };

  // Atualizar anotação
  const updateNote = async (noteId: string, content: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('lesson_notes')
        .update({
          title: content.substring(0, 50) + (content.length > 50 ? '...' : ''), // Auto-gerar título
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => prev.map(note => 
        note.id === noteId ? data : note
      ));
      
      toast({
        title: "Anotação atualizada!",
        description: "Suas alterações foram salvas"
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar anotação:', error);
      toast({
        title: "Erro ao atualizar anotação",
        description: "Não foi possível salvar as alterações",
        variant: "destructive"
      });
      return false;
    }
  };

  // Excluir anotação
  const deleteNote = async (noteId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('lesson_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== noteId));
      toast({
        title: "Anotação removida",
        description: "A anotação foi excluída com sucesso"
      });
      return true;
    } catch (error) {
      console.error('Erro ao excluir anotação:', error);
      toast({
        title: "Erro ao excluir anotação",
        description: "Não foi possível excluir a anotação",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (lessonId && user) {
      loadNotes();
    }
  }, [lessonId, user]);

  return {
    notes,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    loadNotes
  };
};
