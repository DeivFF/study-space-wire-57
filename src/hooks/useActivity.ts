import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studyAPI, ActivityLogEntry } from '@/services/studyApi';

export const useActivity = (lessonId: string) => {
  const queryClient = useQueryClient();

  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['activity', lessonId],
    queryFn: () => studyAPI.getLessonActivity(lessonId),
    enabled: !!lessonId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 30, // 30 seconds
  });

  const clearActivityMutation = useMutation({
    mutationFn: () => studyAPI.clearLessonActivity(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', lessonId] });
    },
  });

  // Group activities by date
  const groupedActivities = activities?.reduce((acc, activity) => {
    const date = new Date(activity.timestamp).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, ActivityLogEntry[]>) || {};

  // Filter activities by type
  const filterByType = (type: string) => {
    if (type === 'all') return activities || [];
    return activities?.filter(activity => activity.type.includes(type)) || [];
  };

  // Get recent activities (last 10)
  const recentActivities = activities?.slice(0, 10) || [];

  // Get activity stats
  const stats = {
    totalActivities: activities?.length || 0,
    filesViewed: activities?.filter(a => a.type === 'file_view').length || 0,
    notesCreated: activities?.filter(a => a.type === 'note_created').length || 0,
    flashcardsReviewed: activities?.filter(a => a.type === 'flashcard_reviewed').length || 0,
    exercisesAttempted: activities?.filter(a => a.type === 'exercise_attempted').length || 0,
    totalTime: activities?.reduce((sum, a) => sum + (a.duration || 0), 0) || 0,
  };

  return {
    activities: activities || [],
    groupedActivities,
    recentActivities,
    stats,
    isLoading,
    error,
    filterByType,
    clearActivity: clearActivityMutation.mutate,
    isClearing: clearActivityMutation.isPending,
  };
};