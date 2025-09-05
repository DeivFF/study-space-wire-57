# Integration Agent - Integração e Estado Global

## Responsabilidades

Este agente é especializado em:
- Integração entre frontend e backend
- Gerenciamento de estado global
- Configuração do React Query
- Error handling e retry logic
- Performance e cache management

## Contexto do Projeto

### Tecnologias Atuais
- **Frontend:** React 18 + TypeScript + Vite
- **Estado:** React Query + Context API + localStorage
- **Backend:** Node.js + Express + PostgreSQL
- **Comunicação:** REST APIs com JWT

### Integrações Existentes
- AuthContext para autenticação
- APIs de auth e profile
- localStorage para persistência

## Tarefas Específicas

### 1. Configuração do React Query

#### Query Client Setup
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos
      staleTime: 1000 * 60 * 5,
      // Retry 3 vezes antes de falhar
      retry: 3,
      // Retry com delay exponencial
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch quando a janela ganha foco
      refetchOnWindowFocus: true,
      // Não refetch automaticamente
      refetchOnMount: true,
      // Network mode
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

// Configuração de cache para diferentes tipos de dados
export const queryKeys = {
  studyTypes: ['studyTypes'] as const,
  studyType: (id: number) => ['studyType', id] as const,
  subjects: (studyTypeId: number) => ['subjects', studyTypeId] as const,
  subject: (id: number) => ['subject', id] as const,
  lessons: (subjectId: number) => ['lessons', subjectId] as const,
  lesson: (id: number) => ['lesson', id] as const,
  studyStructure: (studyTypeId: number) => ['studyStructure', studyTypeId] as const,
  profile: ['profile'] as const,
} as const;
```

### 2. Error Handling Global

#### Error Context
```typescript
// src/contexts/ErrorContext.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';
import { toast } from '@/components/ui/use-toast';

interface ErrorState {
  errors: Array<{
    id: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    timestamp: Date;
  }>;
  isOnline: boolean;
}

type ErrorAction = 
  | { type: 'ADD_ERROR'; payload: { message: string; type?: 'error' | 'warning' | 'info' } }
  | { type: 'REMOVE_ERROR'; payload: { id: string } }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean };

const initialState: ErrorState = {
  errors: [],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
};

const errorReducer = (state: ErrorState, action: ErrorAction): ErrorState => {
  switch (action.type) {
    case 'ADD_ERROR':
      const newError = {
        id: Math.random().toString(36).substr(2, 9),
        message: action.payload.message,
        type: action.payload.type || 'error' as const,
        timestamp: new Date(),
      };
      return {
        ...state,
        errors: [...state.errors, newError].slice(-5), // Manter apenas os últimos 5
      };
    case 'REMOVE_ERROR':
      return {
        ...state,
        errors: state.errors.filter(error => error.id !== action.payload.id),
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
      };
    case 'SET_ONLINE_STATUS':
      return {
        ...state,
        isOnline: action.payload,
      };
    default:
      return state;
  }
};

const ErrorContext = createContext<{
  state: ErrorState;
  addError: (message: string, type?: 'error' | 'warning' | 'info') => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
} | null>(null);

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  const addError = (message: string, type: 'error' | 'warning' | 'info' = 'error') => {
    dispatch({ type: 'ADD_ERROR', payload: { message, type } });
    
    // Mostrar toast para erros
    toast({
      title: type === 'error' ? 'Erro' : type === 'warning' ? 'Aviso' : 'Info',
      description: message,
      variant: type === 'error' ? 'destructive' : 'default',
    });
  };

  const removeError = (id: string) => {
    dispatch({ type: 'REMOVE_ERROR', payload: { id } });
  };

  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  // Monitor conexão
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ErrorContext.Provider value={{ state, addError, removeError, clearErrors }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError deve ser usado dentro de ErrorProvider');
  }
  return context;
};
```

### 3. Study Context (Estado Global)

#### Study Context
```typescript
// src/contexts/StudyContext.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';
import { StudyType, Subject, Lesson } from '@/types/study';

