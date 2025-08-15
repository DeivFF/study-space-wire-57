// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Tables } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender_profile?: {
    nickname: string | null;
    avatar_url: string | null;
  };
  receiver_profile?: {
    nickname: string | null;
    avatar_url: string | null;
  };
}

export interface Friendship {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  friend_profile?: {
    nickname: string | null;
    avatar_url: string | null;
    user_id: string;
    status: 'online' | 'offline';
    last_seen: string | null;
  };
}

interface FriendsContextType {
  friends: Friendship[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  loading: boolean;
  sendFriendRequest: (nickname: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  cancelFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  refetch: () => Promise<[void, void]>;
}

const FriendsContext = createContext<FriendsContextType | null>(null);

export const sendFriendRequestForTest = async (
  nickname: string,
  {
    user,
    supabase,
    toast,
    fetchFriendRequests,
  }: {
    user: { id: string } | null;
    supabase: any;
    toast: (args: any) => void;
    fetchFriendRequests: () => Promise<void>;
  }
) => {
  if (!user) return;
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .ilike('nickname', nickname)
      .single();

    if (profileError || !profileData) {
      toast({ title: "Usuário não encontrado", variant: "destructive" });
      return;
    }
    if (profileData.user_id === user.id) {
      toast({ title: "Erro", description: "Você não pode enviar convite para si mesmo.", variant: "destructive" });
      return;
    }

    const { data: existingRequest, error: existingError } = await supabase
      .from('friend_requests')
      .select('id')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${profileData.user_id}),and(sender_id.eq.${profileData.user_id},receiver_id.eq.${user.id})`)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }
    if (existingRequest) {
      toast({
        title: "Convite pendente",
        description: "Já há um convite pendente entre os usuários.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('friend_requests')
      .insert([{ sender_id: user.id, receiver_id: profileData.user_id }]);
    if (error) {
      if (error.code === '23505') {
        const { data: conflict, error: fetchExistingError } = await supabase
          .from('friend_requests')
          .select('status')
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${profileData.user_id}),and(sender_id.eq.${profileData.user_id},receiver_id.eq.${user.id})`
          )
          .maybeSingle();

        if (fetchExistingError && fetchExistingError.code !== 'PGRST116') {
          throw fetchExistingError;
        }

        if (conflict) {
          if (conflict.status === 'accepted') {
            toast({
              title: "Convite já aceito",
              description: "Vocês já são amigos.",
              variant: "destructive",
            });
          } else if (conflict.status === 'rejected') {
            toast({
              title: "Convite rejeitado anteriormente",
              description: "O convite foi rejeitado anteriormente.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Convite pendente",
              description: "Já há um convite pendente entre os usuários.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Erro",
            description: "Não foi possível enviar o convite.",
            variant: "destructive",
          });
        }
      } else {
        throw error;
      }
      return;
    }
    toast({ title: "Convite enviado" });
    await fetchFriendRequests();
  } catch (error) {
    console.error('Error sending friend request:', error);
    toast({ title: "Erro", description: "Não foi possível enviar o convite.", variant: "destructive" });
  }
};

export const acceptFriendRequestForTest = async (
  requestId: string,
  {
    supabase,
    toast,
    fetchFriendRequests,
    fetchFriends,
  }: {
    supabase: any;
    toast: (args: any) => void;
    fetchFriendRequests: () => Promise<void>;
    fetchFriends: () => Promise<void>;
  }
) => {
  try {
    const { error } = await supabase.rpc('accept_friend_request', {
      p_request_id: requestId,
    });
    if (error) throw error;
    toast({ title: "Convite aceito" });
    await Promise.all([fetchFriendRequests(), fetchFriends()]);
  } catch (error) {
    console.error('Error accepting friend request:', error);
  }
};

export const deleteFriendRequest = async (
  requestId: string,
  toastMsg: string,
  {
    supabase,
    toast,
    fetchFriendRequests,
  }: {
    supabase: any;
    toast: (args: any) => void;
    fetchFriendRequests: () => Promise<void>;
  }
) => {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId);
    if (error) throw error;
    toast({ title: toastMsg });
    await fetchFriendRequests();
  } catch (error) {
    console.error('Error deleting friend request:', error);
  }
};

