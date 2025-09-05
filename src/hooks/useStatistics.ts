import { useQuery } from '@tanstack/react-query';
import { studyAPI, LessonStatistics } from '@/services/studyApi';

export const useStatistics = (lessonId: string) => {
  const { data: statistics, isLoading, error } = useQuery({
    queryKey: ['statistics', lessonId],
    queryFn: () => studyAPI.getLessonStatistics(lessonId),
    enabled: !!lessonId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate progress metrics
  const progressMetrics = {
    completionPercentage: statistics ? 
      Math.round((statistics.total_study_time / (statistics.total_study_time + 60)) * 100) : 0,
    
    accuracyTrend: statistics?.accuracy_percentage || 0,
    
    activityScore: statistics ? 
      (statistics.files_count * 5) + 
      (statistics.notes_count * 10) + 
      (statistics.flashcards_count * 15) + 
      (statistics.exercises_count * 20) : 0,
      
    consistencyScore: statistics ? 
      Math.min(100, (statistics.total_reviews / Math.max(1, statistics.flashcards_count)) * 20) : 0,
  };

  // Study recommendations
  const recommendations = [];
  
  if (statistics) {
    if (statistics.flashcards_due > 5) {
      recommendations.push({
        type: 'flashcards',
        message: `Você tem ${statistics.flashcards_due} flashcards para revisar`,
        priority: 'high',
        action: 'Revisar flashcards',
      });
    }
    
    if (statistics.accuracy_percentage < 70) {
      recommendations.push({
        type: 'study',
        message: 'Sua taxa de acerto está baixa. Considere revisar o conteúdo',
        priority: 'medium',
        action: 'Revisar materiais',
      });
    }
    
    if (statistics.notes_count === 0) {
      recommendations.push({
        type: 'notes',
        message: 'Criar anotações pode ajudar na memorização',
        priority: 'low',
        action: 'Criar anotações',
      });
    }
  }

  // Format time helper
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return {
    statistics,
    progressMetrics,
    recommendations,
    isLoading,
    error,
    formatTime,
  };
};