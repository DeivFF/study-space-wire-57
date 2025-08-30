import { useState, useEffect } from 'react';
import { X, ArrowLeft, Send, MessageCircle, Loader2, Plus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConversations, useCreateConversation } from '@/hooks/useConversations';
import { useFriends } from '@/hooks/useFriends';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
  const [showFriendsList, setShowFriendsList] = useState(false);
  const navigate = useNavigate();
  const { data: conversations, isLoading, error } = useConversations();
  const { friends, loading: friendsLoading } = useFriends();
  const createConversationMutation = useCreateConversation();
  
  // Show only the first 5 conversations as preview
  const previewConversations = conversations?.slice(0, 5) || [];

  // Reset friends list view when drawer closes
  useEffect(() => {
    if (!isOpen && showFriendsList) {
      setShowFriendsList(false);
    }
  }, [isOpen, showFriendsList]);

  const formatLastMessageTime = (conversation: any) => {
    const timestamp = conversation.last_message_at || conversation.created_at;
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: false,
        locale: ptBR,
      });
    } catch {
      return '';
    }
  };

  const formatMessagePreview = (conversation: any) => {
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

  const handleViewAllMessages = () => {
    // Open floating chat modal instead of navigating
    onClose();
  };

  const handleConversationClick = (conversationId: string) => {
    // Open floating chat modal with conversation instead of navigating
    onClose();
  };

  const handleStartConversationWithFriend = async (friendId: string) => {
    try {
      const result = await createConversationMutation.mutateAsync(friendId);
      // Open floating chat modal with new conversation instead of navigating
      onClose();
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleShowFriends = () => {
    setShowFriendsList(true);
  };

  const handleBackToConversations = () => {
    setShowFriendsList(false);
  };

  if (!isOpen) return null;

  return (
    <div className={`
      fixed bottom-0 right-4 w-96 h-[600px] bg-background border border-border border-b-0 rounded-t-lg z-50
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      flex flex-col shadow-xl
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          {showFriendsList && (
            <button 
              onClick={handleBackToConversations}
              className="p-1 hover:bg-muted rounded-full transition-colors mr-1"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          {showFriendsList ? (
            <>
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Amigos</h3>
            </>
          ) : (
            <>
              <MessageCircle className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Conversas</h3>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!showFriendsList && (
            <button 
              onClick={handleShowFriends}
              className="p-1 hover:bg-muted rounded-full transition-colors"
              title="Iniciar nova conversa"
            >
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {showFriendsList ? (
          // Friends List
          friendsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : friends.length === 0 ? (
            <div className="p-4 text-center">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-sm text-muted-foreground">Nenhum amigo ainda</p>
              <p className="text-xs text-muted-foreground mt-1">
                Adicione amigos na aba Amigos para iniciar conversas!
              </p>
            </div>
          ) : (
            <div className="p-2">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => handleStartConversationWithFriend(friend.id)}
                  className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer rounded-lg transition-colors w-full text-left border-none bg-transparent"
                  disabled={createConversationMutation.isPending}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={friend.avatarUrl || undefined}
                      alt={friend.name}
                    />
                    <AvatarFallback className="text-sm font-medium">
                      {friend.avatar}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-sm text-foreground truncate">
                        {friend.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-xs text-muted-foreground capitalize">
                          {friend.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      @{friend.nickname}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          // Conversations List
          isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Erro ao carregar conversas</p>
            </div>
          ) : previewConversations.length === 0 ? (
            <div className="p-4 text-center">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique no + para iniciar uma conversa com um amigo!
              </p>
            </div>
          ) : (
            <div className="p-2">
              {previewConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.id)}
                  className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer rounded-lg transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={conversation.other_participant?.avatar_url}
                      alt={conversation.other_participant?.name}
                    />
                    <AvatarFallback className="text-sm font-medium">
                      {conversation.other_participant?.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-sm text-foreground truncate">
                        {conversation.other_participant?.name || 'Usuário Desconhecido'}
                      </h4>
                      <div className="flex items-center gap-1">
                        {conversation.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs px-1.5 py-0.5 min-w-[16px] h-4">
                            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatLastMessageTime(conversation)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {formatMessagePreview(conversation)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        {showFriendsList ? (
          <Button 
            onClick={handleBackToConversations}
            className="w-full"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar às conversas
          </Button>
        ) : (
          <Button 
            onClick={handleViewAllMessages}
            className="w-full"
            variant="outline"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Ver todas as mensagens
          </Button>
        )}
      </div>
    </div>
  );
}