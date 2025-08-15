// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import ChatBubble from './ChatBubble';

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    nickname: string | null;
    avatar_url: string | null;
  } | null;
}

interface TrailChatProps {
  trailId: string;
}

const TrailChat: React.FC<TrailChatProps> = ({ trailId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('trail_messages')
        .select(`*, profiles (nickname, avatar_url)`)
        .eq('trail_id', trailId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else if (data) {
        setMessages(data as Message[]);
      }
      setLoading(false);
    };

    fetchMessages();
  }, [trailId]);

  const realtimeError = useRealtimeMessages<Message>({
    channel: `trail:${trailId}`,
    table: 'trail_messages',
    filter: `trail_id=eq.${trailId}`,
    fetchMessage: async (payload) => {
      const { data: newMessageData, error } = await supabase
        .from('trail_messages')
        .select(`*, profiles (nickname, avatar_url)`)
        .eq('id', payload.new.id)
        .single();

      if (error) {
        console.error('Error fetching new message details:', error);
        return null;
      }
      return newMessageData as Message;
    },
    onMessage: (msg) => setMessages((prevMessages) => [...prevMessages, msg]),
  });

  useEffect(() => {
    if (realtimeError) {
      console.error('Realtime subscription error:', realtimeError);
    }
  }, [realtimeError]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('trail_messages').insert({
      trail_id: trailId,
      user_id: user.id,
      content: content,
    });

    if (error) {
      console.error('Error sending message:', error);
      // Optional: show a toast notification on error
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-muted-foreground">Carregando mensagens...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white border rounded-lg">
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              content={message.content}
              createdAt={message.created_at}
              profile={message.profiles}
              isOwn={message.user_id === user?.id}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default TrailChat;
