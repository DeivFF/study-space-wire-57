import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  senderId?: string;
  relatedId?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    name: string;
    email: string;
    nickname?: string;
    avatarUrl?: string;
  };
}

const API_BASE_URL = 'http://localhost:3002';

export function useNotifications() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!token) throw new Error('No token available');
      
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      return data.data as Notification[];
    },
    enabled: !!token,
    staleTime: 30000,
    refetchInterval: 60000, // Refetch every minute
  });

  // Listen for real-time notifications and invalidate queries
  useEffect(() => {
    const handleRoomInviteNotification = (event: CustomEvent) => {
      const notification = event.detail;
      
      // Show a toast notification for immediate feedback
      toast.success(`${notification.from.name} te convidou para "${notification.roomName}"!`);
      
      // Invalidate notifications to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    };

    // Listen for custom events dispatched by SocketContext
    window.addEventListener('room-invite-notification', handleRoomInviteNotification as EventListener);
    
    return () => {
      window.removeEventListener('room-invite-notification', handleRoomInviteNotification as EventListener);
    };
  }, [queryClient]);

  return query;
}

export function useNotificationsCount() {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      if (!token) throw new Error('No token available');
      
      const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications count');
      }

      const data = await response.json();
      return data.data.count as number;
    },
    enabled: !!token,
    staleTime: 30000,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkNotificationAsRead() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!token) throw new Error('No token available');
      
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao marcar notificação como lida');
      console.error('Error marking notification as read:', error);
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('No token available');
      
      const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      toast.success('Todas as notificações foram marcadas como lidas');
    },
    onError: (error: Error) => {
      toast.error('Erro ao marcar todas as notificações como lidas');
      console.error('Error marking all notifications as read:', error);
    },
  });
}

export function useDeleteNotification() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!token) throw new Error('No token available');
      
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      toast.success('Notificação excluída');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir notificação');
      console.error('Error deleting notification:', error);
    },
  });
}

export function useAcceptRoomInvite() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      if (!token) {
        console.error('No token available for accepting room invite');
        throw new Error('Você precisa estar logado para aceitar convites');
      }
      
      console.log('Accepting room invite with token:', token ? 'present' : 'missing');
      
      const response = await fetch(`${API_BASE_URL}/api/rooms/invites/${inviteId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Room invite acceptance failed:', errorData);
        throw new Error(errorData.message || errorData.msg || 'Erro interno do servidor');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Convite aceito com sucesso!');
      
      // Redirect to the study room if roomId is provided
      if (data.data && data.data.roomId) {
        navigate(`/sala/${data.data.roomId}`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao aceitar convite: ${error.message}`);
      console.error('Error accepting room invitation:', error);
    },
  });
}

export function useRejectRoomInvite() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      if (!token) {
        console.error('No token available for rejecting room invite');
        throw new Error('Você precisa estar logado para rejeitar convites');
      }
      
      console.log('Rejecting room invite with token:', token ? 'present' : 'missing');
      
      const response = await fetch(`${API_BASE_URL}/api/rooms/invites/${inviteId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Room invite rejection failed:', errorData);
        throw new Error(errorData.message || errorData.msg || 'Erro interno do servidor');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      toast.success('Convite rejeitado');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao rejeitar convite: ${error.message}`);
      console.error('Error rejecting room invitation:', error);
    },
  });
}

export function useAcceptConnectionRequest() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      if (!token) throw new Error('No token available');
      
      const response = await fetch(`${API_BASE_URL}/api/connections/${connectionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'accept' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept connection request');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      toast.success('Solicitação de amizade aceita!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao aceitar solicitação: ${error.message}`);
      console.error('Error accepting connection request:', error);
    },
  });
}

export function useRejectConnectionRequest() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      if (!token) throw new Error('No token available');
      
      const response = await fetch(`${API_BASE_URL}/api/connections/${connectionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject connection request');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      toast.success('Solicitação de amizade rejeitada');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao rejeitar solicitação: ${error.message}`);
      console.error('Error rejecting connection request:', error);
    },
  });
}