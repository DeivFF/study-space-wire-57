import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { studyAPI, Lesson as BackendLesson } from '@/services/studyApi';

export interface Resource {
  id: string;
  type: 'pdf' | 'audio' | 'html' | 'site';
  name: string;
  size?: string;
  duration?: string;
  studied?: boolean;
  primary?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  difficulty: 'facil' | 'medio' | 'dificil';
  status: 'nao_iniciado' | 'em_andamento' | 'estudado';
  accuracy: number;
  resources: Resource[];
  notes?: string;
  flashcards: number;
  flashcardsDue: number;
  progress: number;
  updatedAt: string;
  watched?: boolean;
  durationMinutes?: number;
}

export interface Category {
  id: string;
  name: string;
  lessons: Lesson[];
}

export interface StudyAppState {
  categories: Category[];
  selectedCategoryId: string;
  selectedLessonId: string | null;
  query: string;
  view: 'cards' | 'list';
  difficulty: string;
  status: string;
  typeFilter: string;
  appMode: 'browse' | 'detail' | 'share' | 'import';
  drawerTab: string;
  ui: {
    ENEM_open: boolean;
    selectedExam: string | null;
    selectedDiscipline: string | null;
  };
}

// Get persisted state from localStorage
const getPersistedState = (): Partial<StudyAppState> => {
  try {
    const persistedState = localStorage.getItem('studyApp-selectedState');
    return persistedState ? JSON.parse(persistedState) : {};
  } catch {
    return {};
  }
};

const persistedState = getPersistedState();

// Save selected state to localStorage
const saveSelectedState = (state: StudyAppState) => {
  try {
    const stateToSave = {
      selectedCategoryId: state.selectedCategoryId,
      ui: {
        selectedExam: state.ui.selectedExam,
        selectedDiscipline: state.ui.selectedDiscipline
      }
    };
    localStorage.setItem('studyApp-selectedState', JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Error saving state to localStorage:', error);
  }
};

const initialState: StudyAppState = {
  categories: [],
  selectedCategoryId: persistedState.selectedCategoryId || '',
  selectedLessonId: null,
  query: '',
  view: 'cards',
  difficulty: 'all',
  status: 'all',
  typeFilter: 'all',
  appMode: 'browse',
  drawerTab: 'overview',
  ui: {
    ENEM_open: false,
    selectedExam: persistedState.ui?.selectedExam || null,
    selectedDiscipline: persistedState.ui?.selectedDiscipline || null
  }
};

type StudyAppAction =
  | { type: 'SET_SELECTED_CATEGORY'; payload: string }
  | { type: 'SET_SELECTED_LESSON'; payload: string | null }
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_VIEW'; payload: 'cards' | 'list' }
  | { type: 'SET_DIFFICULTY'; payload: string }
  | { type: 'SET_STATUS'; payload: string }
  | { type: 'SET_TYPE_FILTER'; payload: string }
  | { type: 'SET_APP_MODE'; payload: 'browse' | 'detail' | 'share' | 'import' }
  | { type: 'SET_DRAWER_TAB'; payload: string }
  | { type: 'TOGGLE_ENEM'; payload: boolean }
  | { type: 'SET_SELECTED_EXAM'; payload: string | null }
  | { type: 'SET_SELECTED_DISCIPLINE'; payload: string | null }
  | { type: 'DELETE_LESSON'; payload: string }
  | { type: 'ADD_LESSON'; payload: { categoryId: string; lesson: Lesson } }
  | { type: 'ENSURE_CATEGORY'; payload: { categoryId: string; categoryName: string } }
  | { type: 'LOAD_LESSONS'; payload: { categoryId: string; lessons: BackendLesson[] } }
  | { type: 'SET_CATEGORY_WITH_PERSISTENCE'; payload: { categoryId: string; examName: string; disciplineName: string } }
  | { type: 'TOGGLE_LESSON_WATCHED'; payload: string };

function studyAppReducer(state: StudyAppState, action: StudyAppAction): StudyAppState {
  switch (action.type) {
    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategoryId: action.payload, selectedLessonId: null, appMode: 'browse' };
    case 'SET_SELECTED_LESSON':
      return { ...state, selectedLessonId: action.payload };
    case 'SET_QUERY':
      return { ...state, query: action.payload };
    case 'SET_VIEW':
      return { ...state, view: action.payload };
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.payload };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_TYPE_FILTER':
      return { ...state, typeFilter: action.payload };
    case 'SET_APP_MODE':
      return { ...state, appMode: action.payload };
    case 'SET_DRAWER_TAB':
      return { ...state, drawerTab: action.payload };
    case 'TOGGLE_ENEM':
      return { ...state, ui: { ...state.ui, ENEM_open: action.payload } };
    case 'SET_SELECTED_EXAM':
      return { ...state, ui: { ...state.ui, selectedExam: action.payload } };
    case 'SET_SELECTED_DISCIPLINE':
      return { ...state, ui: { ...state.ui, selectedDiscipline: action.payload } };
    case 'DELETE_LESSON':
      return {
        ...state,
        categories: state.categories.map(cat => ({
          ...cat,
          lessons: cat.lessons.filter(l => l.id !== action.payload)
        }))
      };
    case 'ENSURE_CATEGORY':
      const categoryExists = state.categories.some(cat => cat.id === action.payload.categoryId);
      if (categoryExists) {
        return state;
      }
      return {
        ...state,
        categories: [...state.categories, {
          id: action.payload.categoryId,
          name: action.payload.categoryName,
          lessons: []
        }]
      };
    case 'ADD_LESSON':
      console.log('ADD_LESSON action received:', action.payload);
      console.log('Current categories:', state.categories);
      
      // Ensure category exists first
      let updatedCategories = state.categories;
      const lessonCategoryExists = updatedCategories.some(cat => cat.id === action.payload.categoryId);
      if (!lessonCategoryExists) {
        updatedCategories = [...updatedCategories, {
          id: action.payload.categoryId,
          name: 'Nova Categoria', // We'll update this when we have the name
          lessons: []
        }];
      }
      
      const newState = {
        ...state,
        categories: updatedCategories.map(cat => 
          cat.id === action.payload.categoryId
            ? { ...cat, lessons: [...cat.lessons, action.payload.lesson] }
            : cat
        )
      };
      console.log('New state after ADD_LESSON:', newState);
      return newState;
    case 'LOAD_LESSONS':
      // Convert backend lessons to frontend format
      console.log('LOAD_LESSONS action - Raw backend lessons:', action.payload.lessons);
      const backendLessons = action.payload.lessons.map(backendLesson => ({
        id: backendLesson.id.toString(),
        title: backendLesson.title,
        difficulty: (backendLesson.difficulty || 'medio') as 'facil' | 'medio' | 'dificil',
        status: 'nao_iniciado' as 'nao_iniciado' | 'em_andamento' | 'estudado',
        accuracy: 0,
        resources: [],
        notes: backendLesson.description || '',
        flashcards: 0,
        flashcardsDue: 0,
        progress: 0,
        updatedAt: backendLesson.updated_at || new Date().toISOString(),
        watched: false,
        durationMinutes: backendLesson.duration_minutes || undefined
      }));
      console.log('LOAD_LESSONS action - Converted frontend lessons:', backendLessons);

      const updatedState = {
        ...state,
        categories: state.categories.map(cat => 
          cat.id === action.payload.categoryId
            ? { ...cat, lessons: backendLessons }
            : cat
        )
      };
      console.log('LOAD_LESSONS action - New state:', updatedState);
      return updatedState;
    case 'SET_CATEGORY_WITH_PERSISTENCE':
      const newStateWithPersistence = {
        ...state,
        selectedCategoryId: action.payload.categoryId,
        selectedLessonId: null,
        appMode: 'browse' as const,
        ui: {
          ...state.ui,
          selectedExam: action.payload.examName,
          selectedDiscipline: action.payload.disciplineName
        }
      };
      saveSelectedState(newStateWithPersistence);
      return newStateWithPersistence;
    case 'TOGGLE_LESSON_WATCHED':
      return {
        ...state,
        categories: state.categories.map(cat => ({
          ...cat,
          lessons: cat.lessons.map(lesson => 
            lesson.id === action.payload 
              ? { ...lesson, watched: !lesson.watched }
              : lesson
          )
        }))
      };
    default:
      return state;
  }
}

