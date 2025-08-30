import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type ConnectionStatus = 'none' | 'request_sent' | 'request_received' | 'friends' | 'blocked';

interface Connection {
  id?: string;
  status: ConnectionStatus;
  isLoading: boolean;
}

interface UseConnectionsResult {
  sendFriendRequest: (receiverId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (connectionId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  getConnectionStatus: (userId: string) => Promise<ConnectionStatus>;
  loading: boolean;
  error: string | null;
}

export function useConnections(): UseConnectionsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const makeRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    return response.json();
  }, [token]);

  const sendFriendRequest = useCallback(async (receiverId: string) => {
    setLoading(true);
    setError(null);
    try {
      await makeRequest('http://localhost:3002/api/connections', {
        method: 'POST',
        body: JSON.stringify({ receiverId })
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send friend request';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  const acceptFriendRequest = useCallback(async (requestId: string) => {
    setLoading(true);
    setError(null);
    try {
      await makeRequest(`http://localhost:3002/api/connections/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ action: 'accept' })
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept friend request';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  const rejectFriendRequest = useCallback(async (requestId: string) => {
    setLoading(true);
    setError(null);
    try {
      await makeRequest(`http://localhost:3002/api/connections/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ action: 'reject' })
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject friend request';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  const removeFriend = useCallback(async (connectionId: string) => {
    setLoading(true);
    setError(null);
    try {
      await makeRequest(`http://localhost:3002/api/connections/${connectionId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove friend';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  const blockUser = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      await makeRequest('http://localhost:3002/api/connections/block', {
        method: 'POST',
        body: JSON.stringify({ userId })
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to block user';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  const getConnectionStatus = useCallback(async (userId: string): Promise<ConnectionStatus> => {
    try {
      // Check if there's a connection between users
      const [friendsResponse, requestsResponse] = await Promise.all([
        makeRequest('http://localhost:3002/api/connections?status=accepted'),
        makeRequest('http://localhost:3002/api/connections/requests')
      ]);

      // Check if already friends
      const isFriend = friendsResponse.data.some((conn: any) => 
        conn.user.id === userId
      );
      if (isFriend) return 'friends';

      // Check if there's a pending request from this user
      const receivedRequest = requestsResponse.data.some((req: any) => 
        req.requesterId === userId
      );
      if (receivedRequest) return 'request_received';

      // For request_sent, we need to check outgoing requests
      // This would require a new API endpoint or modification
      // For now, we'll return 'none' and handle it in the component
      
      return 'none';
    } catch (err) {
      console.error('Error getting connection status:', err);
      return 'none';
    }
  }, [makeRequest]);

  return {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    blockUser,
    getConnectionStatus,
    loading,
    error
  };
}