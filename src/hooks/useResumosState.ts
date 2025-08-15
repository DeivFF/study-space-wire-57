import { useState, useCallback } from 'react';
import { useStatePersistence } from '@/hooks/useStatePersistence';

interface ResumosState {
  selectedLesson: string | null;
  expandedCategories: Record<string, boolean>;
  showArchived: boolean;
}

const initialState: ResumosState = {
  selectedLesson: null,
  expandedCategories: {},
  showArchived: false
};

export const useResumosState = () => {
  const [state, setState] = useStatePersistence(initialState, {
    key: 'resumos-state',
    storage: 'session',
    debounceMs: 100
  });

  const setSelectedLesson = useCallback((lessonId: string | null) => {
    setState(prev => ({ ...prev, selectedLesson: lessonId }));
  }, [setState]);

  const setExpandedCategories = useCallback((categories: Record<string, boolean>) => {
    setState(prev => ({ ...prev, expandedCategories: categories }));
  }, [setState]);

  const toggleCategory = useCallback((categoryId: string) => {
    setState(prev => ({
      ...prev,
      expandedCategories: {
        ...prev.expandedCategories,
        [categoryId]: !prev.expandedCategories[categoryId]
      }
    }));
  }, [setState]);

  const setShowArchived = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showArchived: show }));
  }, [setState]);

  return {
    ...state,
    setSelectedLesson,
    setExpandedCategories,
    toggleCategory,
    setShowArchived
  };
};