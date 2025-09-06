import { useMemo } from 'react';
import { useSocket } from '@/contexts/SocketContext';

interface UserStatus {
  status: 'online' | 'offline';
  statusText: string;
  note: string;
  dotColor: string;
}

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'Visto agora mesmo';
  } else if (diffMinutes < 60) {
    return `Visto há ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
  } else if (diffHours < 24) {
    return `Visto há ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  } else if (diffDays <= 10) {
    return `Visto há ${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
  } else if (diffDays > 15) {
    return 'Visto há muito tempo';
  }
  
  return `Visto há ${diffDays} dias`;
};

export function useUserPresence() {
  const { onlineUsers, isUserOnline } = useSocket();

  const getUserStatus = (userId: string, lastLogin?: Date | string | null): UserStatus => {
    const isOnline = isUserOnline(userId);
    
    // Debug log
    console.log(`[DEBUG] getUserStatus for ${userId}: isOnline=${isOnline}, onlineUsers size=${onlineUsers.size}`);
    
    if (isOnline) {
      return {
        status: 'online',
        statusText: 'Online',
        note: 'Disponível',
        dotColor: 'bg-green-500'
      };
    }
    
    // User is offline
    let note = 'Offline há muito tempo';
    
    if (lastLogin) {
      const loginDate = typeof lastLogin === 'string' ? new Date(lastLogin) : lastLogin;
      
      // Check if date is valid
      if (!isNaN(loginDate.getTime())) {
        note = formatTimeAgo(loginDate);
      }
    }
    
    return {
      status: 'offline',
      statusText: 'Offline',
      note,
      dotColor: 'bg-gray-400'
    };
  };

  const formatLastSeen = (lastLogin: Date | string | null): string => {
    if (!lastLogin) {
      return 'Nunca visto';
    }
    
    const loginDate = typeof lastLogin === 'string' ? new Date(lastLogin) : lastLogin;
    
    if (isNaN(loginDate.getTime())) {
      return 'Data inválida';
    }
    
    return formatTimeAgo(loginDate);
  };

  return useMemo(() => ({
    isUserOnline,
    getUserStatus,
    formatLastSeen,
    onlineUsers: Array.from(onlineUsers) // For debugging
  }), [onlineUsers]);
}