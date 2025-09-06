import { useState, useEffect, useRef } from 'react';
import { Send, Reply, MoreHorizontal, MessageSquare, Users, Check, CheckCheck, X } from 'lucide-react';
import { useRoomMessages, useSendRoomMessage, useRoomMessagesWebSocket } from '@/hooks/useRooms';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { toast } from 'sonner';
import { getReadStatusText } from '@/utils/timeUtils';
import '../Chat/FloatingChat.css';

interface GroupChatProps {
  roomId: string | null;
  roomName?: string;
  memberCount?: number;
}

interface GroupMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender_name: string;
  reply_to_id?: string;
  reply_to?: {
    id: string;
    content: string;
    sender_name: string;
  };
}

export function GroupChat({ roomId, roomName = "Sala de Estudo", memberCount = 0 }: GroupChatProps) {
  const [messageText, setMessageText] = useState('');
  const [replyingTo, setReplyingTo] = useState<GroupMessage | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement }>({});

  const { data: messages = [], isLoading } = useRoomMessages(roomId);
  const sendMessageMutation = useSendRoomMessage();
  const { user } = useAuth();
  const { friends } = useFriends();
  
  // Use WebSocket hook for real-time updates and ownership changes
  const { typingUsers } = useRoomMessagesWebSocket(roomId);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 50);
    }
  }, [messages.length]);

  // Additional scroll effect for immediate feedback after sending
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current && user) {
      const lastMessage = messages[messages.length - 1];
      
      // If the last message was sent by current user, scroll immediately
      if (String(lastMessage.sender_id) === String(user.id)) {
        setTimeout(() => {
          const container = messagesContainerRef.current;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }, 100);
      }
    }
  }, [messages, user]);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  // Auto-mark messages as read when they become visible (for group chats, this is more of a visual indicator)
  useEffect(() => {
    if (!user || !roomId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && (entry.target as HTMLElement).dataset.messageId) {
            const messageId = (entry.target as HTMLElement).dataset.messageId;
            const message = messages.find(m => m.id === messageId);
            
            // For group chats, we could potentially mark messages as "seen" 
            // but for now we'll just use this for visual feedback
            if (message && String(message.sender_id) !== String(user.id)) {
              // Could add logic here to track which messages user has seen
              console.log('Message viewed:', messageId);
            }
          }
        });
      },
      {
        root: messagesContainerRef.current,
        rootMargin: '0px',
        threshold: 0.5
      }
    );

    // Observe all message elements
    Object.values(messageRefs.current).forEach((messageElement) => {
      if (messageElement) {
        observer.observe(messageElement);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [messages, user, roomId]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !roomId) return;
    
    try {
      await sendMessageMutation.mutateAsync({
        roomId,
        content: messageText,
        reply_to_id: replyingTo?.id
      });
      
      setMessageText('');
      setReplyingTo(null);
      
      // Force scroll to bottom after sending
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 150);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleReplyToMessage = (message: GroupMessage) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleMarkAllAsRead = () => {
    // For group chats, we just show a toast as there's no specific API endpoint
    toast.success('Mensagens marcadas como lidas');
    setShowMoreMenu(false);
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessages = () => {
    if (isLoading) return <div className="chat-loading">Carregando mensagens...</div>;
    
    if (!user) return <div className="chat-loading">Carregando usuário...</div>;
    
    if (messages.length === 0) {
      return (
        <div className="chat-empty-state">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
          <div className="chat-empty-title">Nenhuma mensagem ainda</div>
          <div className="chat-empty-desc">Seja o primeiro a enviar uma mensagem para o grupo!</div>
        </div>
      );
    }
    
    return (
      <>
        {messages.map((message) => {
          const isOwnMessage = String(message.sender_id) === String(user.id);
          const repliedMessage = message.reply_to;
          const isFriend = friends.some(friend => friend.id === message.sender_id);
          const senderFriend = friends.find(friend => friend.id === message.sender_id);
          
          return (
            <div 
              key={message.id}
              ref={(el) => {
                if (el) {
                  messageRefs.current[message.id] = el;
                }
              }}
              data-message-id={message.id}
              className={`chat-message ${isOwnMessage ? 'sent' : 'received'} ${isFriend && !isOwnMessage ? 'friend-message' : ''}`}
            >
              {repliedMessage && (
                <div className="chat-reply-reference">
                  <div className="chat-reply-line"></div>
                  <div className="chat-reply-content">
                    <div className="chat-reply-author">
                      {repliedMessage.sender_name || 'Usuário'}
                    </div>
                    <div className="chat-reply-text">{repliedMessage.content}</div>
                  </div>
                </div>
              )}
              
              <div className="chat-message-main">
                {/* Avatar circle for friends */}
                {isFriend && !isOwnMessage && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary shadow-sm bg-card transition-transform hover:scale-105">
                    {senderFriend?.avatarUrl ? (
                      <img 
                        src={senderFriend.avatarUrl} 
                        alt={message.sender_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs sm:text-sm">
                        {senderFriend?.avatar || message.sender_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="chat-message-content">
                  <div className="chat-message-bubble">
                    {message.content}
                  </div>
                  <button 
                    className="chat-reply-btn"
                    onClick={() => handleReplyToMessage(message)}
                    title="Responder"
                  >
                    <Reply size={14} />
                  </button>
                </div>
              </div>
              
              <div className="chat-message-time">
                {formatTime(message.created_at)}
                {/* Read indicator for sent messages (simplified for group chat) */}
                {isOwnMessage && (
                  <span className="ml-2 inline-flex flex-col items-end">
                    <CheckCheck size={12} className="text-blue-500" />
                    {/* For group chats, we could show "seen by X people" but keeping it simple for now */}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </>
    );
  };

  return (
    <section className="chat-main group-chat">
      {/* Group Chat Header */}
      <div className="chat-main-header">
        <div className="chat-avatar group-chat-avatar">
          <MessageSquare size={18} />
        </div>
        <div className="chat-main-info">
          <div className="chat-main-name">{roomName}</div>
          <div className="chat-main-presence">
            <Users size={12} className="inline mr-1" />
            {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
          </div>
        </div>
        <div className="chat-main-actions">
          <div className="chat-more-menu relative" ref={moreMenuRef}>
            <button 
              className="chat-btn-icon"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              title="Mais opções"
            >
              <MoreHorizontal size={16} />
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border rounded-lg shadow-lg py-1 z-50 min-w-[180px]">
                <button
                  onClick={handleMarkAllAsRead}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center gap-2"
                >
                  <Check size={14} />
                  Marcar como lidas
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages group-chat-messages" ref={messagesContainerRef}>
        {renderMessages()}
      </div>

      {/* Message Composer */}
      <div className="chat-composer">
        {replyingTo && (
          <div className="chat-reply-preview">
            <div className="chat-reply-preview-content">
              <div className="chat-reply-line"></div>
              <div className="chat-reply-info">
                <div className="chat-reply-author">
                  Respondendo a {String(replyingTo.sender_id) === String(user?.id) ? 'você mesmo' : replyingTo.sender_name}
                </div>
                <div className="chat-reply-text">{replyingTo.content}</div>
              </div>
            </div>
            <button 
              className="chat-reply-cancel"
              onClick={cancelReply}
              title="Cancelar resposta"
            >
              <X size={14} />
            </button>
          </div>
        )}
        
        <div className="chat-composer-input-area">
          <input
            type="text"
            placeholder={replyingTo ? "Responder ao grupo..." : "Mensagem para o grupo..."}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="chat-composer-input"
          />
          <button 
            className="chat-send-btn"
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            title="Enviar"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}