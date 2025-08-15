
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface LessonFlashcard {
  id: string;
  lesson_id: string;
  frente: string;
  verso: string;
  dica?: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseLessonFlashcards = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<LessonFlashcard[]>([]);
  const [loading, setLoading] = useState(false);

  // Função para migrar dados do localStorage para o Supabase
  const migrateLocalStorageData = async () => {
    if (!user) return;

    try {
      const localStorageKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('lesson_flashcards_')
      );

      for (const key of localStorageKeys) {
        const lessonId = key.replace('lesson_flashcards_', '');
        const localFlashcards = JSON.parse(localStorage.getItem(key) || '[]');

        if (localFlashcards.length > 0) {
          console.log(`Migrando ${localFlashcards.length} flashcards da aula ${lessonId}`);
          
          // Verificar se já existem flashcards no Supabase para esta aula
          const { data: existingFlashcards } = await supabase
            .from('lesson_flashcards')
            .select('id')
            .eq('lesson_id', lessonId);

          // Se não há flashcards no Supabase, migrar do localStorage
          if (!existingFlashcards || existingFlashcards.length === 0) {
            const flashcardsToInsert = localFlashcards.map((fc: any) => ({
              user_id: user.id,
              lesson_id: lessonId,
              frente: fc.frente,
              verso: fc.verso,
              dica: fc.dica || null,
              created_at: fc.created_at || new Date().toISOString()
            }));

            const { error } = await supabase
              .from('lesson_flashcards')
              .insert(flashcardsToInsert);

            if (error) {
              console.error(`Erro ao migrar flashcards da aula ${lessonId}:`, error);
            } else {
              console.log(`Flashcards da aula ${lessonId} migrados com sucesso`);
              localStorage.removeItem(key); // Remove do localStorage após migração
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro durante a migração dos flashcards:', error);
    }
  };

  const adicionarFlashcard = async (lessonId: string, frente: string, verso: string, dica?: string): Promise<LessonFlashcard | null> => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar flashcards",
        variant: "destructive"
      });
      return null;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('lesson_flashcards')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          frente: frente.trim(),
          verso: verso.trim(),
          dica: dica?.trim() || null
        })
        .select()
        .single();

      if (error) throw error;

      const newFlashcard: LessonFlashcard = {
        id: data.id,
        lesson_id: data.lesson_id,
        frente: data.frente,
        verso: data.verso,
        dica: data.dica,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setFlashcards(prev => [newFlashcard, ...prev]);

      toast({
        title: "Flashcard criado!",
        description: "Novo flashcard adicionado à aula"
      });

      return newFlashcard;
    } catch (error: any) {
      console.error('Erro ao criar flashcard:', error);
      toast({
        title: "Erro ao criar flashcard",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const carregarFlashcards = async (lessonId?: string) => {
    if (!user) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('lesson_flashcards')
        .select('*')
        .order('created_at', { ascending: false });

      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedFlashcards: LessonFlashcard[] = (data || []).map(item => ({
        id: item.id,
        lesson_id: item.lesson_id,
        frente: item.frente,
        verso: item.verso,
        dica: item.dica,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setFlashcards(formattedFlashcards);
      
      if (lessonId) {
        console.log(`Carregados ${formattedFlashcards.length} flashcards para a aula ${lessonId}`);
      } else {
        console.log(`Carregados ${formattedFlashcards.length} flashcards no total`);
      }
    } catch (error: any) {
      console.error('Erro ao carregar flashcards:', error);
      toast({
        title: "Erro ao carregar flashcards",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarFlashcard = async (id: string, updates: Partial<LessonFlashcard>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('lesson_flashcards')
        .update({
          frente: updates.frente?.trim(),
          verso: updates.verso?.trim(),
          dica: updates.dica?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedFlashcard: LessonFlashcard = {
        id: data.id,
        lesson_id: data.lesson_id,
        frente: data.frente,
        verso: data.verso,
        dica: data.dica,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setFlashcards(prev => prev.map(fc => fc.id === id ? updatedFlashcard : fc));

      toast({
        title: "Flashcard atualizado!",
        description: "Alterações salvas com sucesso"
      });

      return updatedFlashcard;
    } catch (error: any) {
      console.error('Erro ao atualizar flashcard:', error);
      toast({
        title: "Erro ao atualizar flashcard",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const excluirFlashcard = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('lesson_flashcards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFlashcards(prev => prev.filter(fc => fc.id !== id));

      toast({
        title: "Flashcard removido",
        description: "Flashcard excluído com sucesso"
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao excluir flashcard:', error);
      toast({
        title: "Erro ao excluir flashcard",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Executar migração e carregar flashcards quando o usuário estiver logado
  useEffect(() => {
    if (user) {
      const runMigrationAndLoad = async () => {
        await migrateLocalStorageData();
        await carregarFlashcards();
      };
      runMigrationAndLoad();
    }
  }, [user]);

  return {
    flashcards,
    loading,
    adicionarFlashcard,
    carregarFlashcards,
    atualizarFlashcard,
    excluirFlashcard
  };
};
