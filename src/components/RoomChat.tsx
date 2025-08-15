// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import ChatBubble from './ChatBubble';

interface Message {
  id: number;
  content: string;
  user_id: string;
  created_at: string;
  profile?: {
    nickname: string | null;
    avatar_url: string | null;
  };
}

interface RoomChatProps {
  roomId: string;
  user: any; // Current user object
}

const RoomChat: React.FC<RoomChatProps> = ({ roomId, user }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await (supabase as any)
        .from('study_room_events')
        .select('*')
        .eq('room_id', roomId)
        .eq('type', 'chat')
        .order('created_at', { ascending: true });
      if (!error && data) {
        const msgs: Message[] = data.map((e: any) => ({
          id: e.id,
          content: e.payload?.message,
          user_id: e.payload?.user_id,
          created_at: e.created_at,
        }));
        const userIds = Array.from(new Set(msgs.map(m => m.user_id)));
        if (userIds.length > 0) {
          const { data: profiles } = await (supabase as any)
            .from('profiles')
            .select('user_id, nickname, avatar_url')
            .in('user_id', userIds);
          const map: Record<string, any> = {};
          profiles?.forEach((p: any) => (map[p.user_id] = p));
          msgs.forEach(m => (m.profile = map[m.user_id]));
        }
        setMessages(msgs);
      }
    };
    fetchMessages();
  }, [roomId]);

  const realtimeError = useRealtimeMessages<Message>({
    channel: `room:${roomId}`,
    table: 'study_room_events',
    filter: `room_id=eq.${roomId}`,
    fetchMessage: async (payload: any) => {
      if (payload.new.type !== 'chat') return null;
      const e = payload.new;
      const msg: Message = {
        id: e.id,
        content: e.payload?.message,
        user_id: e.payload?.user_id,
        created_at: e.created_at,
      };
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('user_id, nickname, avatar_url')
        .eq('user_id', msg.user_id)
        .single();
      msg.profile = profile;
      return msg;
    },
    onMessage: (msg) => setMessages((prev) => [...prev, msg]),
  });

  useEffect(() => {
    if (realtimeError) {
      console.error('Realtime subscription error:', realtimeError);
    }
  }, [realtimeError]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <>
      {messages.map(m => (
        <ChatBubble
          key={m.id}
          content={m.content}
          createdAt={m.created_at}
          profile={m.profile}
          isOwn={m.user_id === user?.id}
        />
      ))}
      <div ref={messagesEndRef} className="mt-auto" />
    </>
  );
};

export default RoomChat;
