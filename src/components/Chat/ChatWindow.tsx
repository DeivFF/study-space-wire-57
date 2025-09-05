import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Minus, ChevronUp, X, Send } from 'lucide-react';
import { ChatConversation } from '@/types/chat';
import { useChat } from '@/contexts/ChatContext';
import './FloatingChat.css';

interface ChatWindowProps {
  conversation: ChatConversation;
  position: { right: number };
}

// Avatar options mapping (same as in FeedHeader and FriendsDropdown)
const avatarOptions = [
  { id: 'a1', bg: '#FEE2E2', fg: '#991B1B', emoji: '😀' },
  { id: 'a2', bg: '#E0F2FE', fg: '#075985', emoji: '😎' },
  { id: 'a3', bg: '#ECFDF5', fg: '#065F46', emoji: '👋' },
  { id: 'a4', bg: '#FFF7ED', fg: '#9A3412', emoji: '✨' },
  { id: 'a5', bg: '#EEF2FF', fg: '#3730A3', emoji: '👩‍🎓' },
  { id: 'a6', bg: '#FAE8FF', fg: '#86198F', emoji: '👾' },
  { id: 'a7', bg: '#F0FDFA', fg: '#155E75', emoji: '🤩' },
  { id: 'a8', bg: '#F5F5F4', fg: '#1C1917', emoji: '💻' },
  { id: 'a9', bg: '#E9D5FF', fg: '#6B21A8', emoji: '🔥' },
  { id: 'a10', bg: '#DCFCE7', fg: '#166534', emoji: '🌱' },
  { id: 'a11', bg: '#FFE4E6', fg: '#9F1239', emoji: '💜' },
  { id: 'a12', bg: '#E2E8F0', fg: '#0F172A', emoji: '🔍' }
];

const getAvatarEmoji = (avatarId: string) => {
  const avatar = avatarOptions.find(option => option.id === avatarId);
  return avatar ? avatar.emoji : '👤';
};

export function ChatWindow({ conversation, position }: ChatWindowProps) {
  const { closeChat, minimizeChat, maximizeChat, sendMessage, markAsRead } = useChat();
  const [message, setMessage] = useState('');
  
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [conversation.messages]);

  // Mark as read when window is not minimized and gains focus
  useEffect(() => {
    if (!conversation.isMinimized && conversation.unreadCount > 0) {
      markAsRead(conversation.id);
    }
  }, [conversation.isMinimized, conversation.unreadCount, conversation.id, markAsRead]);

  // Focus input when maximized
  useEffect(() => {
    if (!conversation.isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversation.isMinimized]);

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage(conversation.id, message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    if (e.key === 'Escape') {
      closeChat(conversation.id);
    }
  };


  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getPresenceText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'busy':
        return 'Ocupado';
      default:
        return 'Offline';
    }
  };

  return (
    <div
      className={`fixed bottom-[18px] w-[380px] border rounded-2xl shadow-2xl z-[1000] transition-all duration-200 overflow-hidden ${
        conversation.isMinimized ? 'h-auto' : 'h-[520px]'
      } animate-in slide-in-from-bottom-2`}
      style={{ 
        right: position.right,
        background: 'hsl(var(--card))',
        borderColor: 'hsl(var(--border))'
      }}
    >
      {/* Header */}
      <header className="chat-main-header">
        {/* Avatar */}
        <div className="chat-avatar">
          {conversation.friendAvatarUrl ? (
            conversation.friendAvatarUrl.startsWith('a') ? (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                {getAvatarEmoji(conversation.friendAvatarUrl)}
              </div>
            ) : (
              <img
                src={conversation.friendAvatarUrl}
                alt={conversation.friendName}
                className="w-full h-full rounded-full object-cover"
              />
            )
          ) : (
            <span className="text-sm">{conversation.friendName.charAt(0).toUpperCase()}</span>
          )}
          <span className={`chat-status ${conversation.friendStatus === 'online' ? '' : 'off'}`}></span>
        </div>

        {/* User Info */}
        <div className="chat-main-info">
          <div className="chat-main-name">
            {conversation.friendName}
          </div>
          <div className="chat-main-presence">
            {getPresenceText(conversation.friendStatus)}
          </div>
        </div>

        {/* Actions */}
        <div className="chat-main-actions">
          <button
            onClick={() => conversation.isMinimized ? maximizeChat(conversation.id) : minimizeChat(conversation.id)}
            className="chat-btn-icon"
            title={conversation.isMinimized ? "Maximizar" : "Minimizar"}
          >
            {conversation.isMinimized ? (
              <ChevronUp size={16} />
            ) : (
              <Minus size={16} />
            )}
          </button>
          
          <button
            onClick={() => closeChat(conversation.id)}
            className="chat-btn-icon"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {!conversation.isMinimized && (
        <>
          {/* Messages Thread */}
          <div
            ref={threadRef}
            className="chat-messages"
            style={{ height: 'calc(520px - 60px - 80px)' }} // Total - header - composer
          >
            {conversation.messages.length === 0 ? (
              <div className="chat-empty-main">
                <div className="chat-empty-title">💬</div>
                <div className="chat-empty-desc">
                  Início da conversa com {conversation.friendName}
                </div>
              </div>
            ) : (
              conversation.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${
                    msg.senderId === conversation.friendId ? 'received' : 'sent'
                  }`}
                >
                  <div className="chat-message-content">
                    <div className="chat-message-bubble">
                      {msg.content}
                    </div>
                  </div>
                  <div className="chat-message-time">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Composer */}
          <div className="chat-composer">
            <div className="chat-composer-input-area">
              <input
                ref={inputRef}
                type="text"
                placeholder="Digite uma mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="chat-composer-input"
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="chat-send-btn"
                style={{ opacity: !message.trim() ? 0.5 : 1 }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}