export const rejectFriendRequestForTest = async (
  requestId: string,
  deps: {
    supabase: any;
    toast: (args: any) => void;
    fetchFriendRequests: () => Promise<void>;
  }
) => deleteFriendRequest(requestId, "Convite recusado", deps);

export const cancelFriendRequestForTest = async (
  requestId: string,
  deps: {
    supabase: any;
    toast: (args: any) => void;
    fetchFriendRequests: () => Promise<void>;
  }
) => deleteFriendRequest(requestId, "Convite cancelado", deps);

export const removeFriendForTest = async (
  friendshipId: string,
  {
    supabase,
    toast,
    fetchFriends,
  }: {
    supabase: any;
    toast: (args: any) => void;
    fetchFriends: () => Promise<void>;
  }
) => {
  try {
    const { data: friendship, error: fetchError } = await supabase
      .from('friendships')
      .select('user1_id, user2_id')
      .eq('id', friendshipId)
      .single();
    if (fetchError) throw fetchError;
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
    if (error) throw error;
    if (friendship) {
      const { error: frError } = await supabase
        .from('friend_requests')
        .delete()
        .or(
          `and(sender_id.eq.${friendship.user1_id},receiver_id.eq.${friendship.user2_id}),and(sender_id.eq.${friendship.user2_id},receiver_id.eq.${friendship.user1_id})`
        );
      if (frError) throw frError;
    }
    toast({ title: "Amigo removido" });
    await fetchFriends();
  } catch (error) {
    console.error('Error removing friend:', error);
  }
};

