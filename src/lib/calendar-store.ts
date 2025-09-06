// Simple React state management for the study calendar
import { useState, useEffect, useReducer } from 'react';

export interface Subject {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  subjectId: string;
  title: string;
  estMin: number;
  priority: number;
  tags: string[];
}

export interface Session {
  id: string;
  subjectId: string;
  title: string;
  date: string;
  start: string;
  durationMin: number;
  pomos: number;
  tags: string[];
  status: 'open' | 'done';
  notes?: string;
  actualMin?: number;
}

export interface AvailabilitySlot {
  start: string;
  end: string;
}

export interface Availability {
  dow: number;
  slots: AvailabilitySlot[];
}

export interface StudyData {
  subjects: Subject[];
  tasks: Task[];
  sessions: Session[];
  availability: Availability[];
  cursor: string; // ISO date string
}

const defaultAvailability = (): Availability[] => {
  const days = [0, 1, 2, 3, 4, 5, 6];
  return days.map(d => ({
    dow: d,
    slots: (d >= 1 && d <= 5) 
      ? [{ start: '08:00', end: '10:00' }, { start: '19:00', end: '21:00' }]
      : [{ start: '09:00', end: '11:00' }]
  }));
};

const initialData: StudyData = {
  subjects: [],
  tasks: [],
  sessions: [],
  availability: defaultAvailability(),
  cursor: new Date().toISOString().split('T')[0]
};

// Load initial data from localStorage
const loadInitialData = (): StudyData => {
  try {
    const stored = localStorage.getItem('study-calendar-storage');
    if (stored) {
      return { ...initialData, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading stored data:', error);
  }
  return initialData;
};

// Save data to localStorage
const saveData = (data: StudyData) => {
  try {
    localStorage.setItem('study-calendar-storage', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

type Action =
  | { type: 'ADD_SUBJECT'; payload: { name: string; color: string } }
  | { type: 'DELETE_SUBJECT'; payload: { id: string } }
  | { type: 'ADD_TASK'; payload: { subjectId: string; title: string; estMin: number; priority: number; tags: string[] } }
  | { type: 'DELETE_TASK'; payload: { id: string } }
  | { type: 'UPSERT_SESSION'; payload: { session: Session } }
  | { type: 'DELETE_SESSION'; payload: { id: string } }
  | { type: 'UPDATE_AVAILABILITY'; payload: { availability: Availability[] } }
  | { type: 'SET_CURSOR'; payload: { date: Date } };

const studyReducer = (state: StudyData, action: Action): StudyData => {
  switch (action.type) {
    case 'ADD_SUBJECT': {
      const id = crypto.randomUUID();
      return {
        ...state,
        subjects: [...state.subjects, { id, ...action.payload }]
      };
    }
    case 'DELETE_SUBJECT': {
      return {
        ...state,
        subjects: state.subjects.filter(s => s.id !== action.payload.id),
        tasks: state.tasks.filter(t => t.subjectId !== action.payload.id),
        sessions: state.sessions.filter(s => s.subjectId !== action.payload.id)
      };
    }
    case 'ADD_TASK': {
      const id = crypto.randomUUID();
      return {
        ...state,
        tasks: [...state.tasks, { id, ...action.payload }]
      };
    }
    case 'DELETE_TASK': {
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload.id)
      };
    }
    case 'UPSERT_SESSION': {
      const index = state.sessions.findIndex(s => s.id === action.payload.session.id);
      if (index >= 0) {
        const sessions = [...state.sessions];
        sessions[index] = action.payload.session;
        return { ...state, sessions };
      } else {
        return {
          ...state,
          sessions: [...state.sessions, action.payload.session]
        };
      }
    }
    case 'DELETE_SESSION': {
      return {
        ...state,
        sessions: state.sessions.filter(s => s.id !== action.payload.id)
      };
    }
    case 'UPDATE_AVAILABILITY': {
      return {
        ...state,
        availability: action.payload.availability
      };
    }
    case 'SET_CURSOR': {
      return {
        ...state,
        cursor: action.payload.date.toISOString().split('T')[0]
      };
    }
    default:
      return state;
  }
};

export const useStudyStore = () => {
  const [state, dispatch] = useReducer(studyReducer, loadInitialData());

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveData(state);
  }, [state]);

  const addSubject = (name: string, color: string) => {
    dispatch({ type: 'ADD_SUBJECT', payload: { name, color } });
  };

  const deleteSubject = (id: string) => {
    dispatch({ type: 'DELETE_SUBJECT', payload: { id } });
  };

  const addTask = (subjectId: string, title: string, estMin: number, priority: number, tags: string[]) => {
    dispatch({ type: 'ADD_TASK', payload: { subjectId, title, estMin, priority, tags } });
  };

  const deleteTask = (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: { id } });
  };

  const upsertSession = (session: Session) => {
    dispatch({ type: 'UPSERT_SESSION', payload: { session } });
  };

  const deleteSession = (id: string) => {
    dispatch({ type: 'DELETE_SESSION', payload: { id } });
  };

  const updateAvailability = (availability: Availability[]) => {
    dispatch({ type: 'UPDATE_AVAILABILITY', payload: { availability } });
  };

  const setCursor = (date: Date) => {
    dispatch({ type: 'SET_CURSOR', payload: { date } });
  };

  return {
    subjects: state.subjects,
    tasks: state.tasks,
    sessions: state.sessions,
    availability: state.availability,
    cursor: new Date(state.cursor + 'T12:00:00'),
    addSubject,
    deleteSubject,
    addTask,
    deleteTask,
    upsertSession,
    deleteSession,
    updateAvailability,
    setCursor
  };
};

// Initialize with sample data if empty
export const initializeSampleData = () => {
  const currentData = loadInitialData();
  if (currentData.subjects.length === 0) {
    const sampleData: StudyData = {
      ...currentData,
      subjects: [
        { id: crypto.randomUUID(), name: 'AFO', color: '#2962ff' },
        { id: crypto.randomUUID(), name: 'Direito Constitucional', color: '#1e8e3e' },
        { id: crypto.randomUUID(), name: 'Português', color: '#ba8b00' }
      ]
    };
    
    sampleData.tasks = [
      { id: crypto.randomUUID(), subjectId: sampleData.subjects[0].id, title: 'Princípios Orçamentários', estMin: 60, priority: 2, tags: ['#revisão'] },
      { id: crypto.randomUUID(), subjectId: sampleData.subjects[1].id, title: 'Controle de constitucionalidade', estMin: 50, priority: 3, tags: ['#lei', '#juris'] },
      { id: crypto.randomUUID(), subjectId: sampleData.subjects[2].id, title: 'Crase e regência', estMin: 40, priority: 3, tags: ['#gramática'] }
    ];
    
    saveData(sampleData);
  }
};