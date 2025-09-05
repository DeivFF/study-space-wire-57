import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/config/api';

interface ExerciseResponseData {
  selectedOptionIndex?: number;
  writtenResponse?: string;
  isCorrect?: boolean;
  correctOptionIndex?: number;
  explanation?: string;
}

interface UseExerciseResponseReturn {
  submitResponse: (postId: string, response: ExerciseResponseData) => Promise<ExerciseResponseData | null>;
  getResponse: (postId: string) => Promise<ExerciseResponseData | null>;
  loading: boolean;
  error: string | null;
}

export const useExerciseResponse = (): UseExerciseResponseReturn => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitResponse = useCallback(async (postId: string, response: ExerciseResponseData): Promise<ExerciseResponseData | null> => {
    if (!user) {
      setError('Usuário não autenticado');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Token de acesso não encontrado');
      }

      const responsePayload = {
        selectedOptionIndex: response.selectedOptionIndex,
        writtenResponse: response.writtenResponse,
      };

      const apiResponse = await fetch(`${API_BASE_URL}/api/posts/${postId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responsePayload),
      });

      if (!apiResponse.ok) {
        if (apiResponse.status === 401) {
          throw new Error('Token expirado. Faça login novamente.');
        }
        const errorData = await apiResponse.json();
        throw new Error(errorData.message || 'Erro ao enviar resposta do exercício');
      }

      const result = await apiResponse.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao enviar resposta do exercício:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getResponse = useCallback(async (postId: string): Promise<ExerciseResponseData | null> => {
    if (!user) {
      setError('Usuário não autenticado');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Token de acesso não encontrado');
      }

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/response`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token expirado. Faça login novamente.');
        }
        if (response.status === 404) {
          // No response found, which is not an error
          return null;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao obter resposta do exercício');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao obter resposta do exercício:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    submitResponse,
    getResponse,
    loading,
    error,
  };
};