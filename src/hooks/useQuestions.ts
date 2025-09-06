import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Interfaces for API responses
export interface Question {
  id: string;
  category: 'ENEM' | 'OAB' | 'CONCURSO';
  subcategory?: string;
  title: string;
  content: string;
  type: 'OBJETIVA' | 'DISCURSIVA' | 'PECA_PRATICA';
  year: number;
  difficulty?: 'FACIL' | 'MEDIO' | 'DIFICIL';
  subject_area?: string;
  legal_branch?: string;
  exam_phase?: 'PRIMEIRA' | 'SEGUNDA';
  institution?: string;
  position?: string;
  education_level?: 'MEDIO' | 'SUPERIOR';
  metadata?: Record<string, any>;
  created_at: string;
  is_favorite: boolean;
  user_answered_correctly?: boolean;
  error_rate_percentage?: number;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  option_letter: string;
  content: string;
  is_correct: boolean;
  explanation?: string;
}

export interface QuestionFilters {
  category: 'ENEM' | 'OAB' | 'CONCURSO';
  subcategory?: string;
  year?: number[];
  difficulty?: ('FACIL' | 'MEDIO' | 'DIFICIL')[];
  subject_area?: string[];
  legal_branch?: string[];
  exam_phase?: 'PRIMEIRA' | 'SEGUNDA';
  type?: ('OBJETIVA' | 'DISCURSIVA' | 'PECA_PRATICA')[];
  institution?: string[];
  position?: string[];
  education_level?: 'MEDIO' | 'SUPERIOR';
  favorites_only?: boolean;
  never_answered?: boolean;
  user_correct?: boolean;
  user_incorrect?: boolean;
  min_error_rate?: number;
  page?: number;
  limit?: number;
}