interface StudyState {
  currentStudyType: StudyType | null;
  currentSubject: Subject | null;
  currentLesson: Lesson | null;
  breadcrumb: Array<{
    label: string;
    href: string;
    type: 'study' | 'subject' | 'lesson';
  }>;
  studyHistory: Array<{
    studyTypeId: number;
    subjectId?: number;
    lessonId?: number;
    timestamp: Date;
  }>;
}

type StudyAction = 
  | { type: 'SET_CURRENT_STUDY_TYPE'; payload: StudyType | null }
  | { type: 'SET_CURRENT_SUBJECT'; payload: Subject | null }
  | { type: 'SET_CURRENT_LESSON'; payload: Lesson | null }
  | { type: 'UPDATE_BREADCRUMB'; payload: StudyState['breadcrumb'] }
  | { type: 'ADD_TO_HISTORY'; payload: { studyTypeId: number; subjectId?: number; lessonId?: number } }
  | { type: 'CLEAR_CONTEXT' };

const initialState: StudyState = {
  currentStudyType: null,
  currentSubject: null,
  currentLesson: null,
  breadcrumb: [],
  studyHistory: JSON.parse(localStorage.getItem('studyHistory') || '[]').slice(-10),
};

const studyReducer = (state: StudyState, action: StudyAction): StudyState => {
  switch (action.type) {
    case 'SET_CURRENT_STUDY_TYPE':
      return {
        ...state,
        currentStudyType: action.payload,
        currentSubject: null,
        currentLesson: null,
      };
    case 'SET_CURRENT_SUBJECT':
      return {
        ...state,
        currentSubject: action.payload,
        currentLesson: null,
      };
    case 'SET_CURRENT_LESSON':
      return {
        ...state,
        currentLesson: action.payload,
      };
    case 'UPDATE_BREADCRUMB':
      return {
        ...state,
        breadcrumb: action.payload,
      };
    case 'ADD_TO_HISTORY':
      const newHistory = [
        ...state.studyHistory.filter(
          item => !(item.studyTypeId === action.payload.studyTypeId &&
                   item.subjectId === action.payload.subjectId &&
                   item.lessonId === action.payload.lessonId)
        ),
        {
          ...action.payload,
          timestamp: new Date(),
        }
      ].slice(-10);
      
      localStorage.setItem('studyHistory', JSON.stringify(newHistory));
      
      return {
        ...state,
        studyHistory: newHistory,
      };
    case 'CLEAR_CONTEXT':
      return initialState;
    default:
      return state;
  }
};

const StudyContext = createContext<{
  state: StudyState;
  setCurrentStudyType: (studyType: StudyType | null) => void;
  setCurrentSubject: (subject: Subject | null) => void;
  setCurrentLesson: (lesson: Lesson | null) => void;
  updateBreadcrumb: (breadcrumb: StudyState['breadcrumb']) => void;
  addToHistory: (params: { studyTypeId: number; subjectId?: number; lessonId?: number }) => void;
  clearContext: () => void;
} | null>(null);

