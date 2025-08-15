// @ts-nocheck
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLocalStorage, useSessionStorage } from '@/hooks/useLocalStorage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useFriends } from './useFriends';
import { useContentSharing, ContentShareRequest } from './useContentSharing';

// --- Interfaces ---
interface StudyTrail {
  id: string;
  name: string;
  description: string | null;
  admin_id: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

interface TrailInvitation {
  id: string;
  trail_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  study_trails?: StudyTrail;
  inviter_profile?: {
    nickname: string | null;
    avatar_url: string | null;
  };
}
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
}
interface Friendship {
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

// Unified Notification Type
export type NotificationType = 'trail_invitation' | 'friend_request' | 'content_share_request';
export interface UnifiedNotification {
  id: string;
  type: NotificationType;
  createdAt: string;
  message: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  contextName?: string; // e.g., Trail name
  onAccept: () => void;
  onReject: () => void;
}

export interface AppState {
  isTimerRunning: boolean;
  currentTimerTime: number;
  timerType: 'study' | 'break';
  selectedSection: string;
  stats: {
    tempoEstudo: number;
    questoesResolvidas: number;
    questoesCorretas: number;
    ultimoEstudo: string;
  };
  questoesFiltros: {
    searchTerm: string;
    selectedMateria: string;
    selectedAssunto: string;
    selectedStatus: string;
    currentPage: number;
  };
  expandedSections: Record<string, boolean>;
  lastActivity: number;
  trails: StudyTrail[];
  sentInvitations: TrailInvitation[];
  trailsLoading: boolean;
  notifications: UnifiedNotification[]; // New unified notifications
}

const defaultState: Omit<AppState, 'notifications'> = {
  isTimerRunning: false,
  currentTimerTime: 25 * 60,
  timerType: 'study',
  selectedSection: 'resumos',
  stats: {
    tempoEstudo: 0,
    questoesResolvidas: 0,
    questoesCorretas: 0,
    ultimoEstudo: new Date().toISOString().split('T')[0],
  },
  questoesFiltros: {
    searchTerm: '',
    selectedMateria: '',
    selectedAssunto: '',
    selectedStatus: '',
    currentPage: 1,
  },
  expandedSections: {},
  lastActivity: Date.now(),
  trails: [],
  sentInvitations: [],
  trailsLoading: true,
};

export const useAppState = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    friends,
    pendingRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    refetch: refetchFriendsData
  } = useFriends();

  const {
    receivedRequests: contentShareRequests,
    respondToShareRequest,
    refetch: refetchContentSharingData
  } = useContentSharing();

  const [timerState, setTimerState] = useLocalStorage('timerState', {
    isTimerRunning: false,
    currentTimerTime: 25 * 60,
    timerType: 'study',
  });
  const [studyStats, setStudyStats] = useLocalStorage('cnuStudyStats', {
    tempoEstudo: 0,
    questoesResolvidas: 0,
    questoesCorretas: 0,
    ultimoEstudo: new Date().toISOString().split('T')[0],
  });
  const [selectedSection, setSelectedSectionStorage] = useLocalStorage('selectedSection', 'revisoes');
  const [questoesFiltros, setQuestoesFiltrosStorage] = useSessionStorage('questoesFiltros', defaultState.questoesFiltros);
  const [expandedSections, setExpandedSectionsStorage] = useSessionStorage('expandedSections', {});
  const [lastActivity, setLastActivity] = useSessionStorage('lastActivity', Date.now());

  const [trails, setTrails] = useState<StudyTrail[]>([]);
  const [pendingTrailInvitations, setPendingTrailInvitations] = useState<TrailInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<TrailInvitation[]>([]);
  const [trailsLoading, setTrailsLoading] = useState(true);

  const updateUserStatus = useCallback(
    (status: 'online' | 'offline') => {
      if (!user?.id) return;
      supabase
        .from('profiles')
        .update({ status, last_seen: new Date().toISOString() })
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error(`Error updating user status to ${status}:`, error);
          }
        });
    },
    [user?.id]
  );

  // Logic from useStudyTrails
  const fetchTrails = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('study_trails').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setTrails(data || []);
    } catch (error) {
      console.error('Error fetching trails:', error);
    }
  }, [user]);

  const fetchInvitations = useCallback(async () => {
    if (!user) return;
    try {
      const { data: pendingData, error: pendingError } = await supabase.from('trail_invitations').select(`*, study_trails (*)`).eq('invitee_id', user.id).eq('status', 'pending');
      if (pendingError) throw pendingError;
      const inviterIds = pendingData?.map(req => req.inviter_id) || [];
      if (inviterIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('user_id, nickname, avatar_url').in('user_id', [...new Set(inviterIds)]);
        if (profilesError) throw profilesError;
        const pendingWithProfiles = pendingData?.map(req => ({...req, inviter_profile: profilesData?.find(p => p.user_id === req.inviter_id)})) || [];
        setPendingTrailInvitations(pendingWithProfiles);
      } else {
        setPendingTrailInvitations(pendingData || []);
      }
      const { data: sent, error: sentError } = await supabase.from('trail_invitations').select(`*, study_trails (*)`).eq('inviter_id', user.id).neq('status', 'accepted');
      if (sentError) throw sentError;
      setSentInvitations(sent || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast({ title: "Erro ao buscar convites", description: "Não foi possível carregar seus convites.", variant: "destructive"});
    }
  }, [user, toast]);

  const respondToTrailInvitation = useCallback(async (invitationId: string, accept: boolean) => {
    if (!user) return false;
    try {
        if (accept) {
            const { error } = await supabase.rpc('accept_trail_invitation', { p_invitation_id: invitationId });
            if (error) throw error;
            toast({ title: "Sucesso", description: "Convite para trilha aceito!" });
        } else {
            const { error } = await supabase.from('trail_invitations').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', invitationId);
            if (error) throw error;
            toast({ title: "Sucesso", description: "Convite recusado." });
        }
        await fetchInvitations();
        await fetchTrails();
        return true;
    } catch (error: any) {
        console.error('Error responding to trail invitation:', error);
        toast({ title: "Erro", description: `Não foi possível responder ao convite: ${error.message}`, variant: "destructive" });
        return false;
    }
  }, [user, toast, fetchInvitations, fetchTrails]);

  // Create unified notifications
  const notifications = useMemo((): UnifiedNotification[] => {
    const trailNotifs: UnifiedNotification[] = pendingTrailInvitations.map(inv => ({
      id: inv.id,
      type: 'trail_invitation',
      createdAt: inv.created_at,
      senderName: inv.inviter_profile?.nickname || 'Usuário',
      senderAvatarUrl: inv.inviter_profile?.avatar_url,
      message: ` convidou você para a trilha `,
      contextName: inv.study_trails?.name,
      onAccept: () => respondToTrailInvitation(inv.id, true),
      onReject: () => respondToTrailInvitation(inv.id, false),
    }));

    const friendNotifs: UnifiedNotification[] = pendingRequests.map(req => ({
      id: req.id,
      type: 'friend_request',
      createdAt: req.created_at,
      senderName: req.sender_profile?.nickname || 'Usuário',
      senderAvatarUrl: req.sender_profile?.avatar_url,
      message: ' enviou um convite de amizade.',
      contextName: undefined,
      onAccept: async () => {
        await acceptFriendRequest(req.id);
        await refetchFriendsData();
      },
      onReject: async () => {
        await rejectFriendRequest(req.id);
        await refetchFriendsData();
      },
    }));

    const contentShareNotifs: UnifiedNotification[] = contentShareRequests.map(req => ({
        id: req.id,
        type: 'content_share_request',
        createdAt: req.created_at,
        senderName: req.sender_profile?.nickname || 'Usuário',
        senderAvatarUrl: req.sender_profile?.avatar_url,
        message: ` compartilhou um conteúdo com você: `,
        contextName: req.shared_content?.title,
        onAccept: async () => {
          await respondToShareRequest(req, true);
          await refetchContentSharingData();
        },
        onReject: async () => {
          await respondToShareRequest(req, false);
          await refetchContentSharingData();
        },
      }));

    return [...trailNotifs, ...friendNotifs, ...contentShareNotifs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [
    pendingTrailInvitations,
    pendingRequests,
    contentShareRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    refetchFriendsData,
    respondToShareRequest,
    refetchContentSharingData,
    respondToTrailInvitation,
  ]);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setTrailsLoading(true);
        try {
          await Promise.all([fetchTrails(), fetchInvitations(), refetchFriendsData(), refetchContentSharingData()]);
        } catch (error) {
          console.error("Failed to load initial app data:", error);
        } finally {
          setTrailsLoading(false);
        }
      };
      loadData();
    }
  }, [user, fetchTrails, fetchInvitations, refetchFriendsData, refetchContentSharingData]);

  // Real-time presence
  useEffect(() => {
    if (!user?.id) {
      return;
    }
    const userId = user.id;

    const channel = supabase.channel(`online-users-${userId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online_at: new Date().toISOString() });
        updateUserStatus('online');
      }
    });

    return () => {
      // No need to call updateUserStatus('offline') here,
      // as Supabase presence automatically handles leaving.
      // We can rely on a server-side function or background job
      // to mark users as offline after a certain period of inactivity.
      supabase.removeChannel(channel);
    };
  }, [user?.id, updateUserStatus]);

  useEffect(() => {
    if (!user?.id) return;

    const handleActivity = () => {
      setLastActivity(Date.now());
      updateUserStatus('online');
    };

    const handleBeforeUnload = () => updateUserStatus('offline');

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('beforeunload', handleBeforeUnload);

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > 5 * 60 * 1000) {
        updateUserStatus('offline');
      }
    }, 60 * 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
    };
  }, [lastActivity, updateUserStatus, user?.id]);

  const state: AppState = useMemo(() => ({
    isTimerRunning: timerState.isTimerRunning,
    currentTimerTime: timerState.currentTimerTime,
    timerType: timerState.timerType as 'study' | 'break',
    stats: studyStats,
    selectedSection,
    questoesFiltros,
    expandedSections,
    lastActivity,
    trails,
    sentInvitations,
    trailsLoading,
    notifications,
  }), [timerState, studyStats, selectedSection, questoesFiltros, expandedSections, lastActivity, trails, sentInvitations, trailsLoading, notifications]);

  // All other trail-related functions that should be in actions
  const fetchTrailMembers = useCallback(async (trailId: string) => {
      if (!user) return [];
      try {
        const { data, error } = await supabase.from('trail_members').select(`*, profiles:user_id (nickname, avatar_url)`).eq('trail_id', trailId).eq('status', 'active');
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching trail members:', error);
        return [];
      }
    }, [user]);

    const createTrail = useCallback(async (name: string, description?: string, isPrivate: boolean = true) => {
        if (!user) return false;
        try {
            const { error } = await supabase.from('study_trails').insert({ name, description, admin_id: user.id, is_private: isPrivate });
            if (error) throw error;
            toast({ title: "Sucesso", description: "Trilha criada com sucesso!" });
            await fetchTrails();
            return true;
        } catch (error: any) {
            console.error('Error creating trail:', error);
            toast({ title: "Erro", description: `Não foi possível criar a trilha: ${error.message || 'Erro desconhecido'}`, variant: "destructive" });
            return false;
        }
    }, [user, toast, fetchTrails]);

    const inviteToTrail = useCallback(async (trailId: string, inviteeId: string) => {
        if (!user) return false;
        try {
            const { error } = await supabase.from('trail_invitations').insert({ trail_id: trailId, inviter_id: user.id, invitee_id: inviteeId });
            if (error) {
                if (error.code === '23505') {
                    toast({ title: "Aviso", description: "Este usuário já foi convidado para esta trilha.", variant: "destructive" });
                    return false;
                }
                throw error;
            }
            toast({ title: "Sucesso", description: "Convite enviado com sucesso!" });
            await fetchInvitations();
            return true;
        } catch (error) {
            console.error('Error inviting to trail:', error);
            toast({ title: "Erro", description: "Não foi possível enviar o convite.", variant: "destructive" });
            return false;
        }
    }, [user, toast, fetchInvitations]);

    const cancelInvitation = useCallback(async (trailId: string, inviteeId: string) => {
        if (!user) return false;
        try {
            const { error } = await supabase.from('trail_invitations').delete().eq('trail_id', trailId).eq('inviter_id', user.id).eq('invitee_id', inviteeId).eq('status', 'pending');
            if (error) throw error;
            toast({ title: "Convite cancelado", description: "O convite foi cancelado com sucesso." });
            await fetchInvitations();
            return true;
        } catch (error) {
            console.error('Error canceling invitation:', error);
            toast({ title: "Erro", description: "Não foi possível cancelar o convite.", variant: "destructive" });
            return false;
        }
    }, [user, toast, fetchInvitations]);

    const leaveTrail = useCallback(async (trailId: string) => {
        if (!user) return false;
        try {
            const { error } = await supabase.from('trail_members').delete().eq('trail_id', trailId).eq('user_id', user.id);
            if (error) throw error;
            toast({ title: "Sucesso", description: "Você saiu da trilha." });
            await fetchTrails();
            return true;
        } catch (error) {
            console.error('Error leaving trail:', error);
            toast({ title: "Erro", description: "Não foi possível sair da trilha.", variant: "destructive" });
            return false;
        }
    }, [user, toast, fetchTrails]);

    const deleteTrail = useCallback(async (trailId: string) => {
        if (!user) return false;
        try {
            const { error } = await supabase.from('study_trails').delete().eq('id', trailId).eq('admin_id', user.id);
            if (error) throw error;
            toast({ title: "Sucesso", description: "Trilha excluída com sucesso." });
            await fetchTrails();
            return true;
        } catch (error) {
            console.error('Error deleting trail:', error);
            toast({ title: "Erro", description: "Não foi possível excluir a trilha.", variant: "destructive" });
            return false;
        }
    }, [user, toast, fetchTrails]);

    const getInvitableFriends = useCallback(async (trailId: string, allFriends: Friendship[]) => {
        if (!user) return [];
        try {
            const { data: members, error: membersError } = await supabase.from('trail_members').select('user_id').eq('trail_id', trailId);
            if (membersError) throw membersError;
            const memberIds = new Set(members.map(m => m.user_id));

            const { data: invitations, error: invitesError } = await supabase.from('trail_invitations').select('invitee_id').eq('trail_id', trailId).eq('status', 'pending');
            if (invitesError) throw invitesError;
            const invitedIds = new Set(invitations.map(i => i.invitee_id));

            const invitableFriends = allFriends.filter(friendship => {
                const friendId = friendship.user1_id === user.id ? friendship.user2_id : friendship.user1_id;
                return !memberIds.has(friendId) && !invitedIds.has(friendId);
            });
            return invitableFriends;
        } catch (error) {
            console.error('Error fetching invitable friends:', error);
            toast({ title: "Erro ao buscar amigos", description: "Não foi possível carregar a lista de amigos para convidar.", variant: "destructive" });
            return [];
        }
    }, [user, toast]);

  // Memoized actions
  const actions = useMemo(() => ({
    setTimerRunning: (isRunning: boolean) => setTimerState(prev => ({ ...prev, isTimerRunning: isRunning })),
    setTimerTime: (time: number) => setTimerState(prev => ({ ...prev, currentTimerTime: time })),
    setTimerType: (type: 'study' | 'break') => setTimerState(prev => ({ ...prev, timerType: type })),
    setSelectedSection: (section: string) => setSelectedSectionStorage(section),
    updateStats: (newStats: Partial<AppState['stats']>) => setStudyStats(prev => ({ ...prev, ...newStats })),
    updateQuestoesFiltros: (filtros: Partial<AppState['questoesFiltros']>) => setQuestoesFiltrosStorage(prev => ({ ...prev, ...filtros })),
    toggleExpandedSection: (sectionId: string) => setExpandedSectionsStorage(prev => ({...prev, [sectionId]: !prev[sectionId]})),
    markActivity: () => {
      setLastActivity(Date.now());
      updateUserStatus('online');
    },
    isSessionActive: () => Date.now() - lastActivity < 5 * 60 * 1000,
    // Trail actions
    fetchTrailMembers,
    createTrail,
    inviteToTrail,
    cancelInvitation,
    respondToInvitation: respondToTrailInvitation,
    leaveTrail,
    deleteTrail,
    getInvitableFriends,
  }), [
    user, toast, fetchTrails, fetchInvitations, setTimerState, setSelectedSectionStorage,
    setStudyStats, setQuestoesFiltrosStorage, setExpandedSectionsStorage, setLastActivity, lastActivity, updateUserStatus,
    fetchTrailMembers, createTrail, inviteToTrail, cancelInvitation, respondToTrailInvitation,
    leaveTrail, deleteTrail, getInvitableFriends
  ]);

  return { state, actions };
};