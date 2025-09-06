import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'sonner';

export interface Room {
  id: string;
  name: string;
  description: string;
  code: string;
  visibility: 'public' | 'private';
  owner_id: string;
  owner_name: string;
  member_count: number;
  max_members: number;
  is_favorited: boolean;
  is_member: boolean;
  user_role?: 'owner' | 'moderator' | 'member';
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'moderator' | 'member';
  is_favorited: boolean;
  joined_at: string;
}

export interface Invite {
  id: string;
  invited_user_id: string;
  invited_user_name: string;
  invited_user_email: string;
  invited_by_name: string;
  status: 'pending' | 'accepted' | 'revoked';
  created_at: string;
}

export interface AccessRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface InviteLink {
  id: string;
  code: string;
  link: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

const API_BASE_URL = 'http://localhost:3002';

export function useRooms(filter: 'all' | 'mine' = 'all', search = '', visibility: 'all' | 'public' | 'private' = 'all') {
  const { authenticatedFetch } = useAuth();
  
  return useQuery({
    queryKey: ['rooms', filter, search, visibility],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('filter', filter);
      if (search) params.append('search', search);
      if (visibility !== 'all') params.append('visibility', visibility);

      const response = await authenticatedFetch(`${API_BASE_URL}/api/rooms?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }

      const data = await response.json();
      return data.items as Room[];
    },
    enabled: true,
    staleTime: 30000,
  });
}

export function useRoom(roomId: string | null) {
  const { authenticatedFetch } = useAuth();
  
  return useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      if (!roomId) throw new Error('Room ID is required');
      
      // First, try to get room info from the list of rooms where user is member
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rooms?filter=mine`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('useRoom API error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`Failed to fetch room: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const room = data.items?.find((r: Room) => r.id === roomId);
      
      if (!room) {
        throw new Error('Room not found or user is not a member');
      }
      
      return room as Room;
    },
    enabled: !!roomId,
    staleTime: 30000,
    retry: 1, // Only retry once for room access validation
  });
}

export function useCreateRoom() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomData: { nome: string; descricao: string; visibilidade: 'public' | 'private' }) => {
      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to create room');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Sala criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useJoinRoom() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [pendingRoom, setPendingRoom] = useState<any>(null);

  return useMutation({
    mutationFn: async (roomId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Se requer permissão, armazenar info da sala
        if (error.requiresPermission || error.requiresFriendship) {
          setPendingRoom(error.roomInfo);
          throw new Error(JSON.stringify(error));
        }
        
        throw new Error(error.msg || 'Failed to join room');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Entrou na sala com sucesso!');
      setPendingRoom(null);
    },
    onError: (error: Error) => {
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj.requiresPermission || errorObj.requiresFriendship) {
          // Não mostrar toast de erro - será tratado pelo modal
          return;
        }
      } catch {
        // Error normal
      }
      toast.error(error.message);
    },
    meta: {
      pendingRoom,
      setPendingRoom
    }
  });
}

export function useRequestAccess() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, message }: { roomId: string; message?: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/request-access`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to request access');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Solicitação de acesso enviada!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useApproveAccessRequest() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, requestId }: { roomId: string; requestId: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/access-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to approve access request');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Solicitação aprovada!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRejectAccessRequest() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, requestId }: { roomId: string; requestId: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/access-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to reject access request');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Solicitação rejeitada!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useToggleFavorite() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/favorite`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to toggle favorite');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRoomMembers(roomId: string | null) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['room-members', roomId],
    queryFn: async () => {
      if (!roomId) throw new Error('Room ID is required');
      
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch room members');
      }

      const data = await response.json();
      return data.items as Member[];
    },
    enabled: !!token && !!roomId,
    staleTime: 30000,
  });
}

