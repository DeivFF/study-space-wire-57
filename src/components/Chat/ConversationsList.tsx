import React, { useState } from 'react';
import { useConversations } from '@/hooks/useConversations';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, Plus, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Conversation } from '@/hooks/useConversations';
import { NewConversationDialog } from './NewConversationDialog';
import { cn } from '@/lib/utils';

interface ConversationsListProps {
  selectedConversationId: string | null;
  onConversationSelect: (id: string) => void;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  selectedConversationId,
  onConversationSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: conversations, isLoading, error } = useConversations();

  const filteredConversations = conversations?.filter((conversation) =>
    conversation.other_participant?.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  ) || [];

  const formatMessagePreview = (conversation: Conversation) => {
    if (!conversation.last_message) {
      return 'Nova conversa';
    }

    const message = conversation.last_message;
    if (message.message_type === 'image') {
      return '📷 Imagem';
    }
    if (message.message_type === 'file') {
      return '📎 Arquivo';
    }
    return message.content;
  };

  const formatLastMessageTime = (conversation: Conversation) => {
    const timestamp = conversation.last_message_at || conversation.created_at;
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Erro ao carregar conversas</p>
        <p className="text-sm text-muted-foreground mt-1">
          {error instanceof Error ? error.message : 'Erro desconhecido'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <NewConversationDialog onConversationCreated={onConversationSelect} />
      </div>

      {/* Conversations list */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center p-8">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-muted-foreground">
                {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50',
                  selectedConversationId === conversation.id && 'bg-accent'
                )}
                onClick={() => onConversationSelect(conversation.id)}
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage
                    src={conversation.other_participant?.avatar_url}
                    alt={conversation.other_participant?.name}
                  />
                  <AvatarFallback>
                    {conversation.other_participant?.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium truncate">
                      {conversation.other_participant?.name || 'Usuário Desconhecido'}
                    </h3>
                    <div className="flex items-center gap-1">
                      {conversation.unread_count > 0 && (
                        <Badge variant="default" className="text-xs px-1.5 py-0.5">
                          {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatLastMessageTime(conversation)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground truncate flex-1">
                      {formatMessagePreview(conversation)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};