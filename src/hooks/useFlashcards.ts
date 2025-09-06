import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { studyAPI, Flashcard } from '@/services/studyApi';
import { toast } from '@/components/ui/enhanced-toast';

interface ReviewStats {
  correct: number;
  total: number;
  accuracy: number;
  avgResponseTime: number;
}

export const useFlashcards = (lessonId: string) => {
  const [currentSession, setCurrentSession] = useState<{
    sessionId: string;
    cards: Flashcard[];
    currentIndex: number;
    stats: ReviewStats;
  } | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const queryClient = useQueryClient();

  const { data: flashcardsData, isLoading, error } = useQuery({
    queryKey: ['flashcards', lessonId],
    queryFn: () => {
      console.log('Executando getLessonFlashcards para lessonId:', lessonId);
      return studyAPI.getLessonFlashcards(lessonId);
    },
    enabled: !!lessonId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: dueCards, isLoading: isLoadingDue } = useQuery({
    queryKey: ['flashcards', 'due', lessonId],
    queryFn: () => studyAPI.getDueFlashcards(lessonId),
    enabled: !!lessonId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const createMutation = useMutation({
    mutationFn: (data: { front_content: string; back_content: string; tags?: string[] }) =>
      studyAPI.createFlashcard(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', lessonId] });
      queryClient.invalidateQueries({ queryKey: ['flashcards', 'due', lessonId] });
      toast.success('Flashcard criado com sucesso');
      console.log('Flashcard criado, queries invalidadas');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar flashcard', { description: error.message });
      console.error('Erro ao criar flashcard:', error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: { front_content?: string; back_content?: string; tags?: string[] } }) =>
      studyAPI.updateFlashcard(cardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', lessonId] });
      toast.success('Flashcard atualizado');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar flashcard', { description: error.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: studyAPI.deleteFlashcard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', lessonId] });
      queryClient.invalidateQueries({ queryKey: ['flashcards', 'due', lessonId] });
      toast.success('Flashcard removido');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover flashcard', { description: error.message });
    }
  });

  const reviewMutation = useMutation({
    mutationFn: ({ cardId, quality }: { cardId: string; quality: number }) =>
      studyAPI.reviewFlashcard(cardId, quality),
    onSuccess: (_, { quality }) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', lessonId] });
      queryClient.invalidateQueries({ queryKey: ['flashcards', 'due', lessonId] });
      
      // Update session stats
      if (currentSession) {
        const isCorrect = quality >= 3;
        const newStats = {
          ...currentSession.stats,
          total: currentSession.stats.total + 1,
          correct: currentSession.stats.correct + (isCorrect ? 1 : 0),
        };
        newStats.accuracy = (newStats.correct / newStats.total) * 100;

        setCurrentSession({
          ...currentSession,
          stats: newStats,
        });

        toast.flashcard.cardReviewed(quality);
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao revisar flashcard', { description: error.message });
    }
  });

  const startSession = async (limit: number = 20) => {
    try {
      const sessionData = await studyAPI.startFlashcardSession(lessonId, limit);
      
      if (sessionData.flashcards.length === 0) {
        toast.info('Nenhum flashcard devido para revisão');
        return;
      }

      setCurrentSession({
        sessionId: sessionData.session_id,
        cards: sessionData.flashcards,
        currentIndex: 0,
        stats: {
          correct: 0,
          total: 0,
          accuracy: 0,
          avgResponseTime: 0,
        },
      });

      setShowAnswer(false);
      toast.flashcard.sessionStarted(sessionData.flashcards.length);
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Erro ao iniciar sessão de estudo');
    }
  };

  const endSession = () => {
    if (currentSession && currentSession.stats.total > 0) {
      toast.flashcard.sessionCompleted(currentSession.stats);
    }
    setCurrentSession(null);
    setShowAnswer(false);
  };

  const reviewCard = async (cardId: string, quality: number) => {
    if (!currentSession) return;

    await reviewMutation.mutateAsync({ cardId, quality });

    // Move to next card or end session
    const nextIndex = currentSession.currentIndex + 1;
    if (nextIndex >= currentSession.cards.length) {
      // Session completed
      setTimeout(() => {
        endSession();
      }, 1000);
    } else {
      setCurrentSession({
        ...currentSession,
        currentIndex: nextIndex,
      });
      setShowAnswer(false);
    }
  };

  const getCurrentCard = () => {
    if (!currentSession || currentSession.currentIndex >= currentSession.cards.length) {
      return null;
    }
    return currentSession.cards[currentSession.currentIndex];
  };

  const getSessionProgress = () => {
    if (!currentSession) return { current: 0, total: 0, percentage: 0 };
    
    const current = currentSession.currentIndex + 1;
    const total = currentSession.cards.length;
    const percentage = (current / total) * 100;
    
    return { current, total, percentage };
  };

  return {
    // Data
    allCards: flashcardsData?.flashcards || [],
    dueCards: dueCards || [],
    statistics: flashcardsData?.statistics,
    totalCards: flashcardsData?.flashcards?.length || 0,
    dueCount: dueCards?.length || 0,

    // Loading states
    isLoading: isLoading || isLoadingDue,
    error,

    // CRUD operations
    createCard: createMutation.mutate,
    updateCard: updateMutation.mutate,
    deleteCard: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Study session
    currentSession,
    getCurrentCard,
    getSessionProgress,
    showAnswer,
    setShowAnswer,
    startSession,
    endSession,
    reviewCard,
    isReviewing: reviewMutation.isPending,
  };
};