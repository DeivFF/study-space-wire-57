import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export interface User {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  is_archived: boolean;
  other_participant?: User;
  participants?: User[];
  last_message?: {
    id: string;
    content: string;
    message_type: string;
    sender_id: string;
    created_at: string;
  };
  unread_count: number;
  last_read_at?: string;
  is_muted: boolean;
}

const API_BASE_URL = 'http://localhost:3002';

export function useConversations() {
  const { user } = useAuth();
  
  const fetchConversations = async (): Promise<Conversation[]> => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/conversations`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }

    const data = await response.json();
    return data.data;
  };

  return useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    enabled: !!user && !!localStorage.getItem('accessToken'),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

export function useConversation(conversationId: string | null) {
  const { user } = useAuth();
  
  const fetchConversation = async (): Promise<Conversation> => {
    if (!conversationId) throw new Error('Conversation ID is required');
    
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('No access token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conversation');
    }

    const data = await response.json();
    return data.data;
  };

  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: fetchConversation,
    enabled: !!user && !!conversationId && !!localStorage.getItem('accessToken'),
    staleTime: 60000, // 1 minute
  });
}

export function useCreateConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participantId: string) => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participant_id: participantId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create conversation');
      }

      return response.json();
    },
    onSuccess: () => {
      // Refetch conversations list
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useArchiveConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to archive conversation');
      }

      return response.json();
    },
    onSuccess: () => {
      // Refetch conversations list
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useDeleteConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      return response.json();
    },
    onSuccess: () => {
      // Refetch conversations list
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMuteConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, isMuted }: { conversationId: string; isMuted: boolean }) => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/mute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_muted: isMuted }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update mute status');
      }

      return response.json();
    },
    onSuccess: () => {
      // Refetch conversations list
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}