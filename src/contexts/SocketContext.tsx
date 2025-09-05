import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface Notification {
  type: 'friend_request' | 'friend_accepted' | 'friend_rejected' | 'room_invite';
  from: {
    id: string;
    name: string;
    nickname?: string;
    avatarUrl?: string;
  };
  requestId?: string;
  inviteId?: string;
  roomId?: string;
  roomName?: string;
  timestamp: number;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  notifications: Notification[];
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendTypingStart: (conversationId: string) => void;
  sendTypingStop: (conversationId: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendRoomMessage: (roomId: string, message: any) => void;
  sendRoomTypingStart: (roomId: string) => void;
  sendRoomTypingStop: (roomId: string) => void;
  markNotificationAsRead: (index: number) => void;
  clearAllNotifications: () => void;
  isUserOnline: (userId: string) => boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, token } = useAuth();

  const joinConversation = useCallback((conversationId: string) => {
    if (socket) {
      socket.emit('join:conversation', conversationId);
    }
  }, [socket]);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socket) {
      socket.emit('leave:conversation', conversationId);
    }
  }, [socket]);

  const sendTypingStart = useCallback((conversationId: string) => {
    if (socket) {
      socket.emit('typing:start', { conversationId });
    }
  }, [socket]);

  const sendTypingStop = useCallback((conversationId: string) => {
    if (socket) {
      socket.emit('typing:stop', { conversationId });
    }
  }, [socket]);

  const markNotificationAsRead = useCallback((index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    if (socket) {
      socket.emit('room:join', roomId);
    }
  }, [socket]);

  const leaveRoom = useCallback((roomId: string) => {
    if (socket) {
      socket.emit('room:leave', roomId);
    }
  }, [socket]);

  const sendRoomMessage = useCallback((roomId: string, message: any) => {
    if (socket) {
      socket.emit('room:message', { roomId, message });
    }
  }, [socket]);

  const sendRoomTypingStart = useCallback((roomId: string) => {
    if (socket) {
      socket.emit('room:typing_start', { roomId });
    }
  }, [socket]);

  const sendRoomTypingStop = useCallback((roomId: string) => {
    if (socket) {
      socket.emit('room:typing_stop', { roomId });
    }
  }, [socket]);

  useEffect(() => {
    if (user && token) {
      console.log('Connecting to WebSocket server...');
      console.log('Using token for WebSocket:', token?.substring(0, 50) + '...');
      
      const newSocket = io('http://localhost:3002', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        console.log('Connected to WebSocket server');
        setIsConnected(true);
      });

      // Initialize online users list when connecting
      newSocket.on('users:online_list', ({ userIds }: { userIds: string[] }) => {
        console.log('Received online users list:', userIds);
        setOnlineUsers(new Set(userIds));
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error.message);
        setIsConnected(false);
      });

      // Handle user presence events
      newSocket.on('user:online', ({ userId }: { userId: string }) => {
        setOnlineUsers(prev => new Set([...prev, userId]));
      });

      newSocket.on('user:offline', ({ userId }: { userId: string }) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          updated.delete(userId);
          return updated;
        });
      });

      // Handle friend notifications
      newSocket.on('notification:friend_request', (notification: Notification) => {
        console.log('Received friend request notification:', notification);
        setNotifications(prev => [notification, ...prev]);
      });

      newSocket.on('notification:friend_accepted', (notification: Notification) => {
        console.log('Received friend accepted notification:', notification);
        setNotifications(prev => [notification, ...prev]);
      });

      newSocket.on('notification:friend_rejected', (notification: Notification) => {
        console.log('Received friend rejected notification:', notification);
        setNotifications(prev => [notification, ...prev]);
      });

      // Handle room invite notifications
      newSocket.on('notification:room_invite', (notification: Notification) => {
        console.log('Received room invite notification:', notification);
        setNotifications(prev => [notification, ...prev]);
        
        // Dispatch custom event for other components to listen
        window.dispatchEvent(new CustomEvent('room-invite-notification', { 
          detail: notification 
        }));
      });

      // Handle chat messages
      newSocket.on('message:receive', (data: { conversationId: string; message: any }) => {
        console.log('[SOCKET DEBUG] Received chat message:', {
          conversationId: data.conversationId,
          messageId: data.message.id,
          content: data.message.content,
          from: data.message.senderId,
          to: data.message.receiverId
        });
        
        // Convert timestamp back to Date object
        const messageWithDate = {
          ...data.message,
          timestamp: new Date(data.message.timestamp)
        };
        
        // Dispatch custom event for ChatContext to listen
        window.dispatchEvent(new CustomEvent('chat-message-received', {
          detail: {
            conversationId: data.conversationId,
            message: messageWithDate
          }
        }));
      });

      // Handle room role changes
      newSocket.on('room:member_role_changed', (data: { roomId: string; memberId: string; newRole: string; action: string; timestamp: number }) => {
        console.log('Received room member role change:', data);
        
        // Dispatch custom event for other components to listen
        window.dispatchEvent(new CustomEvent('room-member-role-changed', { 
          detail: data 
        }));
      });

      newSocket.on('room:role_updated', (data: { roomId: string; newRole: string; action: string; timestamp: number }) => {
        console.log('Received personal role update:', data);
        
        // Dispatch custom event for other components to listen
        window.dispatchEvent(new CustomEvent('room-role-updated', { 
          detail: data 
        }));
      });

      setSocket(newSocket);

      return () => {
        console.log('Cleaning up WebSocket connection');
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
      };
    } else {
      // User logged out, clean up socket
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
        setNotifications([]);
      }
    }
  }, [user, token]);

  const isUserOnline = useCallback((userId: string): boolean => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  const value: SocketContextType = {
    socket,
    isConnected,
    onlineUsers,
    notifications,
    joinConversation,
    leaveConversation,
    sendTypingStart,
    sendTypingStop,
    joinRoom,
    leaveRoom,
    sendRoomMessage,
    sendRoomTypingStart,
    sendRoomTypingStop,
    markNotificationAsRead,
    clearAllNotifications,
    isUserOnline
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}