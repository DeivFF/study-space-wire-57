import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useStudySessions } from '@/hooks/useStudySessions';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

interface LessonCategory {
  id: string;
  name: string;
  user_id: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface Lesson {
  id: string;
  category_id: string;
  name: string;
  duration_minutes: number;
  watched: boolean;
  watched_at: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  audio_file_path: string | null;
  html_file_path: string | null;
  website_url: string | null;
  rating: number | null;
  rated_at: string | null;
}

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

export const useSupabaseLessons = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { criarEMarcarConcluida } = useStudySessions();
  const [categories, setCategories] = useState<LessonCategory[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  const carregarCategorias = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('lesson_categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: "Erro ao carregar categorias",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const carregarAulas = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

    } catch (error: any) {
      console.error('Erro ao carregar aulas:', error);
      toast({
        title: "Erro ao carregar aulas",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const criarCategoria = async (nome: string): Promise<LessonCategory | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('lesson_categories')
        .insert([{
          name: nome,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prev => [data, ...prev]);
      toast({
        title: "Categoria criada!",
        description: "Nova categoria foi adicionada com sucesso"
      });
      
      return data;
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error);
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const editarCategoria = async (categoryId: string, nome: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lesson_categories')
        .update({ name: nome })
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(prev => prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, name: nome }
          : cat
      ));
      
      toast({
        title: "Categoria editada!",
        description: "Nome da categoria foi atualizado com sucesso"
      });
      
      return true;
    } catch (error: any) {
      console.error('Erro ao editar categoria:', error);
      toast({
        title: "Erro ao editar categoria",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const arquivarCategoria = async (categoryId: string, arquivar: boolean) => {
    try {
      const { error } = await supabase
        .from('lesson_categories')
        .update({ is_archived: arquivar })
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(prev => prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, is_archived: arquivar }
          : cat
      ));
      
      toast({
        title: arquivar ? "Categoria arquivada" : "Categoria desarquivada",
        description: arquivar 
          ? "A categoria foi arquivada e não será contabilizada nas estatísticas"
          : "A categoria foi desarquivada e voltará a ser contabilizada"
      });
    } catch (error: any) {
      console.error('Erro ao arquivar/desarquivar categoria:', error);
      toast({
        title: "Erro ao atualizar categoria",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const criarAula = async (
    categoryId: string,
    name: string,
    durationMinutes: number
  ): Promise<Lesson | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert([{
          category_id: categoryId,
          name,
          duration_minutes: durationMinutes,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setLessons(prev => [...prev, data]);
      toast({
        title: "Aula adicionada!",
        description: "Nova aula foi criada com sucesso"
      });

      return data;
    } catch (error: any) {
      console.error('Erro ao criar aula:', error);
      toast({
        title: "Erro ao criar aula",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const criarAulasEmLote = async (
    categoryId: string,
    lessons: { name: string; duration_minutes: number }[]
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const lessonsToInsert = lessons.map(lesson => ({
        category_id: categoryId,
        name: lesson.name,
        duration_minutes: lesson.duration_minutes,
        user_id: user.id
      }));

      const { data, error } = await supabase
        .from('lessons')
        .insert(lessonsToInsert)
        .select();

      if (error) throw error;

      setLessons(prev => [...prev, ...data]);
      toast({
        title: "Aulas adicionadas!",
        description: `${lessons.length} aulas foram criadas com sucesso`
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao criar aulas em lote:', error);
      toast({
        title: "Erro ao criar aulas",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const marcarAulaAssistida = async (lessonId: string, watched: boolean) => {
    try {
      const lesson = lessons.find(l => l.id === lessonId);
      if (!lesson) return;

      // Obter a data/hora atual no fuso horário de Brasília e depois converter para UTC
      const now = new Date();
      const brasiliaTime = toZonedTime(now, BRAZIL_TIMEZONE);
      const utcTime = fromZonedTime(brasiliaTime, BRAZIL_TIMEZONE);

      const updateData = {
        watched,
        watched_at: watched ? utcTime.toISOString() : null
      };

      const { error } = await supabase
        .from('lessons')
        .update(updateData)
        .eq('id', lessonId);

      if (error) throw error;

      if (watched) {
        await criarEMarcarConcluida(
          'livro',
          lessonId,
          lesson.name,
          lesson.duration_minutes
        );
      }

      setLessons(prev => prev.map(lesson =>
        lesson.id === lessonId 
          ? { ...lesson, ...updateData }
          : lesson
      ));

      if (!watched) {
        toast({
          title: "Aula desmarcada",
          description: "Aula foi desmarcada como assistida"
        });
      }
    } catch (error: any) {
      console.error('Erro ao atualizar aula:', error);
      toast({
        title: "Erro ao atualizar aula",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const editarAula = async (
    lessonId: string,
    name: string,
    durationMinutes: number
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          name,
          duration_minutes: durationMinutes
        })
        .eq('id', lessonId);

      if (error) throw error;

      setLessons(prev => prev.map(lesson =>
        lesson.id === lessonId 
          ? { ...lesson, name, duration_minutes: durationMinutes }
          : lesson
      ));

      toast({
        title: "Aula atualizada!",
        description: "Informações da aula foram atualizadas"
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao editar aula:', error);
      toast({
        title: "Erro ao editar aula",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const excluirAula = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
      
      toast({
        title: "Aula excluída",
        description: "Aula foi removida com sucesso"
      });
    } catch (error: any) {
      console.error('Erro ao excluir aula:', error);
      toast({
        title: "Erro ao excluir aula",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const excluirCategoria = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      setLessons(prev => prev.filter(lesson => lesson.category_id !== categoryId));
      
      toast({
        title: "Categoria excluída",
        description: "Categoria e suas aulas foram removidas"
      });
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error);
      toast({
        title: "Erro ao excluir categoria",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const obterEstatisticas = () => {
    // Filtrar apenas categorias ativas para estatísticas
    const activeCategoryIds = categories
      .filter(cat => !cat.is_archived)
      .map(cat => cat.id);
    
    const activeLessons = lessons.filter(lesson => 
      activeCategoryIds.includes(lesson.category_id)
    );
    
    const totalAulas = activeLessons.length;
    const aulasAssistidas = activeLessons.filter(l => l.watched).length;
    const tempoTotalMinutos = activeLessons.reduce((acc, l) => acc + l.duration_minutes, 0);
    const tempoAssistidoMinutos = activeLessons
      .filter(l => l.watched)
      .reduce((acc, l) => acc + l.duration_minutes, 0);
    
    return {
      totalAulas,
      aulasAssistidas,
      percentualProgresso: totalAulas > 0 ? Math.round((aulasAssistidas / totalAulas) * 100) : 0,
      tempoTotalHoras: Math.floor(tempoTotalMinutos / 60),
      tempoTotalMinutos: tempoTotalMinutos % 60,
      tempoAssistidoHoras: Math.floor(tempoAssistidoMinutos / 60),
      tempoAssistidoMinutos: tempoAssistidoMinutos % 60
    };
  };

  const atualizarWebsiteUrl = async (lessonId: string, websiteUrl: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ website_url: websiteUrl })
        .eq('id', lessonId);

      if (error) throw error;

      setLessons(prev => prev.map(lesson =>
        lesson.id === lessonId 
          ? { ...lesson, website_url: websiteUrl }
          : lesson
      ));

      toast({
        title: "Website atualizado!",
        description: "URL do website foi salva com sucesso"
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar website:', error);
      toast({
        title: "Erro ao atualizar website",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      carregarCategorias();
      carregarAulas();
    }
  }, [user]);

  // Filtrar categorias baseado no estado showArchived
  const filteredCategories = showArchived 
    ? categories 
    : categories.filter(cat => !cat.is_archived);

  return {
    categories: filteredCategories,
    allCategories: categories,
    lessons,
    loading,
    showArchived,
    setShowArchived,
    criarCategoria,
    editarCategoria,
    arquivarCategoria,
    criarAula,
    criarAulasEmLote,
    marcarAulaAssistida,
    editarAula,
    excluirAula,
    excluirCategoria,
    obterEstatisticas,
    carregarAulas,
    atualizarWebsiteUrl
  };
};
