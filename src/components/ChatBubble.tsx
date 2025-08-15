import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Profile {
  nickname: string | null;
  avatar_url: string | null;
}

interface ChatBubbleProps {
  content: string;
  createdAt: string;
  profile?: Profile;
  isOwn: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ content, createdAt, profile, isOwn }) => {
  const time = new Date(createdAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`msg-row ${isOwn ? 'own' : ''}`}>
      {!isOwn && (
        <Avatar className="w-8 h-8">
          <AvatarImage src={profile?.avatar_url || ''} />
          <AvatarFallback>
            {profile?.nickname?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="bubble">
        <p className="text-sm font-semibold mb-1">
          {profile?.nickname || 'Usuário'}
        </p>
        <p className="text-sm">{content}</p>
        <p className="time">{time}</p>
      </div>
      {isOwn && (
        <Avatar className="w-8 h-8">
          <AvatarImage src={profile?.avatar_url || ''} />
          <AvatarFallback>
            {profile?.nickname?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatBubble;
