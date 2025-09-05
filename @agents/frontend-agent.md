# Frontend Agent - Interface e Componentes

## Responsabilidades

Este agente é especializado em:
- Desenvolvimento de componentes React
- Gerenciamento de estado e navegação
- Integração com APIs backend
- Experiência do usuário (UX)

## Contexto do Projeto

### Estrutura Atual
- **Framework:** React 18 + TypeScript + Vite
- **UI:** Radix UI + Tailwind CSS + shadcn/ui
- **Estado:** React Query + Context API
- **Roteamento:** React Router
- **Path Alias:** `@/` → `./src/`
- **Servidor:** http://localhost:8080

### Arquitetura Existente
- `src/contexts/AuthContext.tsx` - Autenticação
- `src/components/ProtectedRoute.tsx` - Proteção de rotas
- `src/pages/` - Páginas principais
- `src/components/ui/` - Componentes shadcn/ui

## Tarefas Específicas

### 1. Estrutura de Componentes

```
src/
├── components/
│   ├── study/
│   │   ├── StudyTypeCard.tsx
│   │   ├── StudyTypeForm.tsx
│   │   ├── StudyTypeList.tsx
│   │   ├── SubjectCard.tsx
│   │   ├── SubjectForm.tsx
│   │   ├── SubjectList.tsx
│   │   ├── LessonCard.tsx
│   │   ├── LessonForm.tsx
│   │   └── LessonList.tsx
│   ├── layout/
│   │   ├── Breadcrumb.tsx
│   │   ├── ProgressBar.tsx
│   │   └── StudyNavigation.tsx
│   └── ui/ (existente)
├── pages/
│   ├── Home.tsx (modificar)
│   ├── StudyType.tsx
│   ├── Subject.tsx
│   └── Lesson.tsx
├── hooks/
│   ├── useStudyTypes.ts
│   ├── useSubjects.ts
│   └── useLessons.ts
├── services/
│   └── studyApi.ts
└── types/
    └── study.ts
```

### 2. Types TypeScript

#### Study Types
```typescript
// src/types/study.ts
export interface StudyType {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  subjects_count?: number;
  lessons_count?: number;
  completed_lessons?: number;
  progress_percentage?: number;
}

export interface Subject {
  id: number;
  name: string;
  description?: string;
  color?: string;
  study_type_id: number;
  user_id: number;
  order_index: number;
  created_at: string;
  updated_at: string;
  lessons?: Lesson[];
  lessons_count?: number;
  completed_lessons?: number;
}

export interface Lesson {
  id: number;
  title: string;
  description?: string;
  content?: string;
  subject_id: number;
  user_id: number;
  order_index: number;
  duration_minutes?: number;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StudyStructure {
  study_type_id: number;
  study_type_name: string;
  study_type_color?: string;
  subjects: Array<Subject & { lessons: Lesson[] }>;
}

// Forms
export interface StudyTypeForm {
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface SubjectForm {
  name: string;
  description: string;
  color: string;
  study_type_id: number;
}

export interface LessonForm {
  title: string;
  description: string;
  content: string;
  subject_id: number;
  duration_minutes: number;
}
```

### 3. API Service

