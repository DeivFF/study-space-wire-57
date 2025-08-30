import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Reply, Smile, Copy, Edit, Trash2, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Message, useReactToMessage, useRemoveReaction } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { EmojiPicker } from './EmojiPicker';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  conversationId: string;
  isOwn: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  conversationId,
  isOwn,
  isFirstInGroup,
  isLastInGroup,
}) => {
  const { user } = useAuth();
  const reactToMessage = useReactToMessage();
  const removeReaction = useRemoveReaction();
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const formatTimeDistance = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return '';
    }
  };

  const renderMessageContent = () => {
    if (message.is_deleted) {
      return (
        <p className="text-muted-foreground italic text-sm">
          {message.content}
        </p>
      );
    }

    switch (message.message_type) {
      case 'image':
        return (
          <div className="space-y-2">
            {message.content && (
              <p className="text-sm">{message.content}</p>
            )}
            <div className="relative max-w-sm">
              <img
                src={`http://localhost:3002${message.file_url}`}
                alt={message.file_name || 'Imagem'}
                className="rounded-lg max-w-full h-auto"
                loading="lazy"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  // Handle download
                  if (message.file_url) {
                    window.open(`http://localhost:3002${message.file_url}`, '_blank');
                  }
                }}
              >
                <Download className="w-3 h-3" />
              </Button>
            </div>
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            {message.content && (
              <p className="text-sm">{message.content}</p>
            )}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-xs font-medium">
                  {message.file_name?.split('.').pop()?.toUpperCase() || 'FILE'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {message.file_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {message.file_size && `${(message.file_size / 1024 / 1024).toFixed(1)} MB`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (message.file_url) {
                    window.open(`http://localhost:3002${message.file_url}`, '_blank');
                  }
                }}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            {message.reply_to && (
              <div className="border-l-2 border-primary/50 pl-3 py-1 bg-muted/30 rounded-sm text-xs">
                <p className="font-medium text-muted-foreground">
                  {message.reply_to.sender_name}
                </p>
                <p className="text-muted-foreground truncate">
                  {message.reply_to.content}
                </p>
              </div>
            )}
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        );
    }
  };

  const handleAddReaction = async (emoji: string) => {
    try {
      await reactToMessage.mutateAsync({ conversationId, messageId: message.id, reaction: emoji });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleToggleReaction = async (emoji: string) => {
    if (!user) return;

    // Check if user has already reacted with this emoji
    const reaction = message.reactions.find(r => r.reaction === emoji);
    const hasReacted = reaction?.users.some(u => u.id === user.id);

    try {
      if (hasReacted) {
        await removeReaction.mutateAsync({ conversationId, messageId: message.id, reaction: emoji });
      } else {
        await reactToMessage.mutateAsync({ conversationId, messageId: message.id, reaction: emoji });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {message.reactions.map((reaction) => {
          const hasReacted = user ? reaction.users.some(u => u.id === user.id) : false;
          
          return (
            <Button
              key={reaction.reaction}
              variant={hasReacted ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-6 px-2 text-xs transition-colors",
                hasReacted
                  ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                  : "bg-muted/50 hover:bg-muted"
              )}
              onClick={() => handleToggleReaction(reaction.reaction)}
              title={`Reagido por: ${reaction.users.map(u => u.name).join(', ')}`}
            >
              <span>{reaction.reaction}</span>
              {reaction.count > 1 && (
                <span className="ml-1 text-current opacity-70">{reaction.count}</span>
              )}
            </Button>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'group flex items-start gap-2',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        !isFirstInGroup && (isOwn ? 'ml-10' : 'mr-10')
      )}
    >
      {/* Avatar */}
      {!isOwn && isFirstInGroup && (
        <Avatar className="w-8 h-8">
          <AvatarImage
            src={message.sender.avatar_url}
            alt={message.sender.name}
          />
          <AvatarFallback className="text-xs">
            {message.sender.name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Spacer for grouped messages */}
      {!isOwn && !isFirstInGroup && <div className="w-8" />}

      {/* Message content */}
      <div
        className={cn(
          'flex-1 max-w-[70%] space-y-1',
          isOwn && 'flex flex-col items-end'
        )}
      >
        {/* Sender name and timestamp */}
        {!isOwn && isFirstInGroup && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {message.sender.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.created_at)}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'relative rounded-lg px-3 py-2 max-w-full',
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted',
            isFirstInGroup && !isOwn && 'rounded-tl-sm',
            isFirstInGroup && isOwn && 'rounded-tr-sm',
            isLastInGroup && !isOwn && 'rounded-bl-sm',
            isLastInGroup && isOwn && 'rounded-br-sm'
          )}
        >
          {renderMessageContent()}

          {/* Message actions */}
          <div
            className={cn(
              'absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1',
              isOwn ? '-left-20' : '-right-20'
            )}
          >
            <EmojiPicker
              onSelect={handleAddReaction}
              trigger={
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Smile className="w-3 h-3" />
                </Button>
              }
            />
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Reply className="w-3 h-3" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? "end" : "start"}>
                <DropdownMenuItem>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Reply className="w-4 h-4 mr-2" />
                  Responder
                </DropdownMenuItem>
                {isOwn && !message.is_deleted && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Timestamp for own messages */}
          {isOwn && isLastInGroup && (
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className="text-xs opacity-70">
                {formatTime(message.created_at)}
              </span>
              {message.is_read_by_user && (
                <div className="w-1 h-1 bg-current rounded-full opacity-70" />
              )}
            </div>
          )}
        </div>

        {/* Reactions */}
        {renderReactions()}

        {/* Edited indicator */}
        {message.updated_at !== message.created_at && (
          <p className="text-xs text-muted-foreground">
            editado {formatTimeDistance(message.updated_at)}
          </p>
        )}
      </div>
    </div>
  );
};