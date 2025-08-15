import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Headphones, 
  Edit3, 
  UserPlus, 
  UserMinus, 
  Play,
  BookOpen,
  Brain,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ActivityEvent {
  id: number;
  type: string;
  payload: any;
  created_at: string;
  user_id?: string;
  profile?: {
    nickname: string;
    avatar_url?: string;
  };
}

interface StudyRoomActivityFeedProps {
  roomId: string;
}

const StudyRoomActivityFeed: React.FC<StudyRoomActivityFeedProps> = ({ roomId }) => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      const { data, error } = await supabase
        .from('study_room_events')
        .select('*')
        .eq('room_id', roomId)
        .neq('type', 'chat') // Exclude chat messages from activity feed
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading activity events:', error);
        setLoading(false);
        return;
      }

      // For each event, fetch the user profile if we have a user_id in payload
      const eventsWithProfiles = await Promise.all(
        data?.map(async (event) => {
          const payload = event.payload as any;
          if (payload?.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('nickname, avatar_url')
              .eq('user_id', payload.user_id)
              .single();
            
            return { ...event, profile };
          }
          return event;
        }) || []
      );

      setEvents(eventsWithProfiles);
      setLoading(false);
    };

    loadEvents();

    // Subscribe to new activity events
    const channel = supabase
      .channel(`room-${roomId}-activity`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'study_room_events',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          if (payload.new.type === 'chat') return; // Skip chat messages
          
          // Fetch profile for the new event
          let eventWithProfile: ActivityEvent = payload.new as ActivityEvent;
          const eventPayload = payload.new.payload as any;
          if (eventPayload?.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('nickname, avatar_url')
              .eq('user_id', eventPayload.user_id)
              .single();
            
            eventWithProfile = { ...payload.new, profile } as ActivityEvent;
          }

          setEvents(prev => [eventWithProfile, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'user_joined': return UserPlus;
      case 'user_left': return UserMinus;
      case 'question_answered': return Edit3;
      case 'lesson_completed': return BookOpen;
      case 'audio_played': return Headphones;
      case 'document_opened': return FileText;
      case 'flashcard_reviewed': return Brain;
      case 'timer_started': return Play;
      case 'timer_paused': return Clock;
      default: return Edit3;
    }
  };

  const getEventMessage = (event: ActivityEvent) => {
    const userName = event.profile?.nickname || 'Alguém';
    
    switch (event.type) {
      case 'user_joined':
        return `${userName} entrou na sala`;
      case 'user_left':
        return `${userName} saiu da sala`;
      case 'question_answered':
        return `${userName} respondeu uma questão de ${event.payload?.subject || 'estudos'}`;
      case 'lesson_completed':
        return `${userName} completou a aula "${event.payload?.lesson_name || 'Nova aula'}"`;
      case 'audio_played':
        return `${userName} iniciou o áudio "${event.payload?.audio_name || 'Novo áudio'}"`;
      case 'document_opened':
        return `${userName} abriu o documento "${event.payload?.document_name || 'Novo documento'}"`;
      case 'flashcard_reviewed':
        return `${userName} revisou ${event.payload?.count || 1} flashcard(s)`;
      case 'timer_started':
        return `${userName} começou a estudar`;
      case 'timer_paused':
        return `${userName} pausou o timer de estudos`;
      case 'goal_completed':
        return `${userName} completou uma meta de estudos`;
      default:
        return event.payload?.message || `${userName} fez uma ação`;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'user_joined': return 'text-green-600 bg-green-100';
      case 'user_left': return 'text-red-600 bg-red-100';
      case 'question_answered': return 'text-blue-600 bg-blue-100';
      case 'lesson_completed': return 'text-purple-600 bg-purple-100';
      case 'audio_played': return 'text-orange-600 bg-orange-100';
      case 'timer_started': return 'text-green-600 bg-green-100';
      case 'timer_paused': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatEventTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">Atividade em Tempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Atividade em Tempo Real</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)] px-6 pb-6">
          {events.length === 0 ? (
            <div className="text-center py-8">
              <Edit3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nenhuma atividade recente</p>
              <p className="text-xs text-gray-400 mt-1">
                As ações dos participantes aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const IconComponent = getEventIcon(event.type);
                return (
                  <div key={event.id} className="flex items-start space-x-3 group">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getEventColor(event.type)}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-tight">
                        {getEventMessage(event)}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="outline" className="text-xs">
                          {formatEventTime(event.created_at)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default StudyRoomActivityFeed;