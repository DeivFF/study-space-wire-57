import React, { useState, useRef, useEffect } from 'react';
import { useConversation } from '@/hooks/useConversations';
import { useMessages, useSendMessage } from '@/hooks/useMessages';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Paperclip, MoreVertical } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { FileUpload } from './FileUpload';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  conversationId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId }) => {
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAuth();
  const { socket, onlineUsers, sendTypingStart, sendTypingStop } = useSocket();
  const { data: conversation, isLoading: conversationLoading } = useConversation(conversationId);
  const { messages, isLoading: messagesLoading, typingUsers, fetchNextPage, hasNextPage } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicators
  const handleTyping = (text: string) => {
    setMessageText(text);

    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      sendTypingStart(conversationId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTypingStop(conversationId);
      }
    }, 1000);
  };

  // Handle message send
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;

    const content = messageText.trim();
    setMessageText('');
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      sendTypingStop(conversationId);
    }

    try {
      await sendMessage.mutateAsync({ content });
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      // Could show toast error here
    }
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  if (conversationLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Conversa não encontrada</p>
      </div>
    );
  }

  const otherParticipant = conversation.participants?.find(p => p.id !== user?.id);
  const isOnline = otherParticipant ? onlineUsers.has(otherParticipant.id) : false;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Avatar className="w-10 h-10">
          <AvatarImage
            src={otherParticipant?.avatar_url}
            alt={otherParticipant?.name}
          />
          <AvatarFallback>
            {otherParticipant?.name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h3 className="font-semibold">
            {otherParticipant?.name || 'Usuário Desconhecido'}
          </h3>
          <div className="flex items-center gap-2">
            <Badge
              variant={isOnline ? "default" : "secondary"}
              className={cn(
                "text-xs px-1.5 py-0.5",
                isOnline && "bg-green-500 hover:bg-green-600"
              )}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              @{otherParticipant?.username}
            </span>
          </div>
        </div>

        <Button variant="ghost" size="icon">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messagesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👋</div>
              <p className="text-muted-foreground">
                Esta é o início da sua conversa com {otherParticipant?.name}.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Envie uma mensagem para começar!
              </p>
            </div>
          ) : (
            <>
              {/* Load more messages button */}
              {hasNextPage && (
                <div className="text-center pb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchNextPage()}
                    className="text-muted-foreground"
                  >
                    Carregar mensagens anteriores
                  </Button>
                </div>
              )}

              {/* Messages */}
              {messages.map((message, index) => {
                const previousMessage = index > 0 ? messages[index - 1] : null;
                const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
                
                const isFirstInGroup = !previousMessage || 
                  previousMessage.sender.id !== message.sender.id ||
                  new Date(message.created_at).getTime() - new Date(previousMessage.created_at).getTime() > 300000; // 5 minutes

                const isLastInGroup = !nextMessage ||
                  nextMessage.sender.id !== message.sender.id ||
                  new Date(nextMessage.created_at).getTime() - new Date(message.created_at).getTime() > 300000; // 5 minutes

                return (
            <MessageBubble
              key={message.id}
              message={message}
              conversationId={conversationId}
              isOwn={message.sender.id === user?.id}
              isFirstInGroup={isFirstInGroup}
              isLastInGroup={isLastInGroup}
            />
                );
              })}
            </>
          )}

          {/* Typing indicator */}
          {typingUsers.size > 0 && (
            <TypingIndicator 
              typingUsers={Array.from(typingUsers)}
              participants={conversation.participants || []}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-border bg-card p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setShowFileUpload(true)}
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <div className="flex-1">
            <Input
              ref={inputRef}
              placeholder="Digite sua mensagem..."
              value={messageText}
              onChange={(e) => handleTyping(e.target.value)}
              disabled={sendMessage.isPending}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <Button
            type="submit"
            size="icon"
            disabled={!messageText.trim() || sendMessage.isPending}
            className="shrink-0"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>

      {/* File Upload Modal */}
      <FileUpload
        conversationId={conversationId}
        isOpen={showFileUpload}
        onClose={() => setShowFileUpload(false)}
      />
    </div>
  );
};