export const StudyProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(studyReducer, initialState);

  const setCurrentStudyType = (studyType: StudyType | null) => {
    dispatch({ type: 'SET_CURRENT_STUDY_TYPE', payload: studyType });
    if (studyType) {
      dispatch({ type: 'ADD_TO_HISTORY', payload: { studyTypeId: studyType.id } });
    }
  };

  const setCurrentSubject = (subject: Subject | null) => {
    dispatch({ type: 'SET_CURRENT_SUBJECT', payload: subject });
    if (subject && state.currentStudyType) {
      dispatch({ 
        type: 'ADD_TO_HISTORY', 
        payload: { studyTypeId: state.currentStudyType.id, subjectId: subject.id }
      });
    }
  };

  const setCurrentLesson = (lesson: Lesson | null) => {
    dispatch({ type: 'SET_CURRENT_LESSON', payload: lesson });
    if (lesson && state.currentSubject && state.currentStudyType) {
      dispatch({ 
        type: 'ADD_TO_HISTORY', 
        payload: { 
          studyTypeId: state.currentStudyType.id,
          subjectId: state.currentSubject.id,
          lessonId: lesson.id
        }
      });
    }
  };

  const updateBreadcrumb = (breadcrumb: StudyState['breadcrumb']) => {
    dispatch({ type: 'UPDATE_BREADCRUMB', payload: breadcrumb });
  };

  const addToHistory = (params: { studyTypeId: number; subjectId?: number; lessonId?: number }) => {
    dispatch({ type: 'ADD_TO_HISTORY', payload: params });
  };

  const clearContext = () => {
    dispatch({ type: 'CLEAR_CONTEXT' });
  };

  return (
    <StudyContext.Provider value={{
      state,
      setCurrentStudyType,
      setCurrentSubject,
      setCurrentLesson,
      updateBreadcrumb,
      addToHistory,
      clearContext,
    }}>
      {children}
    </StudyContext.Provider>
  );
};

export const useStudyContext = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudyContext deve ser usado dentro de StudyProvider');
  }
  return context;
};
```

### 4. API Integration with Interceptors

#### HTTP Client
```typescript
// src/lib/httpClient.ts
import { useError } from '@/contexts/ErrorContext';
import { useAuth } from '@/contexts/AuthContext';

interface RequestConfig extends RequestInit {
  timeout?: number;
  retry?: number;
  retryDelay?: number;
}

class HTTPClient {
  private baseURL: string;
  private defaultTimeout: number;

  constructor(baseURL: string, defaultTimeout = 30000) {
    this.baseURL = baseURL;
    this.defaultTimeout = defaultTimeout;
  }

  private async request<T>(
    endpoint: string, 
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retry = 3,
      retryDelay = 1000,
      ...fetchConfig
    } = config;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const token = localStorage.getItem('token');
    
    const finalConfig: RequestInit = {
      ...fetchConfig,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...fetchConfig.headers,
      },
      signal: controller.signal,
    };

    const attemptRequest = async (attempt: number): Promise<Response> => {
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, finalConfig);
        
        // Se não autorizado, limpar token e redirecionar
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          throw new Error('Não autorizado');
        }

        // Se erro de servidor, tentar novamente
        if (response.status >= 500 && attempt < retry) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          return attemptRequest(attempt + 1);
        }

        return response;
      } catch (error) {
        if (attempt < retry && error instanceof TypeError) {
          // Network error, tentar novamente
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          return attemptRequest(attempt + 1);
        }
        throw error;
      }
    };

    try {
      const response = await attemptRequest(1);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Se response vazio (204), retornar null
      if (response.status === 204) {
        return null as T;
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

export const httpClient = new HTTPClient('http://localhost:3002/api');
```

### 5. Optimistic Updates

#### Optimistic Mutations Hook
```typescript
// src/hooks/useOptimisticMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StudyType, Subject, Lesson } from '@/types/study';
import { queryKeys } from '@/lib/queryClient';

export const useOptimisticStudyType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<StudyType>) => {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      return { ...data, id: Date.now() } as StudyType;
    },
    onMutate: async (newStudyType) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: queryKeys.studyTypes });

      // Snapshot do estado atual
      const previousStudyTypes = queryClient.getQueryData<StudyType[]>(queryKeys.studyTypes);

      // Update otimista
      queryClient.setQueryData<StudyType[]>(queryKeys.studyTypes, (old) => [
        ...(old || []),
        {
          ...newStudyType,
          id: Date.now(), // ID temporário
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as StudyType,
      ]);

      return { previousStudyTypes };
    },
    onError: (err, newStudyType, context) => {
      // Reverter em caso de erro
      if (context?.previousStudyTypes) {
        queryClient.setQueryData(queryKeys.studyTypes, context.previousStudyTypes);
      }
    },
    onSettled: () => {
      // Invalidar queries para buscar dados atualizados
      queryClient.invalidateQueries({ queryKey: queryKeys.studyTypes });
    },
  });
};
```

### 6. Background Sync

#### Background Sync Service
```typescript
// src/services/backgroundSync.ts
import { queryClient } from '@/lib/queryClient';
import { httpClient } from '@/lib/httpClient';

