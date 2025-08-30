import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ArrowLeft, 
  MoreHorizontal, 
  Send, 
  Sun, 
  Moon, 
  X,
  User,
  BellOff,
  Pin,
  Eraser,
  Trash2,
  Flag,
  ShieldX,
  Check,
  Reply
} from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { useFriends } from '@/hooks/useFriends';
import { useMessages, useSendMessage } from '@/hooks/useMessages';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import './FloatingChat.css';

interface FloatingChatModalProps {
  onClose: () => void;
}

export function FloatingChatModal({ onClose }: FloatingChatModalProps) {
  const [activeTab, setActiveTab] = useState<'conversas' | 'contatos'>('conversas');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 800);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const conversationsQuery = useConversations();
  const { friends, loading: friendsLoading } = useFriends();
  const messagesQuery = useMessages(selectedConversationId);
  const sendMessageMutation = useSendMessage(selectedConversationId);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 800);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const conversations = conversationsQuery?.data || [];
  const conversationsLoading = conversationsQuery?.isLoading || false;
  const messages = messagesQuery?.messages || [];
  const messagesLoading = messagesQuery?.isLoading || false;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]); // Monitor length instead of entire array

  // Auto-scroll when conversation changes
  useEffect(() => {
    if (selectedConversationId && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [selectedConversationId]);

  // Additional scroll effect for immediate feedback after sending
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current && user) {
      const lastMessage = messages[messages.length - 1];
      
      // If the last message was sent by current user, scroll immediately
      if (String(lastMessage.sender.id) === String(user.id)) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    }
  }, [messages, user]);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const selectedFriend = selectedConversation && selectedConversation.other_participant ? 
    friends.find(f => f.id === selectedConversation.other_participant?.id) : null;

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversationId) return;
    
    try {
      const messageData: { content: string; reply_to_id?: string } = {
        content: messageText
      };
      
      // Add reply reference if replying
      if (replyingTo) {
        messageData.reply_to_id = replyingTo.id;
      }
      
      await sendMessageMutation.mutateAsync(messageData);
      setMessageText('');
      setReplyingTo(null);
      
      // Force scroll to bottom after sending
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleReplyToMessage = (message: any) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleViewProfile = (friendId: string) => {
    navigate(`/perfil/${friendId}`);
    onClose();
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderConversationsList = () => {
    if (conversationsLoading) return <div className="chat-loading">Carregando...</div>;
    
    const filteredConversations = conversations.filter(conv => {
      const friend = conv.other_participant ? friends.find(f => f.id === conv.other_participant.id) : null;
      return friend?.name.toLowerCase().includes(searchFilter.toLowerCase());
    });

    if (filteredConversations.length === 0) {
      return (
        <div className="chat-empty-state">
          <div className="chat-empty-title">Sem conversas ainda</div>
          <div className="chat-empty-desc">Quando você adicionar amigos, as conversas aparecerão aqui.</div>
        </div>
      );
    }

    return filteredConversations.map(conversation => {
      const friend = conversation.other_participant ? friends.find(f => f.id === conversation.other_participant.id) : null;
      if (!friend) return null;

      return (
        <div 
          key={conversation.id} 
          className="chat-item"
          onClick={() => setSelectedConversationId(conversation.id)}
        >
          <div className="chat-avatar">
            {friend.avatarUrl ? (
              <img src={friend.avatarUrl} alt={friend.name} />
            ) : (
              <span>{friend.avatar}</span>
            )}
            <span className={`chat-status ${friend.status === 'online' ? '' : 'off'}`}></span>
          </div>
          <div className="chat-item-content">
            <div className="chat-item-name">{friend.name}</div>
            <div className="chat-item-message">
              {conversation.last_message?.content || 'Nova conversa'}
            </div>
          </div>
          <div className="chat-item-time">
            {conversation.updated_at ? formatTime(conversation.updated_at) : ''}
          </div>
        </div>
      );
    });
  };

  const renderContactsList = () => {
    if (friendsLoading) return <div className="chat-loading">Carregando...</div>;
    
    const filteredFriends = friends.filter(friend =>
      friend.name.toLowerCase().includes(searchFilter.toLowerCase())
    );

    return (
      <>
        <div className="chat-section-title">Todos os contatos</div>
        {filteredFriends.map(friend => (
          <div 
            key={friend.id} 
            className="chat-item"
            onClick={() => {
              // Create conversation if it doesn't exist and open it
              const existingConv = conversations.find(c => 
                c.other_participant && c.other_participant.id === friend.id
              );
              if (existingConv) {
                setSelectedConversationId(existingConv.id);
              } else {
                // In a real app, you'd create a new conversation here
                console.log('Create new conversation with', friend.id);
              }
            }}
          >
            <div className="chat-avatar">
              {friend.avatarUrl ? (
                <img src={friend.avatarUrl} alt={friend.name} />
              ) : (
                <span>{friend.avatar}</span>
              )}
              <span className={`chat-status ${friend.status === 'online' ? '' : 'off'}`}></span>
            </div>
            <div className="chat-item-content">
              <div className="chat-item-name">{friend.name}</div>
              <div className="chat-item-message">
                {friend.status === 'online' ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        ))}
      </>
    );
  };

  const renderMessages = () => {
    if (messagesLoading) return <div className="chat-loading">Carregando mensagens...</div>;
    
    if (!user) return <div className="chat-loading">Carregando usuário...</div>;
    
    return (
      <>
        {messages.map(message => {
          const isOwnMessage = String(message.sender.id) === String(user.id);
          const repliedMessage = message.reply_to;
          
          return (
            <div 
              key={message.id} 
              className={`chat-message ${isOwnMessage ? 'sent' : 'received'}`}
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
              
              <div className="chat-message-time">
                {formatTime(message.created_at)}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </>
    );
  };

  return (
    <div className="chat-modal">
      {/* Sidebar */}
      <aside className={`chat-sidebar ${isMobile && selectedConversationId ? 'hidden' : ''}`}>
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-title">
            <div className="chat-title">Estudo+ • Chat</div>
          </div>
          <div className="chat-header-actions">
            <button 
              className="chat-btn-icon" 
              onClick={toggleTheme}
              title="Alternar tema"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button 
              className="chat-btn-icon" 
              onClick={onClose}
              title="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="chat-tabs">
          <button 
            className={`chat-tab ${activeTab === 'conversas' ? 'active' : ''}`}
            onClick={() => setActiveTab('conversas')}
          >
            Conversas
          </button>
          <button 
            className={`chat-tab ${activeTab === 'contatos' ? 'active' : ''}`}
            onClick={() => setActiveTab('contatos')}
          >
            Contatos
          </button>
        </div>

        <div className="chat-search">
          <Search size={16} className="chat-search-icon" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="chat-search-input"
          />
        </div>

        <div className="chat-list">
          {activeTab === 'conversas' ? renderConversationsList() : renderContactsList()}
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className={`chat-main ${!selectedConversationId && !isMobile ? 'empty' : ''} ${isMobile && selectedConversationId ? 'show' : ''}`}>
        {selectedConversationId && selectedFriend ? (
          <>
            <div className="chat-main-header">
              {isMobile && (
                <button 
                  className="chat-btn-icon chat-back-btn"
                  onClick={() => setSelectedConversationId(null)}
                  title="Voltar"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <div className="chat-avatar">
                {selectedFriend.avatarUrl ? (
                  <img src={selectedFriend.avatarUrl} alt={selectedFriend.name} />
                ) : (
                  <span>{selectedFriend.avatar}</span>
                )}
                <span className={`chat-status ${selectedFriend.status === 'online' ? '' : 'off'}`}></span>
              </div>
              <div className="chat-main-info">
                <div className="chat-main-name">{selectedFriend.name}</div>
                <div className="chat-main-presence">
                  {selectedFriend.status === 'online' ? 'Online' : 'Offline'}
                </div>
              </div>
              <div className="chat-main-actions">
                <div className="chat-more-menu">
                  <button 
                    className="chat-btn-icon"
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    title="Mais"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {showMoreMenu && (
                    <div className="chat-menu">
                      <div className="chat-menu-group">
                        <button 
                          className="chat-menu-item"
                          onClick={() => handleViewProfile(selectedFriend.id)}
                        >
                          <User size={16} />
                          <span>Ver perfil</span>
                        </button>
                        <button className="chat-menu-item">
                          <BellOff size={16} />
                          <span>Silenciar notificações</span>
                        </button>
                        <button className="chat-menu-item">
                          <Pin size={16} />
                          <span>Fixar conversa</span>
                        </button>
                      </div>
                      <div className="chat-menu-group">
                        <button className="chat-menu-item">
                          <Eraser size={16} />
                          <span>Limpar conversa</span>
                        </button>
                        <button className="chat-menu-item danger">
                          <Trash2 size={16} />
                          <span>Excluir conversa</span>
                        </button>
                      </div>
                      <div className="chat-menu-group">
                        <button className="chat-menu-item">
                          <Flag size={16} />
                          <span>Denunciar</span>
                        </button>
                        <button className="chat-menu-item danger">
                          <ShieldX size={16} />
                          <span>Bloquear</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="chat-messages" ref={messagesContainerRef}>
              {renderMessages()}
            </div>

            <div className="chat-composer">
              {replyingTo && (
                <div className="chat-reply-preview">
                  <div className="chat-reply-preview-content">
                    <div className="chat-reply-line"></div>
                    <div className="chat-reply-info">
                      <div className="chat-reply-author">
                        Respondendo a {String(replyingTo.sender.id) === String(user?.id) ? 'você mesmo' : selectedFriend?.name}
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
                  placeholder={replyingTo ? "Responder..." : "Digite uma mensagem..."}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="chat-composer-input"
                />
                <button 
                  className="chat-send-btn"
                  onClick={handleSendMessage}
                  title="Enviar"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          !isMobile && (
            <div className="chat-empty-main">
              <div className="chat-empty-title">Selecione uma conversa</div>
              <div className="chat-empty-desc">Escolha uma conversa da lista para começar a trocar mensagens.</div>
            </div>
          )
        )}
      </section>
    </div>
  );
}