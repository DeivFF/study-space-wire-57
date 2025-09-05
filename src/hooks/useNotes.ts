import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { studyAPI, LessonNote } from '@/services/studyApi';
import { toast } from '@/components/ui/enhanced-toast';

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  }) as T;
}

export const useNotes = (lessonId: string) => {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: notes, isLoading, error } = useQuery({
    queryKey: ['notes', lessonId],
    queryFn: () => studyAPI.getLessonNotes(lessonId),
    enabled: !!lessonId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: (data: { title?: string; content: string; tags?: string[] }) =>
      studyAPI.createNote(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', lessonId] });
      toast.note.created();
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar anotação', { description: error.message });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ noteId, data }: { noteId: string; data: { title?: string; content?: string; tags?: string[] } }) =>
      studyAPI.updateNote(noteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', lessonId] });
      toast.note.updated();
    },
    onError: (error: Error) => {
      toast.error('Erro ao salvar anotação', { description: error.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: studyAPI.deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', lessonId] });
      toast.note.deleted();
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover anotação', { description: error.message });
    }
  });

  // Auto-save functionality with debounce
  const debouncedUpdate = useCallback(
    debounce((noteId: string, data: { title?: string; content?: string; tags?: string[] }) => {
      studyAPI.updateNote(noteId, data).then(() => {
        queryClient.invalidateQueries({ queryKey: ['notes', lessonId] });
        toast.note.autoSaved();
      }).catch((error) => {
        console.error('Auto-save error:', error);
      });
    }, 2000),
    [lessonId, queryClient]
  );

  const autoSave = useCallback((noteId: string, data: { title?: string; content?: string; tags?: string[] }) => {
    debouncedUpdate(noteId, data);
  }, [debouncedUpdate]);

  // Search functionality
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['notes', 'search', searchQuery],
    queryFn: () => studyAPI.searchNotes(searchQuery),
    enabled: searchQuery.length > 2,
    staleTime: 1000 * 30, // 30 seconds
  });

  const filteredNotes = searchQuery.length > 2 
    ? searchResults || [] 
    : notes?.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ) || [];

  return {
    notes: notes || [],
    filteredNotes,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    isSearching,
    createNote: createMutation.mutate,
    updateNote: updateMutation.mutate,
    deleteNote: deleteMutation.mutate,
    autoSave,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};