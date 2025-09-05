import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { studyAPI, LessonFile } from '@/services/studyApi';
import { toast } from '@/components/ui/enhanced-toast';

export const useFiles = (lessonId: string) => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const queryClient = useQueryClient();

  const { data: files, isLoading, error } = useQuery({
    queryKey: ['files', lessonId],
    queryFn: () => studyAPI.getLessonFiles(lessonId),
    enabled: !!lessonId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      try {
        // Simulate upload progress for each file
        files.forEach((file, index) => {
          const fileKey = `${file.name}-${index}`;
          setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));
          
          // Simulate progress
          const interval = setInterval(() => {
            setUploadProgress(prev => {
              const currentProgress = prev[fileKey] || 0;
              if (currentProgress >= 100) {
                clearInterval(interval);
                return prev;
              }
              return { ...prev, [fileKey]: currentProgress + 10 };
            });
          }, 200);
        });

        const result = await studyAPI.uploadLessonFiles(lessonId, files);
        
        // Clear progress
        setUploadProgress({});
        
        return result;
      } catch (error) {
        setUploadProgress({});
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['files', lessonId] });
      toast.file.uploaded(data.length);
    },
    onError: (error: Error) => {
      console.error('Upload error:', error);
      toast.file.uploadError(error.message);
      setUploadProgress({});
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => studyAPI.deleteFile(fileId),
    onSuccess: (_, fileId) => {
      queryClient.invalidateQueries({ queryKey: ['files', lessonId] });
      const file = files?.find(f => f.id === fileId);
      if (file) {
        toast.file.deleted(file.name);
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover arquivo', { description: error.message });
    }
  });

  const markPrimaryMutation = useMutation({
    mutationFn: (fileId: string) => studyAPI.markFileAsPrimary(fileId),
    onSuccess: (_, fileId) => {
      queryClient.invalidateQueries({ queryKey: ['files', lessonId] });
      const file = files?.find(f => f.id === fileId);
      if (file) {
        toast.file.markedPrimary(file.name);
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao marcar arquivo como principal', { description: error.message });
    }
  });

  const markStudiedMutation = useMutation({
    mutationFn: ({ fileId, studied }: { fileId: string; studied: boolean }) =>
      studyAPI.markFileAsStudied(fileId, studied),
    onSuccess: (_, { studied }) => {
      queryClient.invalidateQueries({ queryKey: ['files', lessonId] });
      toast.success(studied ? 'Arquivo marcado como estudado' : 'Arquivo desmarcado');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar status do arquivo', { description: error.message });
    }
  });

  const renameMutation = useMutation({
    mutationFn: ({ fileId, fileName }: { fileId: string; fileName: string }) =>
      studyAPI.renameFile(fileId, fileName),
    onSuccess: (_, { fileName }) => {
      queryClient.invalidateQueries({ queryKey: ['files', lessonId] });
      toast.success('Arquivo renomeado com sucesso', { description: `Novo nome: ${fileName}` });
    },
    onError: (error: Error) => {
      toast.error('Erro ao renomear arquivo', { description: error.message });
    }
  });

  const downloadFile = async (fileId: string) => {
    try {
      await studyAPI.downloadFile(fileId);
      const file = files?.find(f => f.id === fileId);
      if (file) {
        toast.download(file.name);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  return {
    files: files || [],
    isLoading,
    error,
    uploadFiles: uploadMutation.mutate,
    deleteFile: deleteMutation.mutate,
    markAsPrimary: markPrimaryMutation.mutate,
    markAsStudied: markStudiedMutation.mutate,
    renameFile: renameMutation.mutate,
    downloadFile,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMarkingPrimary: markPrimaryMutation.isPending,
    isMarkingStudied: markStudiedMutation.isPending,
    isRenaming: renameMutation.isPending,
    uploadProgress
  };
};