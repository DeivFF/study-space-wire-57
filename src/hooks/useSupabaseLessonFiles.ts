
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const useSupabaseLessonFiles = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Função para sanitizar nome do arquivo
  const sanitizeFileName = (fileName: string): string => {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Substitui caracteres especiais por underscore
      .replace(/_{2,}/g, '_') // Remove underscores consecutivos
      .replace(/^_+|_+$/g, ''); // Remove underscores no início e fim
  };

  const uploadAudio = async (lessonId: string, file: File): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para fazer upload",
        variant: "destructive"
      });
      return null;
    }

    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Apenas arquivos de áudio são aceitos",
        variant: "destructive"
      });
      return null;
    }

    try {
      setLoading(true);
      
      // Sanitizar o nome do arquivo
      const sanitizedFileName = sanitizeFileName(file.name);
      console.log('Original filename:', file.name);
      console.log('Sanitized filename:', sanitizedFileName);
      
      const fileName = `${user.id}/lessons/${lessonId}/audio_${Date.now()}_${sanitizedFileName}`;
      console.log('Storage path:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lesson-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Atualizar a tabela lessons com o caminho do áudio
      const { error: updateError } = await supabase
        .from('lessons')
        .update({ audio_file_path: uploadData.path })
        .eq('id', lessonId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(`Erro ao atualizar aula: ${updateError.message}`);
      }

      toast({
        title: "Áudio adicionado!",
        description: "O arquivo de áudio foi adicionado à aula"
      });

      return uploadData.path;
    } catch (error: any) {
      console.error('Erro no upload de áudio:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteAudio = async (lessonId: string) => {
    try {
      // Primeiro, obter o caminho do arquivo
      const { data: lesson, error: fetchError } = await supabase
        .from('lessons')
        .select('audio_file_path')
        .eq('id', lessonId)
        .single();

      if (fetchError || !lesson?.audio_file_path) {
        throw new Error('Arquivo de áudio não encontrado');
      }

      // Remover do storage
      const { error: deleteError } = await supabase.storage
        .from('lesson-files')
        .remove([lesson.audio_file_path]);

      if (deleteError) {
        console.error('Delete error:', deleteError);
      }

      // Remover referência da tabela lessons
      const { error: updateError } = await supabase
        .from('lessons')
        .update({ audio_file_path: null })
        .eq('id', lessonId);

      if (updateError) {
        throw new Error(`Erro ao atualizar aula: ${updateError.message}`);
      }

      toast({
        title: "Áudio removido",
        description: "O arquivo de áudio foi excluído com sucesso"
      });
    } catch (error: any) {
      console.error('Erro ao excluir áudio:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const uploadAudioFile = async (lessonId: string, file: File): Promise<string | null> => {
    return uploadAudio(lessonId, file);
  };

  const uploadHtmlFile = async (lessonId: string, file: File): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para fazer upload",
        variant: "destructive"
      });
      return null;
    }

    if (!file.type.includes('html') && !file.name.endsWith('.html')) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Apenas arquivos HTML são aceitos",
        variant: "destructive"
      });
      return null;
    }

    try {
      setLoading(true);
      
      // Sanitizar o nome do arquivo
      const sanitizedFileName = sanitizeFileName(file.name);
      console.log('Original filename:', file.name);
      console.log('Sanitized filename:', sanitizedFileName);
      
      const fileName = `${user.id}/lessons/${lessonId}/html_${Date.now()}_${sanitizedFileName}`;
      console.log('Storage path:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lesson-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Atualizar a tabela lessons com o caminho do HTML
      const { error: updateError } = await supabase
        .from('lessons')
        .update({ html_file_path: uploadData.path })
        .eq('id', lessonId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(`Erro ao atualizar aula: ${updateError.message}`);
      }

      toast({
        title: "Arquivo HTML adicionado!",
        description: "O arquivo HTML foi adicionado à aula"
      });

      return uploadData.path;
    } catch (error: any) {
      console.error('Erro no upload de HTML:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage.from('lesson-files').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const downloadFileAsBlob = async (filePath: string): Promise<Blob | null> => {
    try {
      const { data, error } = await supabase.storage.from('lesson-files').download(filePath);
      if (error) {
        throw error;
      }
      return data;
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast({
        title: "Erro no download",
        description: `Não foi possível baixar o arquivo: ${error.message}`,
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    loading,
    uploadAudio,
    deleteAudio,
    uploadAudioFile,
    uploadHtmlFile,
    getFileUrl,
    downloadFileAsBlob,
  };
};
