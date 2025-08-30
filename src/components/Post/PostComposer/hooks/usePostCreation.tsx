import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { PostFormData } from '../schemas';

interface PostCreationState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

interface UsePostCreationReturn extends PostCreationState {
  createPost: (data: PostFormData) => Promise<boolean>;
  reset: () => void;
  isCreating: boolean;
}

export const usePostCreation = (): UsePostCreationReturn => {
  const { user } = useAuth();
  const [state, setState] = useState<PostCreationState>({
    isLoading: false,
    error: null,
    success: false,
  });

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      success: false,
    });
  }, []);

  const createPost = useCallback(async (data: PostFormData): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar um post",
        variant: "destructive",
      });
      return false;
    }

    setState({
      isLoading: true,
      error: null,
      success: false,
    });

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Token de acesso não encontrado');
      }

      // Preparar dados para envio
      const postData = {
        ...(data.title && { title: data.title }), // Só inclui title se não for null/undefined
        content: data.content,
        type: data.type,
        data: data.data || {},
        tags: data.tags || [],
        isAnonymous: data.isAnonymous || false,
        ...(data.category && { category: data.category }), // Só inclui category se não for null/undefined
      };

      // Fazer request para API
      const response = await fetch(`http://localhost:3002/api/posts/${data.type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(postData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao criar post');
      }

      setState({
        isLoading: false,
        error: null,
        success: true,
      });

      // Mostrar toast de sucesso
      const postTypeLabels = {
        publicacao: 'Publicação',
        duvida: 'Dúvida',
        exercicio: 'Exercício',
        desafio: 'Desafio',
        enquete: 'Enquete',
      };

      toast({
        title: "Sucesso!",
        description: `${postTypeLabels[data.type]} criada com sucesso!`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao criar post:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro interno do servidor';

      setState({
        isLoading: false,
        error: errorMessage,
        success: false,
      });

      toast({
        title: "Erro ao criar post",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    }
  }, [user]);

  return {
    ...state,
    createPost,
    reset,
    isCreating: state.isLoading,
  };
};