import React, { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

interface StudySessionContextType {
  activeRoomId: string | null;
  participants: any[];
  setActiveRoomId: (roomId: string) => void;
  leaveSession: () => Promise<void>;
}

const StudySessionContext = createContext<StudySessionContextType | null>(null);

export const StudySessionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const roomChannel = useRef<RealtimeChannel | null>(null);

  const setActiveRoomIdAndJoin = useCallback((roomId: string) => {
    setActiveRoomId(roomId);
  }, []);

  const leaveSession = useCallback(async () => {
    if (!activeRoomId || !user) return;

    try {
      // Log user leaving activity
      await supabase.from('study_room_events').insert({
        room_id: activeRoomId,
        event_id: crypto.randomUUID(),
        type: 'user_left',
        payload: { 
          user_id: user.id,
          message: 'saiu da sala'
        }
      });

      const { error } = await supabase.rpc('leave_study_room', { p_room_id: activeRoomId });
      if (error) throw error;

      setActiveRoomId(null);
      setParticipants([]);
      toast.success("Você saiu da sessão de estudos.");
    } catch (error: any) {
      console.error('Error leaving session:', error);
      toast.error("Erro ao sair da sessão", { description: error.message });
    }
  }, [activeRoomId, user]);

  // Effect to check for an active session on load
  useEffect(() => {
    const findActiveSession = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('study_room_participants')
        .select('room_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (data) {
        setActiveRoomId(data.room_id);
      }
    };
    findActiveSession();
  }, [user]);

  const value = useMemo(() => ({
    activeRoomId,
    participants,
    setActiveRoomId: setActiveRoomIdAndJoin,
    leaveSession,
  }), [activeRoomId, participants, setActiveRoomIdAndJoin, leaveSession]);

  return (
    <StudySessionContext.Provider value={value}>
      {children}
    </StudySessionContext.Provider>
  );
};

export const useStudySession = (): StudySessionContextType => {
  const context = useContext(StudySessionContext);
  if (context === null) {
    throw new Error('useStudySession must be used within a StudySessionProvider');
  }
  return context;
};