class BackgroundSyncService {
  private syncQueue: Array<{
    id: string;
    action: 'create' | 'update' | 'delete';
    endpoint: string;
    data?: any;
    timestamp: Date;
  }> = [];
  
  private isOnline = navigator.onLine;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadSyncQueue();
    this.setupEventListeners();
    this.startPeriodicSync();
  }

  private loadSyncQueue() {
    const saved = localStorage.getItem('syncQueue');
    if (saved) {
      this.syncQueue = JSON.parse(saved);
    }
  }

  private saveSyncQueue() {
    localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private startPeriodicSync() {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, 30000); // Sync a cada 30 segundos
  }

  addToSyncQueue(
    action: 'create' | 'update' | 'delete',
    endpoint: string,
    data?: any
  ) {
    const syncItem = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      endpoint,
      data,
      timestamp: new Date(),
    };

    this.syncQueue.push(syncItem);
    this.saveSyncQueue();

    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  private async processSyncQueue() {
    const itemsToSync = [...this.syncQueue];
    
    for (const item of itemsToSync) {
      try {
        await this.syncItem(item);
        this.syncQueue = this.syncQueue.filter(qi => qi.id !== item.id);
        this.saveSyncQueue();
      } catch (error) {
        console.error('Failed to sync item:', error);
        // Item permanece na fila para nova tentativa
        break;
      }
    }
  }

  private async syncItem(item: typeof this.syncQueue[0]) {
    switch (item.action) {
      case 'create':
        return httpClient.post(item.endpoint, item.data);
      case 'update':
        return httpClient.put(item.endpoint, item.data);
      case 'delete':
        return httpClient.delete(item.endpoint);
    }
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

export const backgroundSync = new BackgroundSyncService();
```

### 7. App Provider (Integração Final)

#### App Providers
```typescript
// src/providers/AppProviders.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/contexts/AuthContext';
import { StudyProvider } from '@/contexts/StudyContext';
import { ErrorProvider } from '@/contexts/ErrorContext';
import { Toaster } from '@/components/ui/toaster';

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorProvider>
        <AuthProvider>
          <StudyProvider>
            {children}
            <Toaster />
            <ReactQueryDevtools initialIsOpen={false} />
          </StudyProvider>
        </AuthProvider>
      </ErrorProvider>
    </QueryClientProvider>
  );
};
```

## Entregáveis

### Core Integration
- React Query configurado com cache inteligente
- Error handling global e consistente
- Estado global para contexto de estudo
- HTTP client com interceptors e retry logic

### Performance Features
- Optimistic updates para melhor UX
- Background sync para offline support
- Cache invalidation estratégico
- Query prefetching onde apropriado

### Developer Experience
- DevTools do React Query
- Error tracking e logging
- TypeScript em toda integração
- Testing utilities

### Monitoring & Analytics
- Performance metrics
- Error tracking
- Usage analytics
- API response times

## Configurações de Performance

### Cache Strategy
- Study types: 10 minutos (mudança rara)
- Subjects: 5 minutos (mudança moderada)
- Lessons: 2 minutos (mudança frequente)
- User profile: 30 minutos (mudança rara)

### Network Optimizations
- Request debouncing
- Request deduplication
- Connection pooling
- Retry with exponential backoff

### Memory Management
- Query garbage collection
- Component unmount cleanup
- Memory leak prevention
- Large list virtualization