#### Study API Service
```typescript
// src/services/studyApi.ts
import { StudyType, Subject, Lesson, StudyStructure } from '@/types/study';

const API_BASE = 'http://localhost:3002/api';

class StudyAPI {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro na API');
    }

    return response.json();
  }

  // Study Types
  async getStudyTypes(): Promise<StudyType[]> {
    return this.request<StudyType[]>('/study-types');
  }

  async getStudyType(id: number): Promise<StudyType> {
    return this.request<StudyType>(`/study-types/${id}`);
  }

  async createStudyType(data: Partial<StudyType>): Promise<StudyType> {
    return this.request<StudyType>('/study-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStudyType(id: number, data: Partial<StudyType>): Promise<StudyType> {
    return this.request<StudyType>(`/study-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStudyType(id: number): Promise<void> {
    return this.request<void>(`/study-types/${id}`, {
      method: 'DELETE',
    });
  }

  async getStudyStructure(id: number): Promise<StudyStructure> {
    return this.request<StudyStructure>(`/study-types/${id}/structure`);
  }

  // Subjects
  async getSubjects(studyTypeId: number): Promise<Subject[]> {
    return this.request<Subject[]>(`/subjects?study_type_id=${studyTypeId}`);
  }

  async createSubject(data: Partial<Subject>): Promise<Subject> {
    return this.request<Subject>('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSubject(id: number, data: Partial<Subject>): Promise<Subject> {
    return this.request<Subject>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSubject(id: number): Promise<void> {
    return this.request<void>(`/subjects/${id}`, {
      method: 'DELETE',
    });
  }

  // Lessons
  async getLessons(subjectId: number): Promise<Lesson[]> {
    return this.request<Lesson[]>(`/lessons?subject_id=${subjectId}`);
  }

  async createLesson(data: Partial<Lesson>): Promise<Lesson> {
    return this.request<Lesson>('/lessons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLesson(id: number, data: Partial<Lesson>): Promise<Lesson> {
    return this.request<Lesson>(`/lessons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLesson(id: number): Promise<void> {
    return this.request<void>(`/lessons/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleLessonComplete(id: number): Promise<Lesson> {
    return this.request<Lesson>(`/lessons/${id}/complete`, {
      method: 'PUT',
    });
  }
}

export const studyAPI = new StudyAPI();
```

### 4. Custom Hooks

#### useStudyTypes Hook
```typescript
// src/hooks/useStudyTypes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studyAPI } from '@/services/studyApi';
import { StudyType } from '@/types/study';
import { toast } from '@/components/ui/use-toast';

export const useStudyTypes = () => {
  return useQuery({
    queryKey: ['studyTypes'],
    queryFn: studyAPI.getStudyTypes,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useStudyType = (id: number) => {
  return useQuery({
    queryKey: ['studyType', id],
    queryFn: () => studyAPI.getStudyType(id),
    enabled: !!id,
  });
};

export const useCreateStudyType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studyAPI.createStudyType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyTypes'] });
      toast({
        title: 'Sucesso!',
        description: 'Tipo de estudo criado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateStudyType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StudyType> }) =>
      studyAPI.updateStudyType(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studyTypes'] });
      queryClient.invalidateQueries({ queryKey: ['studyType', variables.id] });
      toast({
        title: 'Sucesso!',
        description: 'Tipo de estudo atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteStudyType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studyAPI.deleteStudyType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyTypes'] });
      toast({
        title: 'Sucesso!',
        description: 'Tipo de estudo removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
```

### 5. Componentes Principais

#### StudyTypeCard Component
```typescript
// src/components/study/StudyTypeCard.tsx
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StudyType } from '@/types/study';
import { BookOpen, GraduationCap, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StudyTypeCardProps {
  studyType: StudyType;
  onEdit: (studyType: StudyType) => void;
  onDelete: (studyType: StudyType) => void;
}

export const StudyTypeCard = ({ studyType, onEdit, onDelete }: StudyTypeCardProps) => {
  const navigate = useNavigate();

  const progressPercentage = studyType.progress_percentage || 0;
  const completedLessons = studyType.completed_lessons || 0;
  const totalLessons = studyType.lessons_count || 0;

  return (
    <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader 
        className="pb-3"
        style={{ backgroundColor: `${studyType.color}20` }}
        onClick={() => navigate(`/study/${studyType.id}`)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {studyType.name}
          </CardTitle>
          {studyType.color && (
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: studyType.color }}
            />
          )}
        </div>
        {studyType.description && (
          <p className="text-sm text-gray-600 mt-2">
            {studyType.description}
          </p>
        )}
      </CardHeader>

      <CardContent 
        className="pb-3"
        onClick={() => navigate(`/study/${studyType.id}`)}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <BookOpen className="w-4 h-4 text-gray-500" />
                <span>{studyType.subjects_count || 0} disciplinas</span>
              </div>
              <div className="flex items-center space-x-1">
                <GraduationCap className="w-4 h-4 text-gray-500" />
                <span>{totalLessons} aulas</span>
              </div>
            </div>
            <Badge variant="outline">
              {completedLessons}/{totalLessons}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso</span>
              <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(studyType);
          }}
        >
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-red-600 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(studyType);
          }}
        >
          Excluir
        </Button>
      </CardFooter>
    </Card>
  );
};
```

#### StudyTypeForm Component
```typescript
// src/components/study/StudyTypeForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StudyType } from '@/types/study';

const studyTypeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  description: z.string().max(1000).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida').optional(),
  icon: z.string().max(100).optional(),
});

type StudyTypeFormData = z.infer<typeof studyTypeSchema>;

interface StudyTypeFormProps {
  studyType?: StudyType;
  onSubmit: (data: StudyTypeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const colorPresets = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export const StudyTypeForm = ({ 
  studyType, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: StudyTypeFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StudyTypeFormData>({
    resolver: zodResolver(studyTypeSchema),
    defaultValues: {
      name: studyType?.name || '',
      description: studyType?.description || '',
      color: studyType?.color || '#3B82F6',
      icon: studyType?.icon || '',
    },
  });

  const selectedColor = watch('color');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Ex: ENEM, Vestibular, Concursos..."
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Descreva o objetivo deste tipo de estudo..."
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Cor</Label>
        <div className="flex items-center space-x-2">
          <div
            className="w-8 h-8 rounded border-2 border-gray-200"
            style={{ backgroundColor: selectedColor }}
          />
          <Input
            {...register('color')}
            placeholder="#3B82F6"
            className="flex-1"
          />
        </div>
        <div className="flex space-x-2">
          {colorPresets.map((color) => (
            <button
              key={color}
              type="button"
              className="w-6 h-6 rounded border-2 border-gray-200 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => setValue('color', color)}
            />
          ))}
        </div>
        {errors.color && (
          <p className="text-sm text-red-500">{errors.color.message}</p>
        )}
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Salvando...' : studyType ? 'Atualizar' : 'Criar'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};
```

### 6. Páginas Principais

#### Home Page (Modificada)
```typescript
// src/pages/Home.tsx
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StudyTypeCard } from '@/components/study/StudyTypeCard';
import { StudyTypeForm } from '@/components/study/StudyTypeForm';
import { 
  useStudyTypes, 
  useCreateStudyType, 
  useUpdateStudyType, 
  useDeleteStudyType 
} from '@/hooks/useStudyTypes';
import { StudyType } from '@/types/study';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';

export const Home = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingStudyType, setEditingStudyType] = useState<StudyType | null>(null);

  const { data: studyTypes, isLoading } = useStudyTypes();
  const createStudyType = useCreateStudyType();
  const updateStudyType = useUpdateStudyType();
  const deleteStudyType = useDeleteStudyType();

  const handleCreateStudyType = async (data: any) => {
    await createStudyType.mutateAsync(data);
    setIsCreateDialogOpen(false);
  };

  const handleUpdateStudyType = async (data: any) => {
    if (!editingStudyType) return;
    await updateStudyType.mutateAsync({ 
      id: editingStudyType.id, 
      data 
    });
    setEditingStudyType(null);
  };

  const handleDeleteStudyType = async (studyType: StudyType) => {
    if (confirm(`Tem certeza que deseja excluir "${studyType.name}"?`)) {
      await deleteStudyType.mutateAsync(studyType.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Meus Estudos
          </h1>
          <p className="text-gray-600 mt-2">
            Organize seu aprendizado por tipos de estudo, disciplinas e aulas
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Tipo de Estudo</span>
        </Button>
      </div>

      {!studyTypes || studyTypes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Nenhum tipo de estudo encontrado"
          description="Crie seu primeiro tipo de estudo para começar a organizar suas aulas"
          action={
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Tipo de Estudo
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studyTypes.map((studyType) => (
            <StudyTypeCard
              key={studyType.id}
              studyType={studyType}
              onEdit={setEditingStudyType}
              onDelete={handleDeleteStudyType}
            />
          ))}
        </div>
      )}

      {/* Dialog para criar tipo de estudo */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Tipo de Estudo</DialogTitle>
          </DialogHeader>
          <StudyTypeForm
            onSubmit={handleCreateStudyType}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={createStudyType.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para editar tipo de estudo */}
      <Dialog 
        open={!!editingStudyType} 
        onOpenChange={(open) => !open && setEditingStudyType(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Tipo de Estudo</DialogTitle>
          </DialogHeader>
          {editingStudyType && (
            <StudyTypeForm
              studyType={editingStudyType}
              onSubmit={handleUpdateStudyType}
              onCancel={() => setEditingStudyType(null)}
              isLoading={updateStudyType.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
```

## Entregáveis

### Componentes
- Cards para cada entidade (StudyType, Subject, Lesson)
- Formulários de criação/edição
- Listas com funcionalidades de filtro e busca
- Componentes de navegação e breadcrumb

### Hooks Personalizados
- Hooks para cada entidade com React Query
- Estados de loading, error e success
- Invalidação de cache otimizada

### Páginas
- Home page atualizada
- Páginas para navegação hierárquica
- Rotas protegidas configuradas

### Serviços
- API service com TypeScript
- Error handling centralizado
- Interceptors para autenticação

## UX/UI Considerações

### Design System
- Consistência com shadcn/ui existente
- Cores e tipografia padronizadas
- Responsive design

### Interações
- Loading states em todas operações
- Feedback visual para ações
- Confirmações para operações destrutivas
- Drag & drop para reordenação

### Performance
- Lazy loading de componentes
- Virtual scrolling para listas grandes
- Debounce em campos de busca
- Otimistic updates onde apropriado

### Acessibilidade
- Navegação por teclado
- Screen reader support
- Contraste adequado
- Focus management