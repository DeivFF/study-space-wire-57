// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Mic, Info, Send, Smile } from 'lucide-react';
import ModernChatBubble from './ModernChatBubble';

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

interface ModernRoomChatProps {
  roomId: string;
  user: any;
  roomTitle: string;
  roomSubtitle: string;
}

const ModernRoomChat: React.FC<ModernRoomChatProps> = ({ roomId, user, roomTitle, roomSubtitle }) => {
  const [messages, setMessages] = useState<Message[]>([
    // Mensagens de exemplo para demonstração
    {
      id: 1,
      content: "Olá! Podemos começar a revisar matemática agora?",
      user_id: "user1",
      created_at: new Date().toISOString(),
      profile: { nickname: "João Silva", avatar_url: null }
    },
    {
      id: 2,
      content: "Claro, estou pronto!",
      user_id: user?.id || "current-user",
      created_at: new Date().toISOString(),
      profile: { nickname: "Você", avatar_url: null }
    },
    {
      id: 3,
      content: "Podemos revisar a parte de trigonometria primeiro.",
      user_id: user?.id || "current-user",
      created_at: new Date().toISOString(),
      profile: { nickname: "Você", avatar_url: null }
    },
    {
      id: 4,
      content: "Acho que essa é uma boa ideia.",
      user_id: "user1",
      created_at: new Date().toISOString(),
      profile: { nickname: "João Silva", avatar_url: null }
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');

    // Adicionar a nova mensagem às mensagens existentes
    const newMsg: Message = {
      id: Date.now(),
      content: content,
      user_id: user?.id || "current-user",
      created_at: new Date().toISOString(),
      profile: { nickname: "Você", avatar_url: null }
    };

    setMessages(prev => [...prev, newMsg]);
  };

  return (
    <div className="h-full bg-card border border-border shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="text-[17px] font-semibold leading-none text-foreground">{roomTitle}</div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">{roomSubtitle}</div>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
          <Mic className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
          <Info className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-5">
          {messages.map(m => (
            <ModernChatBubble
              key={m.id}
              content={m.content}
              createdAt={m.created_at}
              profile={m.profile}
              isOwn={m.user_id === user?.id}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-border bg-card px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escreva sua mensagem..."
              className="h-11 w-full rounded-full border-0 bg-muted pl-10 pr-4 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
            />
            <Smile className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim()}
            className="h-11 w-11 rounded-full bg-gradient-to-br from-[#2E6CF6] to-[#1B4CC5] text-white shadow-sm"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ModernRoomChat;
