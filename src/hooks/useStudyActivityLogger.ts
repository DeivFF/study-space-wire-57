import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStudySession } from '@/contexts/StudySessionContext';
import { useAuth } from '@/hooks/useAuth';

export interface ActivityEventData {
  type: 'question_answered' | 'lesson_completed' | 'audio_played' | 'document_opened' | 
        'flashcard_reviewed' | 'timer_started' | 'timer_paused' | 'goal_completed' | 'user_joined' | 'user_left';
  payload: {
    user_id: string;
    message?: string;
    subject?: string;
    lesson_name?: string;
    audio_name?: string;
    document_name?: string;
    count?: number;
    [key: string]: any;
  };
}

export const useStudyActivityLogger = () => {
  const { activeRoomId } = useStudySession();
  const { user } = useAuth();

  const logActivity = useCallback(async (eventData: Omit<ActivityEventData, 'payload'> & { 
    payload: Omit<ActivityEventData['payload'], 'user_id'> 
  }) => {
    if (!activeRoomId || !user) {
      console.log('No active room or user, skipping activity log');
      return;
    }

    try {
      const { error } = await supabase
        .from('study_room_events')
        .insert({
          room_id: activeRoomId,
          event_id: crypto.randomUUID(),
          type: eventData.type,
          payload: {
            ...eventData.payload,
            user_id: user.id
          }
        });

      if (error) {
        console.error('Error logging activity:', error);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }, [activeRoomId, user]);

  // Specific logging functions for common activities
  const logQuestionAnswered = useCallback((subject: string, isCorrect: boolean) => {
    logActivity({
      type: 'question_answered',
      payload: {
        subject,
        is_correct: isCorrect,
        message: `respondeu uma questão de ${subject} ${isCorrect ? 'corretamente' : 'incorretamente'}`
      }
    });
  }, [logActivity]);

  const logLessonCompleted = useCallback((lessonName: string, duration?: number) => {
    logActivity({
      type: 'lesson_completed',
      payload: {
        lesson_name: lessonName,
        duration_minutes: duration,
        message: `completou a aula "${lessonName}"`
      }
    });
  }, [logActivity]);

  const logAudioPlayed = useCallback((audioName: string) => {
    logActivity({
      type: 'audio_played',
      payload: {
        audio_name: audioName,
        message: `iniciou o áudio "${audioName}"`
      }
    });
  }, [logActivity]);

  const logDocumentOpened = useCallback((documentName: string) => {
    logActivity({
      type: 'document_opened',
      payload: {
        document_name: documentName,
        message: `abriu o documento "${documentName}"`
      }
    });
  }, [logActivity]);

  const logFlashcardReviewed = useCallback((count: number, subject?: string) => {
    logActivity({
      type: 'flashcard_reviewed',
      payload: {
        count,
        subject,
        message: `revisou ${count} flashcard(s)${subject ? ` de ${subject}` : ''}`
      }
    });
  }, [logActivity]);

  const logTimerStarted = useCallback(() => {
    logActivity({
      type: 'timer_started',
      payload: {
        message: 'começou a estudar'
      }
    });
  }, [logActivity]);

  const logTimerPaused = useCallback(() => {
    logActivity({
      type: 'timer_paused',
      payload: {
        message: 'pausou o timer de estudos'
      }
    });
  }, [logActivity]);

  const logGoalCompleted = useCallback((goalTitle: string) => {
    logActivity({
      type: 'goal_completed',
      payload: {
        goal_title: goalTitle,
        message: `completou a meta "${goalTitle}"`
      }
    });
  }, [logActivity]);

  return {
    logActivity,
    logQuestionAnswered,
    logLessonCompleted,
    logAudioPlayed,
    logDocumentOpened,
    logFlashcardReviewed,
    logTimerStarted,
    logTimerPaused,
    logGoalCompleted,
    isInStudyRoom: !!activeRoomId
  };
};