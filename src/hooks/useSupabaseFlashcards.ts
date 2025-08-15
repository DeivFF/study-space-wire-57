
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Flashcard {
  id: string;
  pergunta: string;
  resposta: string;
  materia: string;
  dificuldade: 'facil' | 'medio' | 'dificil';
  revisoes: number;
  acertos: number;
  created_at: string;
}

export const useSupabaseFlashcards = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarFlashcards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type cast the data to match our interface
      const typedData = (data || []).map(item => ({
        ...item,
        dificuldade: item.dificuldade as 'facil' | 'medio' | 'dificil'
      }));
      
      setFlashcards(typedData);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar flashcards",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarFlashcard = async (flashcard: Omit<Flashcard, 'id' | 'created_at' | 'revisoes' | 'acertos'>) => {
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
        .from('flashcards')
        .insert([{
          ...flashcard,
          revisoes: 0,
          acertos: 0,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Type cast the returned data
      const typedData = {
        ...data,
        dificuldade: data.dificuldade as 'facil' | 'medio' | 'dificil'
      };
      
      setFlashcards(prev => [typedData, ...prev]);
      toast({
        title: "Flashcard criado!",
        description: "Novo cartão adicionado com sucesso"
      });
      
      return typedData;
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar flashcard",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const atualizarFlashcard = async (id: string, updates: Partial<Flashcard>) => {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Type cast the returned data
      const typedData = {
        ...data,
        dificuldade: data.dificuldade as 'facil' | 'medio' | 'dificil'
      };
      
      setFlashcards(prev => prev.map(f => f.id === id ? typedData : f));
      return typedData;
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar flashcard",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      carregarFlashcards();
    }
  }, [user]);

  return {
    flashcards,
    loading,
    adicionarFlashcard,
    atualizarFlashcard,
    recarregar: carregarFlashcards
  };
};
