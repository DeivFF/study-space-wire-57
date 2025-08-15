// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Headphones, Edit3, UserPlus, UserMinus } from 'lucide-react';

interface RoomFeedProps {
  roomId: string;
}

interface RoomEvent {
  id: number;
  type: string;
  payload: any;
  created_at: string;
  user_id: string;
  profile?: {
    nickname: string | null;
  };
}

const eventIcons = {
  default: Edit3,
  user_joined: UserPlus,
  user_left: UserMinus,
  file_uploaded: FileText,
  started_call: Headphones,
};

const eventActions = {
  default: 'fez uma ação',
  user_joined: 'entrou na sala',
  user_left: 'saiu da sala',
  file_uploaded: 'fez upload de um arquivo',
  started_call: 'entrou na chamada',
};

const RoomFeed: React.FC<RoomFeedProps> = ({ roomId }) => {
  const [events, setEvents] = useState<RoomEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await (supabase as any)
        .from('study_room_events')
        .select('*, profile:user_id(nickname)')
        .eq('room_id', roomId)
        .neq('type', 'chat')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error && data) {
        setEvents(data);
      }
    };
    load();
    const channel = (supabase as any)
      .channel(`room-feed-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'study_room_events', filter: `room_id=eq.${roomId}` },
        async (payload: any) => {
          if (payload.new.type === 'chat') return;
          const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('nickname')
            .eq('user_id', payload.new.user_id)
            .single();
          payload.new.profile = profile;
          setEvents(prev => [payload.new, ...prev].slice(0, 20));
        }
      )
      .subscribe();
    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, [roomId]);

  const renderEvent = (event: RoomEvent) => {
    const Icon = eventIcons[event.type] || eventIcons.default;
    const action = event.payload?.message || eventActions[event.type] || eventActions.default;
    const time = new Date(event.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const user = event.profile?.nickname || 'Alguém';

    return (
      <div className="event">
        <div className="event-icon" aria-hidden="true">
          <Icon className="icon" />
        </div>
        <div>
          <div className="title"><strong>{user}</strong> {action}</div>
          <div className="time">{time}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      {events.length === 0 && <div className="muted">Sem eventos recentes.</div>}
      {events.map(e => (
        <div key={e.id}>
          {renderEvent(e)}
        </div>
      ))}
    </>
  );
};

export default RoomFeed;
