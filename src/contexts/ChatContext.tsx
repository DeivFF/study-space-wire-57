import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ChatState, ChatConversation, ChatMessage } from '@/types/chat';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

interface Friend {
  id: string;
  name: string;
  nickname: string;
  avatarUrl: string | null;
  status: 'online' | 'offline' | 'busy';
}

type ChatAction =
  | { type: 'OPEN_CHAT'; payload: { friend: Friend } }
  | { type: 'CLOSE_CHAT'; payload: { conversationId: string } }
  | { type: 'MINIMIZE_CHAT'; payload: { conversationId: string } }
  | { type: 'MAXIMIZE_CHAT'; payload: { conversationId: string } }
  | { type: 'SEND_MESSAGE'; payload: { conversationId: string; message: ChatMessage } }
  | { type: 'RECEIVE_MESSAGE'; payload: { conversationId: string; message: ChatMessage } }
  | { type: 'MARK_AS_READ'; payload: { conversationId: string } }
  | { type: 'LOAD_CONVERSATIONS'; payload: { conversations: Record<string, ChatConversation> } }
  | { type: 'SET_CURRENT_USER'; payload: { userId: string } }
  | { type: 'RESTORE_ACTIVE_CHATS'; payload: { activeChats: string[] } };

const initialState: ChatState = {
  conversations: {},
  activeChats: [],
  currentUserId: null,
};

// Helper function to generate consistent conversation ID
const generateConversationId = (userId1: string, userId2: string): string => {
  // Sort the IDs to ensure consistent order regardless of who initiates
  const [firstId, secondId] = [userId1, userId2].sort();
  return `${firstId}-${secondId}`;
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'OPEN_CHAT': {
      const { friend } = action.payload;
      const conversationId = generateConversationId(state.currentUserId!, friend.id);
      
      // If conversation doesn't exist, create it
      if (!state.conversations[conversationId]) {
        const newConversation: ChatConversation = {
          id: conversationId,
          friendId: friend.id,
          friendName: friend.name,
          friendNickname: friend.nickname,
          friendAvatarUrl: friend.avatarUrl,
          friendStatus: friend.status,
          messages: [],
          unreadCount: 0,
          isMinimized: false,
          lastActivity: new Date(),
        };
        
        return {
          ...state,
          conversations: {
            ...state.conversations,
            [conversationId]: newConversation,
          },
          activeChats: [...state.activeChats.filter(id => id !== conversationId), conversationId].slice(-3), // Max 3 chats
        };
      }
      
      // If exists but minimized, maximize it
      if (state.conversations[conversationId].isMinimized) {
        return {
          ...state,
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...state.conversations[conversationId],
              isMinimized: false,
            },
          },
          activeChats: [...state.activeChats.filter(id => id !== conversationId), conversationId],
        };
      }
      
      // Move to front if already active
      return {
        ...state,
        activeChats: [...state.activeChats.filter(id => id !== conversationId), conversationId],
      };
    }
    
    case 'CLOSE_CHAT': {
      const { conversationId } = action.payload;
      return {
        ...state,
        activeChats: state.activeChats.filter(id => id !== conversationId),
      };
    }
    
    case 'MINIMIZE_CHAT': {
      const { conversationId } = action.payload;
      if (!state.conversations[conversationId]) return state;
      
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversationId]: {
            ...state.conversations[conversationId],
            isMinimized: true,
          },
        },
      };
    }
    
    case 'MAXIMIZE_CHAT': {
      const { conversationId } = action.payload;
      if (!state.conversations[conversationId]) return state;
      
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversationId]: {
            ...state.conversations[conversationId],
            isMinimized: false,
          },
        },
      };
    }
    
    case 'SEND_MESSAGE': {
      const { conversationId, message } = action.payload;
      if (!state.conversations[conversationId]) return state;
      
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversationId]: {
            ...state.conversations[conversationId],
            messages: [...state.conversations[conversationId].messages, message],
            lastActivity: new Date(),
          },
        },
      };
    }
    
    case 'RECEIVE_MESSAGE': {
      const { conversationId, message } = action.payload;
      if (!state.conversations[conversationId]) return state;
      
      const isMinimized = state.conversations[conversationId].isMinimized;
      const isActive = state.activeChats.includes(conversationId);
      
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversationId]: {
            ...state.conversations[conversationId],
            messages: [...state.conversations[conversationId].messages, message],
            unreadCount: isMinimized || !isActive ? state.conversations[conversationId].unreadCount + 1 : 0,
            lastActivity: new Date(),
          },
        },
      };
    }
    
    case 'MARK_AS_READ': {
      const { conversationId } = action.payload;
      if (!state.conversations[conversationId]) return state;
      
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversationId]: {
            ...state.conversations[conversationId],
            unreadCount: 0,
          },
        },
      };
    }
    
    case 'LOAD_CONVERSATIONS': {
      const { conversations } = action.payload;
      return {
        ...state,
        conversations,
      };
    }
    
    case 'SET_CURRENT_USER': {
      const { userId } = action.payload;
      return {
        ...state,
        currentUserId: userId,
      };
    }
    
    case 'RESTORE_ACTIVE_CHATS': {
      const { activeChats } = action.payload;
      return {
        ...state,
        activeChats,
      };
    }
    
    default:
      return state;
  }
}

