import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Connection {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    nickname?: string;
    avatarUrl?: string;
  };
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

export interface ConnectionRequest {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  receiver_id: string;
  receiver_name: string;
  receiver_email: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface SearchUser {
  id: string;
  name: string;
  email: string;
  nickname?: string;
  avatarUrl?: string;
  connection_status?: 'none' | 'pending' | 'accepted' | 'blocked';
}

const API_BASE_URL = 'http://localhost:3002';

export function useConnectionsList(status: 'accepted' | 'all' = 'all') {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['connections', status],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/connections`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch connections');
      }

      const data = await response.json();
      const connections = data.data as Connection[];
      
      // Filtrar por status se especificado
      if (status === 'accepted') {
        return connections.filter(conn => conn.status === 'accepted');
      }
      
      return connections;
    },
    enabled: !!token,
    staleTime: 30000,
  });
}

export function useConnectionRequests() {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['connection-requests'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/connections/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch connection requests');
      }

      const data = await response.json();
      return data.data as ConnectionRequest[];
    },
    enabled: !!token,
    staleTime: 30000,
  });
}

export function useSearchUsersConnections(query: string) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['search-users-connections', query],
    queryFn: async () => {
      if (!query || query.trim().length < 2) return [];
      
      const response = await fetch(`${API_BASE_URL}/api/connections/search?query=${encodeURIComponent(query.trim())}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data = await response.json();
      return data.data as SearchUser[];
    },
    enabled: !!token && query.trim().length >= 2,
    staleTime: 30000,
  });
}

export function useSendConnectionRequest() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/connections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to send connection request');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['search-users-connections'] });
      toast.success('Solicitação de amizade enviada!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRespondToConnectionRequest() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, response }: { requestId: string; response: 'accepted' | 'rejected' }) => {
      const res = await fetch(`${API_BASE_URL}/api/connections/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.msg || 'Failed to respond to connection request');
      }

      return res.json();
    },
    onSuccess: (_, { response }) => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
      
      if (response === 'accepted') {
        toast.success('Solicitação aceita!');
      } else {
        toast.success('Solicitação rejeitada!');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRemoveConnection() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/connections/${connectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to remove connection');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      toast.success('Amizade removida!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useBlockUser() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/connections/block`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to block user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      toast.success('Usuário bloqueado!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUnblockUser() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/connections/block/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to unblock user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      toast.success('Usuário desbloqueado!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Additional types and functions needed for Profile page
export type ConnectionStatus = 'none' | 'request_sent' | 'request_received' | 'friends' | 'blocked';

// Hook for individual connection management (used in Profile page)
export function useConnections() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendFriendRequest = async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/connections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiverId: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send friend request');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send friend request';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/connections/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'accept' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept friend request');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept friend request';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/connections/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject friend request');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject friend request';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatus = async (userId: string): Promise<ConnectionStatus> => {
    try {
      // Check all connections including pending ones
      const allConnectionsResponse = await fetch(`${API_BASE_URL}/api/connections?status=pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (allConnectionsResponse.ok) {
        const pendingData = await allConnectionsResponse.json();
        const pendingConnections = pendingData.data as Connection[];
        
        // Check for pending requests
        for (const conn of pendingConnections) {
          if ((conn as any).requesterId === userId && (conn as any).receiverId !== userId) {
            return 'request_received';
          }
          if ((conn as any).receiverId === userId && (conn as any).requesterId !== userId) {
            return 'request_sent';
          }
        }
      }

      // Check accepted connections
      const acceptedConnectionsResponse = await fetch(`${API_BASE_URL}/api/connections?status=accepted`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (acceptedConnectionsResponse.ok) {
        const acceptedData = await acceptedConnectionsResponse.json();
        const acceptedConnections = acceptedData.data as Connection[];
        
        const friendship = acceptedConnections.find(conn => conn.user.id === userId);
        if (friendship && friendship.status === 'accepted') {
          return 'friends';
        }
      }

      // Check blocked connections
      const blockedConnectionsResponse = await fetch(`${API_BASE_URL}/api/connections?status=blocked`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (blockedConnectionsResponse.ok) {
        const blockedData = await blockedConnectionsResponse.json();
        const blockedConnections = blockedData.data as Connection[];
        
        const blockedRelation = blockedConnections.find(conn => conn.user.id === userId);
        if (blockedRelation && blockedRelation.status === 'blocked') {
          return 'blocked';
        }
      }

      return 'none';
    } catch (err) {
      console.error('Error checking connection status:', err);
      return 'none';
    }
  };

  return {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getConnectionStatus,
    loading,
    error,
  };
}

