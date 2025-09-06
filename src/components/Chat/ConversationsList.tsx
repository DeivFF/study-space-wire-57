import React, { useState } from 'react';
import { useConversations, useMuteConversation } from '@/hooks/useConversations';
import { useMarkAllAsRead } from '@/hooks/useMessages';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Plus, Loader2, MoreVertical, Volume2, VolumeX, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Conversation } from '@/hooks/useConversations';
import { NewConversationDialog } from './NewConversationDialog';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

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
  const muteConversationMutation = useMuteConversation();
  const markAllAsReadMutation = useMarkAllAsRead();

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

  const handleMuteToggle = async (conversationId: string, currentMutedState: boolean) => {
    try {
      await muteConversationMutation.mutateAsync({
        conversationId,
        isMuted: !currentMutedState
      });
      
      toast({
        title: !currentMutedState ? 'Conversa silenciada' : 'Conversa desilenciada',
        description: !currentMutedState 
          ? 'Você não receberá notificações desta conversa' 
          : 'Você voltará a receber notificações desta conversa',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar as configurações de notificação',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllAsRead = async (conversationId: string) => {
    try {
      await markAllAsReadMutation.mutateAsync(conversationId);
      
      toast({
        title: 'Mensagens marcadas como lidas',
        description: 'Todas as mensagens foram marcadas como lidas',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar as mensagens como lidas',
        variant: 'destructive',
      });
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
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <h3 className="font-medium truncate">
                        {conversation.other_participant?.name || 'Usuário Desconhecido'}
                      </h3>
                      {conversation.is_muted && (
                        <VolumeX className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {conversation.unread_count > 0 && (
                        <Badge variant="default" className="text-xs px-1.5 py-0.5">
                          {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatLastMessageTime(conversation)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          {conversation.unread_count > 0 && (
                            <DropdownMenuItem 
                              onClick={() => handleMarkAllAsRead(conversation.id)}
                              disabled={markAllAsReadMutation.isPending}
                            >
                              <CheckCheck className="w-4 h-4 mr-2" />
                              Marcar como lida
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleMuteToggle(conversation.id, conversation.is_muted)}
                            disabled={muteConversationMutation.isPending}
                          >
                            {conversation.is_muted ? (
                              <>
                                <Volume2 className="w-4 h-4 mr-2" />
                                Desilenciar
                              </>
                            ) : (
                              <>
                                <VolumeX className="w-4 h-4 mr-2" />
                                Silenciar
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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