import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/config/api';

interface PollResult {
  optionIndex: number;
  optionText: string;
  voteCount: number;
  percentage: number;
}

interface PollResults {
  results: PollResult[];
  totalVotes: number;
  userVote: number | null;
}

interface UsePollVoteReturn {
  vote: (postId: string, optionIndex: number) => Promise<PollResults | null>;
  getResults: (postId: string) => Promise<PollResults | null>;
  loading: boolean;
  error: string | null;
}

export const usePollVote = (): UsePollVoteReturn => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vote = useCallback(async (postId: string, optionIndex: number): Promise<PollResults | null> => {
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

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ optionIndex }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token expirado. Faça login novamente.');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao votar na enquete');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao votar na enquete:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getResults = useCallback(async (postId: string): Promise<PollResults | null> => {
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

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/results`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token expirado. Faça login novamente.');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao obter resultados da enquete');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao obter resultados da enquete:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    vote,
    getResults,
    loading,
    error,
  };
};