interface ChatContextValue {
  state: ChatState;
  openChat: (friend: Friend) => void;
  closeChat: (conversationId: string) => void;
  minimizeChat: (conversationId: string) => void;
  maximizeChat: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string) => void;
  markAsRead: (conversationId: string) => void;
  getTotalUnreadCount: () => number;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { socket, joinConversation, leaveConversation } = useSocket();
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Update currentUserId when user changes
  useEffect(() => {
    if (user?.id && state.currentUserId !== user.id) {
      dispatch({ type: 'SET_CURRENT_USER', payload: { userId: user.id } });
    }
  }, [user?.id, state.currentUserId]);

  // Load conversations and active chats from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      const savedConversations = localStorage.getItem(`chat-conversations-${user.id}`);
      const savedActiveChats = localStorage.getItem(`chat-active-chats-${user.id}`);
      
      if (savedConversations) {
        try {
          const conversations = JSON.parse(savedConversations);
          
          // Clean up conversations with old ID format or invalid data
          const validConversations: Record<string, ChatConversation> = {};
          
          Object.entries(conversations).forEach(([key, conv]: [string, any]) => {
            // Check if conversation ID uses new format (sorted IDs)
            const expectedId = generateConversationId(user.id, conv.friendId);
            if (key === expectedId && conv.friendId && conv.friendName) {
              // Convert date strings back to Date objects
              conv.lastActivity = new Date(conv.lastActivity);
              conv.messages.forEach((msg: any) => {
                msg.timestamp = new Date(msg.timestamp);
              });
              validConversations[key] = conv;
            }
          });
          
          dispatch({ type: 'LOAD_CONVERSATIONS', payload: { conversations: validConversations } });
          
          // Load active chats after conversations are loaded
          if (savedActiveChats) {
            try {
              const activeChats = JSON.parse(savedActiveChats);
              // Filter active chats to only include valid conversation IDs
              const validActiveChats = activeChats.filter((chatId: string) => validConversations[chatId]);
              
              // Set the active chats in state
              dispatch({ type: 'RESTORE_ACTIVE_CHATS', payload: { activeChats: validActiveChats } });
            } catch (error) {
              console.error('Error loading active chats:', error);
              localStorage.removeItem(`chat-active-chats-${user.id}`);
            }
          }
        } catch (error) {
          console.error('Error loading chat conversations:', error);
          // Clear corrupted data
          localStorage.removeItem(`chat-conversations-${user.id}`);
          localStorage.removeItem(`chat-active-chats-${user.id}`);
        }
      }
    }
  }, [user?.id]);

  // Save conversations to localStorage when they change
  useEffect(() => {
    if (user?.id && Object.keys(state.conversations).length > 0) {
      localStorage.setItem(`chat-conversations-${user.id}`, JSON.stringify(state.conversations));
    }
  }, [state.conversations, user?.id]);

  // Save active chats to localStorage when they change
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`chat-active-chats-${user.id}`, JSON.stringify(state.activeChats));
    }
  }, [state.activeChats, user?.id]);

  // Listen for incoming messages via WebSocket
  useEffect(() => {
    const handleMessageReceived = (event: CustomEvent) => {
      const { conversationId, message } = event.detail;
      dispatch({ type: 'RECEIVE_MESSAGE', payload: { conversationId, message } });
    };

    window.addEventListener('chat-message-received', handleMessageReceived as EventListener);
    
    return () => {
      window.removeEventListener('chat-message-received', handleMessageReceived as EventListener);
    };
  }, []);

  // Join active conversations when socket connects
  useEffect(() => {
    if (socket && user?.id && state.activeChats.length > 0) {
      state.activeChats.forEach(conversationId => {
        joinConversation(conversationId);
      });
    }
  }, [socket, user?.id, state.activeChats, joinConversation]);

  const openChat = (friend: Friend) => {
    dispatch({ type: 'OPEN_CHAT', payload: { friend } });
    
    // Join conversation room via WebSocket when opening chat
    if (user?.id && socket) {
      const conversationId = generateConversationId(user.id, friend.id);
      console.log('[CHAT DEBUG] Opening chat:', {
        conversationId,
        friendId: friend.id,
        friendName: friend.name,
        currentUserId: user.id
      });
      joinConversation(conversationId);
    }
  };

  const closeChat = (conversationId: string) => {
    dispatch({ type: 'CLOSE_CHAT', payload: { conversationId } });
    
    // Leave conversation room via WebSocket when closing chat
    if (socket) {
      leaveConversation(conversationId);
    }
  };

  const minimizeChat = (conversationId: string) => {
    dispatch({ type: 'MINIMIZE_CHAT', payload: { conversationId } });
  };

  const maximizeChat = (conversationId: string) => {
    dispatch({ type: 'MAXIMIZE_CHAT', payload: { conversationId } });
  };

  const sendMessage = (conversationId: string, content: string) => {
    if (!user?.id || !content.trim() || !socket) {
      console.warn('[CHAT DEBUG] Cannot send message:', { hasUser: !!user?.id, hasContent: !!content.trim(), hasSocket: !!socket });
      return;
    }

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      senderId: user.id,
      receiverId: state.conversations[conversationId]?.friendId || '',
      content: content.trim(),
      timestamp: new Date(),
      read: false,
      type: 'text',
    };

    console.log('[CHAT DEBUG] Sending message:', {
      conversationId,
      messageId: message.id,
      content: message.content,
      from: message.senderId,
      to: message.receiverId
    });

    // Emitir mensagem via WebSocket
    socket.emit('message:send', {
      conversationId,
      message
    });

    // Atualizar estado local
    dispatch({ type: 'SEND_MESSAGE', payload: { conversationId, message } });
  };

  const markAsRead = (conversationId: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: { conversationId } });
  };

  const getTotalUnreadCount = () => {
    return Object.values(state.conversations).reduce((total, conv) => total + conv.unreadCount, 0);
  };

  const value: ChatContextValue = {
    state,
    openChat,
    closeChat,
    minimizeChat,
    maximizeChat,
    sendMessage,
    markAsRead,
    getTotalUnreadCount,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}