export interface QuestionsResponse {
  success: boolean;
  data: Question[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: QuestionFilters;
}

export interface FilterOptions {
  years: number[];
  difficulties: string[];
  subject_areas: string[];
  types: string[];
  legal_branches?: string[];
  exam_phases?: string[];
  subcategories?: string[];
  institutions?: string[];
  positions?: string[];
  education_levels?: string[];
}

export interface QuestionStats {
  total_questions: number;
  total_responses: number;
  average_error_rate: number;
  by_category: Record<string, number>;
  by_difficulty: Record<string, number>;
}

export const useQuestions = () => {
  const { authenticatedFetch } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false
  });

  const [filterOptions, setFilterOptions] = useState<Record<string, FilterOptions>>({});
  const [stats, setStats] = useState<QuestionStats | null>(null);

  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const response = await authenticatedFetch(`http://localhost:3002/api${endpoint}`, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, [authenticatedFetch]);

  const fetchQuestions = useCallback(async (filters: QuestionFilters) => {
    setLoading(true);
    setError(null);

    try {
      // Build query string
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              params.append(key, value.join(','));
            }
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response: QuestionsResponse = await apiCall(`/questions?${params}`);
      
      setQuestions(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const fetchQuestion = useCallback(async (questionId: string): Promise<Question | null> => {
    try {
      const response = await apiCall(`/questions/${questionId}`);
      return response.success ? response.data : null;
    } catch (err) {
      console.error('Error fetching question:', err);
      return null;
    }
  }, [apiCall]);

  const fetchFilterOptions = useCallback(async (category: 'ENEM' | 'OAB' | 'CONCURSO') => {
    try {
      const response = await apiCall(`/questions/filter-options/${category}`);
      if (response.success) {
        setFilterOptions(prev => ({
          ...prev,
          [category]: response.data
        }));
        return response.data;
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
    return null;
  }, [apiCall]);

  const fetchStats = useCallback(async (category?: 'ENEM' | 'OAB' | 'CONCURSO') => {
    try {
      const params = category ? `?category=${category}` : '';
      const response = await apiCall(`/questions/stats${params}`);
      if (response.success) {
        setStats(response.data);
        return response.data;
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
    return null;
  }, [apiCall]);

  const submitAnswer = useCallback(async (
    questionId: string, 
    isCorrect: boolean, 
    timeSpentSeconds?: number
  ) => {
    try {
      const response = await apiCall(`/questions/${questionId}/answer`, {
        method: 'POST',
        body: JSON.stringify({
          is_correct: isCorrect,
          time_spent_seconds: timeSpentSeconds
        })
      });
      
      return response.success;
    } catch (err) {
      console.error('Error submitting answer:', err);
      return false;
    }
  }, [apiCall]);

  const toggleFavorite = useCallback(async (questionId: string) => {
    try {
      const response = await apiCall(`/questions/${questionId}/favorite`, {
        method: 'POST'
      });
      
      if (response.success) {
        // Update the question in current list if it exists
        setQuestions(prev => prev.map(q => 
          q.id === questionId 
            ? { ...q, is_favorite: response.data.isFavorite }
            : q
        ));
        return response.data.isFavorite;
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
    return null;
  }, [apiCall]);

  const fetchUserHistory = useCallback(async (page = 1, limit = 20) => {
    try {
      const response = await apiCall(`/users/question-history?page=${page}&limit=${limit}`);
      return response.success ? response : null;
    } catch (err) {
      console.error('Error fetching user history:', err);
      return null;
    }
  }, [apiCall]);

  return {
    questions,
    loading,
    error,
    pagination,
    filterOptions,
    stats,
    fetchQuestions,
    fetchQuestion,
    fetchFilterOptions,
    fetchStats,
    submitAnswer,
    toggleFavorite,
    fetchUserHistory,
  };
};

// Helper hook for converting legacy filter format to new API format
export const useFilterConverter = () => {
  const convertFilters = useCallback((legacyFilters: any): QuestionFilters => {
    const filters: QuestionFilters = {
      category: 'ENEM' // default
    };

    // Map legacy filter structure to new API format
    if (legacyFilters.fundamentais?.exame) {
      const exameMap: Record<string, 'ENEM' | 'OAB' | 'CONCURSO'> = {
        'ENEM': 'ENEM',
        'OAB': 'OAB',
        'Concursos': 'CONCURSO'
      };
      filters.category = exameMap[legacyFilters.fundamentais.exame] || 'ENEM';
    }

    if (legacyFilters.fundamentais?.ano) {
      filters.year = [legacyFilters.fundamentais.ano];
    }

    if (legacyFilters.fundamentais?.disciplina) {
      filters.subject_area = [legacyFilters.fundamentais.disciplina];
    }

    if (legacyFilters.fundamentais?.dificuldade?.length > 0) {
      const difficultyMap: Record<string, 'FACIL' | 'MEDIO' | 'DIFICIL'> = {
        'Fácil': 'FACIL',
        'Médio': 'MEDIO',
        'Difícil': 'DIFICIL'
      };
      filters.difficulty = legacyFilters.fundamentais.dificuldade.map(
        (d: string) => difficultyMap[d]
      ).filter(Boolean);
    }

    if (legacyFilters.fundamentais?.tipo?.length > 0) {
      const typeMap: Record<string, 'OBJETIVA' | 'DISCURSIVA' | 'PECA_PRATICA'> = {
        'Objetiva': 'OBJETIVA',
        'Discursiva': 'DISCURSIVA',
        'Peça prática': 'PECA_PRATICA'
      };
      filters.type = legacyFilters.fundamentais.tipo.map(
        (t: string) => typeMap[t]
      ).filter(Boolean);
    }

    // Handle specific filters by category
    if (filters.category === 'ENEM' && legacyFilters.especificos?.enem?.area) {
      filters.subject_area = [legacyFilters.especificos.enem.area];
    }

    if (filters.category === 'OAB') {
      if (legacyFilters.especificos?.oab?.ramo) {
        filters.legal_branch = [legacyFilters.especificos.oab.ramo];
      }
      if (legacyFilters.especificos?.oab?.fase?.length > 0) {
        const phaseMap: Record<string, 'PRIMEIRA' | 'SEGUNDA'> = {
          '1ª fase': 'PRIMEIRA',
          '2ª fase': 'SEGUNDA'
        };
        const mappedPhase = phaseMap[legacyFilters.especificos.oab.fase[0]];
        if (mappedPhase) {
          filters.exam_phase = mappedPhase;
        }
      }
    }

    if (filters.category === 'CONCURSO') {
      if (legacyFilters.especificos?.concursos?.banca) {
        filters.institution = [legacyFilters.especificos.concursos.banca];
      }
      if (legacyFilters.especificos?.concursos?.cargo) {
        filters.position = [legacyFilters.especificos.concursos.cargo];
      }
      if (legacyFilters.especificos?.concursos?.escolaridade?.length > 0) {
        const educationMap: Record<string, 'MEDIO' | 'SUPERIOR'> = {
          'Médio': 'MEDIO',
          'Superior': 'SUPERIOR'
        };
        const mappedLevel = educationMap[legacyFilters.especificos.concursos.escolaridade[0]];
        if (mappedLevel) {
          filters.education_level = mappedLevel;
        }
      }
    }

    // Advanced filters
    if (legacyFilters.avancados?.favoritas) {
      filters.favorites_only = true;
    }

    if (legacyFilters.personalizado?.nuncaRespondidas) {
      filters.never_answered = true;
    }

    if (legacyFilters.avancados?.erroMinPct > 0) {
      filters.min_error_rate = legacyFilters.avancados.erroMinPct;
    }

    return filters;
  }, []);

  return { convertFilters };
};