const useFriendsLogic = () => {
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const friendsStatusChannel = useRef<RealtimeChannel | null>(null);

  const fetchFriendRequests = useCallback(async () => {
    if (!user) return;

    try {
      // 1) Buscar pedidos de amizade
      const { data: requestsData, error: requestsError } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching friend requests:', requestsError);
        setFriendRequests([]);
        return;
      }

      if (!requestsData || requestsData.length === 0) {
        setFriendRequests([]);
        return;
      }

      // 2) Coletar IDs de usuários envolvidos
      const userIds = [...new Set(requestsData.flatMap(req => [req.sender_id, req.receiver_id]))];

      // 3) Buscar perfis em uma única query
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, nickname, avatar_url')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles for friend requests:', profilesError);
        setFriendRequests(requestsData);
        return;
      }

      // 4) "Join" manual no cliente
      const requestsWithProfiles = requestsData.map(request => ({
        ...request,
        sender_profile: profilesData.find(p => p.user_id === request.sender_id),
        receiver_profile: profilesData.find(p => p.user_id === request.receiver_id),
      }));

      setFriendRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error in fetchFriendRequests process:', error);
      setFriendRequests([]);
    }
  }, [user]);

  const fetchFriends = useCallback(async () => {
    if (!user) return;

    try {
      const { data: friendshipsData, error: friendshipsError } = await supabase
        .from('friendships')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (friendshipsError) throw friendshipsError;

      const friendUserIds =
        friendshipsData?.map(friendship =>
          friendship.user1_id === user.id ? friendship.user2_id : friendship.user1_id
        ) || [];

      if (friendUserIds.length === 0) {
        setFriends([]);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, nickname, avatar_url, status, last_seen')
        .in('user_id', friendUserIds);

      if (profilesError) {
        console.error('Error fetching friend profiles:', profilesError);
      }

      const friendsWithProfiles =
        friendshipsData?.map(friendship => {
          const friend_profile = profilesData?.find(
            p =>
              p.user_id ===
              (friendship.user1_id === user.id ? friendship.user2_id : friendship.user1_id)
          );
          return {
            ...friendship,
            friend_profile: friend_profile as Friendship['friend_profile'],
          };
        }) || [];

      setFriends(friendsWithProfiles);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  }, [user]);

  const sendFriendRequest = useCallback(
    (nickname: string) =>
      sendFriendRequestForTest(nickname, {
        user,
        supabase,
        toast,
        fetchFriendRequests,
      }),
    [user, fetchFriendRequests]
  );

  const acceptFriendRequest = useCallback(
    (requestId: string) =>
      acceptFriendRequestForTest(requestId, {
        supabase,
        toast,
        fetchFriendRequests,
        fetchFriends,
      }),
    [fetchFriendRequests, fetchFriends]
  );

  const rejectFriendRequest = useCallback(
    (requestId: string) =>
      rejectFriendRequestForTest(requestId, {
        supabase,
        toast,
        fetchFriendRequests,
      }),
    [fetchFriendRequests]
  );

  const cancelFriendRequest = useCallback(
    (requestId: string) =>
      cancelFriendRequestForTest(requestId, {
        supabase,
        toast,
        fetchFriendRequests,
      }),
    [fetchFriendRequests]
  );

  const removeFriend = useCallback(
    async (friendshipId: string) => {
      try {
        const friendship = friends.find(f => f.id === friendshipId);
        const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
        if (error) throw error;
        if (friendship) {
          const { error: frError } = await supabase
            .from('friend_requests')
            .delete()
            .or(
              `and(sender_id.eq.${friendship.user1_id},receiver_id.eq.${friendship.user2_id}),and(sender_id.eq.${friendship.user2_id},receiver_id.eq.${friendship.user1_id})`
            );
          if (frError) throw frError;
        }
        toast({ title: 'Amigo removido' });
        await fetchFriends();
      } catch (error) {
        console.error('Error removing friend:', error);
      }
    },
    [friends, fetchFriends]
  );


  const refetch = useCallback(
    () => Promise.all([fetchFriendRequests(), fetchFriends()]),
    [fetchFriendRequests, fetchFriends]
  );

  useEffect(() => {
    if (user) {
      setLoading(true);
      refetch().finally(() => setLoading(false));
    }
  }, [user, refetch]);

  useEffect(() => {
    if (!user?.id) {
      if (friendsStatusChannel.current) {
        supabase.removeChannel(friendsStatusChannel.current);
        friendsStatusChannel.current = null;
      }
      return;
    }
    if (friendsStatusChannel.current) return;

    const userId = user.id;
    const handleProfileUpdate = (payload: RealtimePostgresChangesPayload<Tables<'profiles'>>) => {
      setFriends(currentFriends => {
        const friendIds = new Set(
          currentFriends.map(f => (f.user1_id === userId ? f.user2_id : f.user1_id))
        );
        if (payload.new && friendIds.has(payload.new.user_id)) {
          return currentFriends.map(friend => {
            const friendUserId = friend.user1_id === userId ? friend.user2_id : friend.user1_id;
            if (friendUserId === payload.new.user_id) {
              return {
                ...friend,
                friend_profile: { ...friend.friend_profile, ...payload.new } as Friendship['friend_profile'],
              };
            }
            return friend;
          });
        }
        return currentFriends;
      });
    };

    const channel = supabase.channel(`friends-status-updates-${userId}`);
    channel
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, handleProfileUpdate)
      .subscribe();
    friendsStatusChannel.current = channel;

    return () => {
      if (friendsStatusChannel.current) {
        supabase.removeChannel(friendsStatusChannel.current);
        friendsStatusChannel.current = null;
      }
    };
  }, [user?.id]);

  const pendingRequests = useMemo(
    () => friendRequests.filter(req => req.status === 'pending' && req.receiver_id === user?.id),
    [friendRequests, user?.id]
  );

  const sentRequests = useMemo(
    () => friendRequests.filter(req => req.status === 'pending' && req.sender_id === user?.id),
    [friendRequests, user?.id]
  );


  return useMemo(
    () => ({
      friends,
      pendingRequests,
      sentRequests,
      loading,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      cancelFriendRequest,
      removeFriend,
      refetch,
    }),
    [
      friends,
      pendingRequests,
      sentRequests,
      loading,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      cancelFriendRequest,
      removeFriend,
      refetch,
    ]
  );
};

export const FriendsProvider = ({ children }: { children: React.ReactNode }) => {
  const friendsLogic = useFriendsLogic();
  return <FriendsContext.Provider value={friendsLogic}>{children}</FriendsContext.Provider>;
};

export const useFriends = (): FriendsContextType => {
  const context = useContext(FriendsContext);
  if (context === null) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
};
