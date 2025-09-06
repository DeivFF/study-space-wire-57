import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';

interface Friend {
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  avatarUrl: string | null;
  status: 'online' | 'offline';
}

interface FriendConnection {
  id: string;
  requesterId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    nickname: string;
    avatarUrl: string;
    status: string;
  };
}

interface FriendsResponse {
  success: boolean;
  message: string;
  data: FriendConnection[];
}

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const { onlineUsers } = useSocket();

  const fetchFriends = useCallback(async () => {
    if (!token) {
      setError('No access token found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3002/api/connections?status=accepted', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed');
        }
        if (response.status === 403) {
          throw new Error('Access forbidden');
        }
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data: FriendsResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch friends');
      }

      const friendsData: Friend[] = data.data.map((connection) => ({
        id: connection.user.id,
        name: connection.user.name,
        nickname: connection.user.nickname || 'user',
        avatar: connection.user.name.charAt(0).toUpperCase(),
        avatarUrl: connection.user.avatarUrl,
        status: onlineUsers.has(connection.user.id) ? 'online' : 'offline'
      }));

      setFriends(friendsData);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Retry function
  const retry = useCallback(() => {
    fetchFriends();
  }, [fetchFriends]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Update friend statuses when online users change
  useEffect(() => {
    if (friends.length > 0) {
      setFriends(prevFriends => 
        prevFriends.map(friend => ({
          ...friend,
          status: onlineUsers.has(friend.id) ? 'online' : 'offline'
        }))
      );
    }
  }, [onlineUsers]);

  return {
    friends,
    loading,
    error,
    retry,
    refetch: fetchFriends
  };
}