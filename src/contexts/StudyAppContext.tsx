import React, { createContext, useContext, useReducer, ReactNode } from 'react';

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

const initialState: StudyAppState = {
  categories: [
    {
      id: 'cat-matematica',
      name: 'Matemática',
      lessons: [
        {
          id: 'a1',
          title: 'Introdução à Álgebra',
          difficulty: 'medio',
          status: 'em_andamento',
          accuracy: 72,
          resources: [
            { id: 'r1', type: 'pdf', name: 'Apostila Álgebra.pdf', size: '3.2 MB', studied: true, primary: true },
            { id: 'r2', type: 'audio', name: 'Áudio Aula 1.m4a', duration: '12:40' },
            { id: 'r3', type: 'html', name: 'Resumo interativo' }
          ],
          notes: 'Revisar propriedades distributivas.',
          flashcards: 40,
          flashcardsDue: 10,
          progress: 55,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'a2',
          title: 'Funções e Gráficos',
          difficulty: 'dificil',
          status: 'nao_iniciado',
          accuracy: 0,
          resources: [
            { id: 'r4', type: 'pdf', name: 'Funções.pdf', size: '1.1 MB' },
            { id: 'r5', type: 'site', name: 'Playlist YouTube' }
          ],
          notes: '',
          flashcards: 12,
          flashcardsDue: 12,
          progress: 5,
          updatedAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 'cat-portugues',
      name: 'Português',
      lessons: [
        {
          id: 'a3',
          title: 'Interpretação de Texto',
          difficulty: 'facil',
          status: 'estudado',
          accuracy: 88,
          resources: [
            { id: 'r6', type: 'pdf', name: 'Interpretação.pdf', size: '2.0 MB', studied: true, primary: true }
          ],
          flashcards: 8,
          flashcardsDue: 0,
          progress: 100,
          updatedAt: new Date().toISOString()
        }
      ]
    }
  ],
  selectedCategoryId: 'cat-matematica',
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
    selectedExam: null,
    selectedDiscipline: null
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
  | { type: 'ADD_LESSON'; payload: { categoryId: string; lesson: Lesson } };

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
    case 'ADD_LESSON':
      return {
        ...state,
        categories: state.categories.map(cat => 
          cat.id === action.payload.categoryId
            ? { ...cat, lessons: [...cat.lessons, action.payload.lesson] }
            : cat
        )
      };
    default:
      return state;
  }
}

const StudyAppContext = createContext<{
  state: StudyAppState;
  dispatch: React.Dispatch<StudyAppAction>;
} | null>(null);

export function StudyAppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(studyAppReducer, initialState);

  return (
    <StudyAppContext.Provider value={{ state, dispatch }}>
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

export const EXAMS = {
  ENEM: {
    'Matemática': 'cat-matematica',
    'Português': 'cat-portugues'
  }
};