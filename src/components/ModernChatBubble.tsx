import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Profile {
  nickname: string | null;
  avatar_url: string | null;
}

interface ModernChatBubbleProps {
  content: string;
  createdAt: string;
  profile?: Profile;
  isOwn: boolean;
}

const ModernChatBubble: React.FC<ModernChatBubbleProps> = ({ content, createdAt, profile, isOwn }) => {
  const time = new Date(createdAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isOwn) {
    return (
      <div className="flex flex-col items-end">
        <div className="flex items-end justify-end gap-2 mb-1">
          <div className="inline-block max-w-[300px] rounded-2xl bg-primary/10 px-4 py-3 text-[15px] leading-snug text-foreground shadow-sm">
            {content}
          </div>
          <Avatar className="h-9 w-9 ring-2 ring-card shadow-sm">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback>
              {profile?.nickname?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="mr-12 text-right text-[11px] text-muted-foreground">
          {time}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <Avatar className="mt-0.5 h-9 w-9 ring-2 ring-card shadow-sm">
        <AvatarImage src={profile?.avatar_url || ''} />
        <AvatarFallback>
          {profile?.nickname?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="inline-block max-w-[330px] rounded-2xl bg-muted px-4 py-3 text-[15px] leading-snug text-foreground ring-1 ring-border shadow-sm">
          {content}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">{time}</div>
      </div>
    </div>
  );
};

export default ModernChatBubble;