const StudyAppContext = createContext<{
  state: StudyAppState;
  dispatch: React.Dispatch<StudyAppAction>;
  loadLessons: (categoryId: string) => Promise<void>;
} | null>(null);

export function StudyAppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(studyAppReducer, initialState);

  const loadLessons = async (categoryId: string) => {
    try {
      console.log('StudyAppContext - Loading lessons for category:', categoryId);
      const lessons = await studyAPI.getSubjectLessons(categoryId);
      console.log('StudyAppContext - Loaded lessons from API:', lessons);
      console.log('StudyAppContext - Number of lessons loaded:', lessons.length);
      dispatch({
        type: 'LOAD_LESSONS',
        payload: { categoryId, lessons }
      });
      console.log('StudyAppContext - LOAD_LESSONS action dispatched');
    } catch (error) {
      console.error('StudyAppContext - Error loading lessons:', error);
    }
  };

  // Load lessons automatically if there's a persisted selected category
  useEffect(() => {
    const loadPersistedCategory = async () => {
      if (state.selectedCategoryId && state.ui.selectedExam && state.ui.selectedDiscipline) {
        console.log('StudyAppProvider - Found persisted category, loading lessons:', state.selectedCategoryId);
        
        // Ensure category exists in state
        dispatch({
          type: 'ENSURE_CATEGORY',
          payload: {
            categoryId: state.selectedCategoryId,
            categoryName: `${state.ui.selectedExam} - ${state.ui.selectedDiscipline}`
          }
        });

        // Load lessons from database
        await loadLessons(state.selectedCategoryId);
      }
    };

    loadPersistedCategory();
  }, []); // Only run on mount

  return (
    <StudyAppContext.Provider value={{ state, dispatch, loadLessons }}>
      {children}
    </StudyAppContext.Provider>
  );
}

export function useStudyApp() {
  const context = useContext(StudyAppContext);
  if (!context) {
    throw new Error('useStudyApp must be used within a StudyAppProvider');
  }
  return context;
}

export const EXAMS = {};