export function useLeaveRoom() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      let lastError: Error | null = null;
      
      // Retry logic para casos de erro temporário
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/leave`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ msg: 'Erro desconhecido' }));
            const errorMessage = error.msg || `Erro ${response.status}: ${response.statusText}`;
            
            // Log detalhado para debugging
            console.error(`[LeaveRoom] Attempt ${attempt} failed:`, {
              status: response.status,
              statusText: response.statusText,
              error: errorMessage,
              roomId,
              timestamp: new Date().toISOString()
            });
            
            lastError = new Error(errorMessage);
            
            // Se é erro 500 e não é a última tentativa, aguardar antes de retry
            if (response.status === 500 && attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              continue;
            }
            
            throw lastError;
          }

          // Handle 204 No Content response
          if (response.status === 204) {
            return { roomId };
          }
          return response.json();
          
        } catch (networkError) {
          lastError = networkError as Error;
          console.error(`[LeaveRoom] Network error on attempt ${attempt}:`, networkError);
          
          // Se é erro de rede e não é a última tentativa, retry
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          
          throw lastError;
        }
      }
      
      throw lastError || new Error('Falha ao sair da sala após múltiplas tentativas');
    },
    onSuccess: (data) => {
      const { roomId } = data;
      
      // Invalidate all room-related queries
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-members'] });
      queryClient.invalidateQueries({ queryKey: ['room-messages'] });
      
      toast.success('Saiu da sala com sucesso!');
    },
    onError: (error: Error) => {
      console.error('[LeaveRoom] Final error:', error);
      
      // Mensagem de erro mais específica
      let errorMessage = 'Erro desconhecido ao sair da sala';
      
      if (error.message.includes('500')) {
        errorMessage = 'Erro interno do servidor. Tente novamente em alguns instantes.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Sala não encontrada ou você já não é membro.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Você não tem permissão para sair desta sala.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Problema de conexão. Verifique sua internet.';
      } else if (error.message !== 'Failed to leave room') {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
    retry: false, // Desabilitar retry automático do React Query já que implementamos nosso próprio
  });
}

export function useDeleteRoom() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to delete room');
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return { roomId };
      }
      return response.json();
    },
    onSuccess: (data) => {
      const { roomId } = data;
      
      // Remove room data from cache immediately
      queryClient.removeQueries({ queryKey: ['room', roomId] });
      queryClient.removeQueries({ queryKey: ['room-members', roomId] });
      queryClient.removeQueries({ queryKey: ['room-messages', roomId] });
      queryClient.removeQueries({ queryKey: ['room-invites', roomId] });
      
      // Invalidate room lists to remove the deleted room
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      
      toast.success('Sala excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hooks para Convites
export function useRoomInvites(roomId: string | null) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['room-invites', roomId],
    queryFn: async () => {
      if (!roomId) throw new Error('Room ID is required');
      
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/invites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch room invites');
      }

      const data = await response.json();
      return data.data as Invite[];
    },
    enabled: !!token && !!roomId,
    staleTime: 30000,
  });
}

export function useSendInvite() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string; userId: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/invites`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to send invite');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-invites'] });
      toast.success('Convite enviado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRevokeInvite() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, inviteId }: { roomId: string; inviteId: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/invites/${inviteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to revoke invite');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-invites'] });
      toast.success('Convite revogado!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hooks para Busca de Usuários
export function useSearchUsers(query: string) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['search-users', query],
    queryFn: async () => {
      if (!query || query.trim().length < 2) return [];
      
      const response = await fetch(`${API_BASE_URL}/api/users?query=${encodeURIComponent(query.trim())}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!token && query.trim().length >= 2,
    staleTime: 30000,
  });
}

// Hooks para Chat da Sala
export interface RoomMessage {
  id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  sender_id: string;
  sender_name: string;
  sender_email: string;
  reply_to_id?: string;
  reply_to?: {
    id: string;
    content: string;
    sender_name: string;
  };
  created_at: string;
  updated_at: string;
}

export function useRoomMessages(roomId: string | null) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['room-messages', roomId],
    queryFn: async () => {
      if (!roomId) throw new Error('Room ID is required');
      
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/messages?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          // User is not a member of the room anymore, return empty array
          return [];
        }
        throw new Error('Failed to fetch room messages');
      }

      const data = await response.json();
      return data.data as RoomMessage[];
    },
    enabled: !!token && !!roomId,
    staleTime: 10000,
  });
}

export function useSendRoomMessage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, content, reply_to_id }: { roomId: string; content: string; reply_to_id?: string }) => {
      const requestBody: { content: string; reply_to_id?: string } = { content };
      if (reply_to_id) {
        requestBody.reply_to_id = reply_to_id;
      }

      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to send message');
      }

      return response.json();
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['room-messages', roomId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hooks para Moderação
export function usePromoteMember() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, memberId }: { roomId: string; memberId: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/members/${memberId}/promote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to promote member');
      }

      return response.json();
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['room-members', roomId] });
      toast.success('Membro promovido a moderador!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDemoteMember() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, memberId }: { roomId: string; memberId: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/members/${memberId}/demote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to demote member');
      }

      return response.json();
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['room-members', roomId] });
      toast.success('Moderador rebaixado a membro!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useKickMember() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, memberId }: { roomId: string; memberId: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/members/${memberId}/kick`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to kick member');
      }

      return response.json();
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['room-members', roomId] });
      toast.success('Membro expulso da sala!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook para usar WebSocket em mensagens de sala
export function useRoomMessagesWebSocket(roomId: string | null) {
  const { socket, joinRoom, leaveRoom } = useSocket();
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<{[userId: string]: string}>({});

  useEffect(() => {
    if (!socket || !roomId) return;

    // Join room when component mounts
    joinRoom(roomId);

    // Listen for new messages
    const handleNewMessage = (message: RoomMessage) => {
      queryClient.setQueryData(['room-messages', roomId], (oldData: RoomMessage[] | undefined) => {
        if (!oldData) return [message];
        return [...oldData, message]; // Adicionar no final (mensagem mais nova)
      });
    };

    // Listen for typing indicators
    const handleTypingStart = ({ userId, userName }: { userId: string; userName: string }) => {
      setTypingUsers(prev => ({ ...prev, [userId]: userName }));
    };

    const handleTypingStop = ({ userId }: { userId: string }) => {
      setTypingUsers(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    };

    // Listen for ownership transfer events
    const handleOwnershipTransferred = ({ roomId: transferRoomId, newRole, message }: { 
      roomId: string; 
      newRole: string; 
      message: string; 
    }) => {
      if (transferRoomId === roomId) {
        // Update room data to reflect new ownership
        queryClient.invalidateQueries({ queryKey: ['room', roomId] });
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
        queryClient.invalidateQueries({ queryKey: ['room-members', roomId] });
        toast.success(message);
      }
    };

    const handleOwnerChanged = ({ roomId: changeRoomId, oldOwnerId, newOwnerId }: {
      roomId: string;
      oldOwnerId: string;
      newOwnerId: string;
    }) => {
      if (changeRoomId === roomId) {
        // Update room data and members list
        queryClient.invalidateQueries({ queryKey: ['room', roomId] });
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
        queryClient.invalidateQueries({ queryKey: ['room-members', roomId] });
        
        // Show notification about ownership change
        toast.info('A propriedade da sala foi transferida para outro membro.');
      }
    };

    const handleMemberRoleChanged = ({ roomId: roleRoomId, memberId, newRole, action }: {
      roomId: string;
      memberId: string;
      newRole: string;
      action: string;
    }) => {
      if (roleRoomId === roomId) {
        // Update members list to reflect role changes
        queryClient.invalidateQueries({ queryKey: ['room-members', roomId] });
      }
    };

    const handleRoleUpdated = ({ roomId: updateRoomId, newRole, action }: {
      roomId: string;
      newRole: string;
      action: string;
    }) => {
      if (updateRoomId === roomId) {
        // Update user's role in the room
        queryClient.invalidateQueries({ queryKey: ['room', roomId] });
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
        
        const actionText = action === 'promote' ? 'promovido a' : 'rebaixado a';
        const roleText = newRole === 'owner' ? 'proprietário' : 
                        newRole === 'moderator' ? 'moderador' : 'membro';
        toast.success(`Você foi ${actionText} ${roleText} nesta sala.`);
      }
    };

    const handleRoomDeleted = ({ roomId: deletedRoomId, roomName, deletedBy }: {
      roomId: string;
      roomName: string;
      deletedBy: string;
    }) => {
      if (deletedRoomId === roomId) {
        // Remove room data from cache immediately
        queryClient.removeQueries({ queryKey: ['room', roomId] });
        queryClient.removeQueries({ queryKey: ['room-members', roomId] });
        queryClient.removeQueries({ queryKey: ['room-messages', roomId] });
        queryClient.removeQueries({ queryKey: ['room-invites', roomId] });
        
        // Invalidate room lists to remove the deleted room
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
        
        toast.info(`A sala "${roomName}" foi excluída pelo proprietário.`);
      }
    };

    const handleRemovedFromRoom = ({ roomId: removedRoomId, roomName, reason }: {
      roomId: string;
      roomName: string;
      reason: string;
    }) => {
      if (removedRoomId === roomId) {
        // Remove room data from cache immediately
        queryClient.removeQueries({ queryKey: ['room', roomId] });
        queryClient.removeQueries({ queryKey: ['room-members', roomId] });
        queryClient.removeQueries({ queryKey: ['room-messages', roomId] });
        queryClient.removeQueries({ queryKey: ['room-invites', roomId] });
        
        // Invalidate room lists to remove the room
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
        
        if (reason === 'room_deleted') {
          toast.info(`A sala "${roomName}" foi excluída.`);
        } else {
          toast.warning(`Você foi removido da sala "${roomName}".`);
        }
      }
    };

    socket.on('room:new_message', handleNewMessage);
    socket.on('room:typing_start', handleTypingStart);
    socket.on('room:typing_stop', handleTypingStop);
    socket.on('room:ownership_transferred', handleOwnershipTransferred);
    socket.on('room:owner_changed', handleOwnerChanged);
    socket.on('room:member_role_changed', handleMemberRoleChanged);
    socket.on('room:role_updated', handleRoleUpdated);
    socket.on('room:deleted', handleRoomDeleted);
    socket.on('room:removed_from_room', handleRemovedFromRoom);

    // Cleanup
    return () => {
      socket.off('room:new_message', handleNewMessage);
      socket.off('room:typing_start', handleTypingStart);
      socket.off('room:typing_stop', handleTypingStop);
      socket.off('room:ownership_transferred', handleOwnershipTransferred);
      socket.off('room:owner_changed', handleOwnerChanged);
      socket.off('room:member_role_changed', handleMemberRoleChanged);
      socket.off('room:role_updated', handleRoleUpdated);
      socket.off('room:deleted', handleRoomDeleted);
      socket.off('room:removed_from_room', handleRemovedFromRoom);
      leaveRoom(roomId);
    };
  }, [socket, roomId, joinRoom, leaveRoom, queryClient]);

  return { typingUsers };
}