
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface VideoCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface Video {
  id: string;
  category_id: string;
  title: string;
  file_name: string;
  file_path: string;
  duration: number;
  current_time_seconds: number;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseVideos = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarCategorias = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('annotation_categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories((data || []) as VideoCategory[]);
    } catch (error: any) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: "Erro ao carregar categorias",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const carregarVideos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('annotation_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Convert documents to video format for backwards compatibility
      const videosData = (data || []).map(doc => ({
        id: doc.id,
        category_id: doc.category_id,
        title: doc.title,
        file_name: doc.file_name,
        file_path: doc.file_path,
        duration: 0, // Default for PDFs
        current_time_seconds: 0,
        completed: false,
        user_id: doc.user_id,
        created_at: doc.created_at,
        updated_at: doc.updated_at
      }));
      setVideos(videosData);
    } catch (error: any) {
      console.error('Erro ao carregar vídeos:', error);
      toast({
        title: "Erro ao carregar vídeos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const criarCategoria = async (nome: string): Promise<VideoCategory | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('annotation_categories')
        .insert([{
          name: nome,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prev => [data as VideoCategory, ...prev]);
      return data as VideoCategory;
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

  const uploadVideo = async (
    categoryId: string,
    title: string,
    file: File,
    duration: number
  ): Promise<Video | null> => {
    if (!user) return null;

    try {
      // Gerar nome único para o arquivo
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload do arquivo para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Salvar dados do documento no banco
      const { data, error } = await supabase
        .from('annotation_documents')
        .insert([{
          category_id: categoryId,
          title,
          file_name: fileName,
          file_path: filePath,
          document_type: 'pdf',
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Convert document to video format for backwards compatibility
      const videoData = {
        id: data.id,
        category_id: data.category_id,
        title: data.title,
        file_name: data.file_name,
        file_path: data.file_path,
        duration: 0,
        current_time_seconds: 0,
        completed: false,
        user_id: data.user_id,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setVideos(prev => [videoData, ...prev]);
      
      toast({
        title: "Documento salvo!",
        description: "Documento foi carregado com sucesso"
      });

      return videoData;
    } catch (error: any) {
      console.error('Erro ao fazer upload do documento:', error);
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const atualizarProgressoVideo = async (videoId: string, currentTimeSeconds: number) => {
    try {
      const { error } = await supabase
        .from('annotation_documents')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', videoId);

      if (error) throw error;

      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, current_time_seconds: currentTimeSeconds }
          : video
      ));
    } catch (error: any) {
      console.error('Erro ao atualizar progresso:', error);
    }
  };

  const marcarVideoComoConcluido = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('annotation_documents')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', videoId);

      if (error) throw error;

      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, completed: true }
          : video
      ));
    } catch (error: any) {
      console.error('Erro ao marcar como concluído:', error);
    }
  };

  const obterUrlVideo = (filePath: string): string => {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  useEffect(() => {
    if (user) {
      carregarCategorias();
      carregarVideos();
    }
  }, [user]);

  return {
    categories,
    videos,
    loading,
    criarCategoria,
    uploadVideo,
    atualizarProgressoVideo,
    marcarVideoComoConcluido,
    obterUrlVideo,
    recarregar: () => {
      carregarCategorias();
      carregarVideos();
    }
  };
};
