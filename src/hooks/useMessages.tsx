import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { User } from './useConversations';

export interface MessageReaction {
  reaction: string;
  count: number;
  users: { id: string; name: string }[];
}

export interface Message {
  id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  reply_to_id?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  sender: User;
  reply_to?: {
    id: string;
    content: string;
    message_type: string;
    sender_name: string;
    created_at: string;
  };
  reactions: MessageReaction[];
  is_read_by_user: boolean;
}

const API_BASE_URL = 'http://localhost:3002';

export function useMessages(conversationId: string | null) {
  const { token } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  const fetchMessages = async ({ pageParam = 0 }) => {
    if (!conversationId) throw new Error('Conversation ID is required');
    
    const response = await fetch(
      `${API_BASE_URL}/api/conversations/${conversationId}/messages?limit=50&offset=${pageParam}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    const data = await response.json();
    return {
      messages: data.data,
      nextOffset: data.pagination.has_more ? pageParam + 50 : null,
    };
  };

  const messagesQuery = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: fetchMessages,
    enabled: !!token && !!conversationId,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    staleTime: 60000,
  });

  // Real-time message handling
  useEffect(() => {
    if (!socket || !conversationId) return;

    // Join the conversation room
    socket.emit('join:conversation', conversationId);

    // Handle new messages
    const handleNewMessage = (message: Message) => {
      queryClient.setQueryData(['messages', conversationId], (oldData: any) => {
        if (!oldData) return oldData;
        
        const firstPage = oldData.pages[0];
        const updatedFirstPage = {
          ...firstPage,
          messages: [...firstPage.messages, message],
        };
        
        return {
          ...oldData,
          pages: [updatedFirstPage, ...oldData.pages.slice(1)],
        };
      });

      // Update conversation's last message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    // Handle message updates
    const handleMessageUpdate = (update: { id: string; content: string; updated_at: string }) => {
      queryClient.setQueryData(['messages', conversationId], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            messages: page.messages.map((message: Message) =>
              message.id === update.id
                ? { ...message, content: update.content, updated_at: update.updated_at }
                : message
            ),
          })),
        };
      });
    };

    // Handle message deletions
    const handleMessageDelete = (deletion: { id: string; deleted_at: string }) => {
      queryClient.setQueryData(['messages', conversationId], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            messages: page.messages.map((message: Message) =>
              message.id === deletion.id
                ? { ...message, content: '[Message deleted]', is_deleted: true }
                : message
            ),
          })),
        };
      });
    };

    // Handle reactions
    const handleReactionAdded = (reaction: { message_id: string; user_id: string; reaction: string }) => {
      // This would need more complex logic to update reactions
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    };

    const handleReactionRemoved = (reaction: { message_id: string; user_id: string; reaction: string }) => {
      // This would need more complex logic to update reactions
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    };

    // Handle typing indicators
    const handleTypingStart = ({ userId }: { userId: string }) => {
      setTypingUsers(prev => new Set([...prev, userId]));
    };

    const handleTypingStop = ({ userId }: { userId: string }) => {
      setTypingUsers(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    };

    // Register event listeners
    socket.on('message:new', handleNewMessage);
    socket.on('message:updated', handleMessageUpdate);
    socket.on('message:deleted', handleMessageDelete);
    socket.on('message:reaction:added', handleReactionAdded);
    socket.on('message:reaction:removed', handleReactionRemoved);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      // Clean up event listeners
      socket.off('message:new', handleNewMessage);
      socket.off('message:updated', handleMessageUpdate);
      socket.off('message:deleted', handleMessageDelete);
      socket.off('message:reaction:added', handleReactionAdded);
      socket.off('message:reaction:removed', handleReactionRemoved);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      
      // Leave the conversation room
      socket.emit('leave:conversation', conversationId);
    };
  }, [socket, conversationId, queryClient]);

  // Flatten messages from all pages
  const messages = messagesQuery.data?.pages.flatMap(page => page.messages) || [];

  return {
    ...messagesQuery,
    messages,
    typingUsers,
  };
}

export function useSendMessage(conversationId: string | null) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, reply_to_id }: { content: string; reply_to_id?: string }) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, reply_to_id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      return response.json();
    },
    // Don't need onSuccess since real-time update handles this
  });
}

export function useUploadFile(conversationId: string | null) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, content }: { file: File; content?: string }) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      
      const formData = new FormData();
      formData.append('file', file);
      if (content) formData.append('content', content);

      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      return response.json();
    },
  });
}

export function useEditMessage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, messageId, content }: { conversationId: string; messageId: string; content: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages/message/${messageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to edit message');
      }

      return response.json();
    },
  });
}

export function useDeleteMessage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, messageId }: { conversationId: string; messageId: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages/message/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete message');
      }

      return response.json();
    },
  });
}

export function useReactToMessage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, messageId, reaction }: { conversationId: string; messageId: string; reaction: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages/message/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reaction }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add reaction');
      }

      return response.json();
    },
  });
}

export function useRemoveReaction() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, messageId, reaction }: { conversationId: string; messageId: string; reaction: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages/message/${messageId}/reactions/${reaction}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove reaction');
      }

      return response.json();
    },
  });
}

export function useMarkAsRead() {
  const { token } = useAuth();

  return useMutation({
    mutationFn: async ({ conversationId, messageId }: { conversationId: string; messageId: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages/message/${messageId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark message as read');
      }

      return response.json();
    },
  });
}

export function useMarkAllAsRead() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages/read-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark all messages as read');
      }

      return response.json();
    },
    onSuccess: (_, conversationId) => {
      // Invalidate messages to update read status
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      // Invalidate conversations to update unread count
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}