import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from '@/hooks/useConversations';

interface TypingIndicatorProps {
  typingUsers: string[];
  participants: User[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  participants,
}) => {
  const typingParticipants = participants.filter(p => typingUsers.includes(p.id));

  if (typingParticipants.length === 0) return null;

  const getTypingText = () => {
    if (typingParticipants.length === 1) {
      return `${typingParticipants[0].name} está digitando...`;
    } else if (typingParticipants.length === 2) {
      return `${typingParticipants[0].name} e ${typingParticipants[1].name} estão digitando...`;
    } else {
      return `${typingParticipants.length} pessoas estão digitando...`;
    }
  };

  return (
    <div className="flex items-start gap-2">
      <Avatar className="w-8 h-8">
        <AvatarImage
          src={typingParticipants[0]?.avatar_url}
          alt={typingParticipants[0]?.name}
        />
        <AvatarFallback className="text-xs">
          {typingParticipants[0]?.name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>

      <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{getTypingText()}</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
};