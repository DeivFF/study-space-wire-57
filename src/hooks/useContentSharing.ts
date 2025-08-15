// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface SharedContent {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  content_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SharedContentItem {
  id: string;
  shared_content_id: string;
  item_type: string;
  item_id: string;
  item_data: unknown;
  created_at: string;
}

interface SimpleProfile {
    nickname: string | null;
    avatar_url: string | null;
}

export type ContentShareRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface ContentShareRequest {
  id: string;
  shared_content_id: string;
  sender_id: string;
  recipient_id: string;
  status: ContentShareRequestStatus;
  message?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
  shared_content?: SharedContent;
  sender_profile?: SimpleProfile;
  recipient_profile?: SimpleProfile;
}

export const useContentSharing = () => {
  const { user } = useAuth();
  const [sharedContent, setSharedContent] = useState<SharedContent[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ContentShareRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ContentShareRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Load shared content created by user
  const loadSharedContent = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shared_content')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSharedContent(data || []);
    } catch (error) {
      console.error('Error loading shared content:', error);
      toast({
        title: "Erro ao carregar conteúdo compartilhado",
        variant: "destructive"
      });
    }
  }, [user]);

  // Load received share requests
  const loadReceivedRequests = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('content_share_requests')
        .select(`
          *,
          shared_content:shared_content_id(*),
          sender_profile:profiles!fk_sender_id(nickname, avatar_url)
        `)
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mapped = (data || []).map((d: any) => ({ ...d, status: d.status as ContentShareRequestStatus })) as ContentShareRequest[];
      setReceivedRequests(mapped);
    } catch (error) {
      console.error('Error loading received requests:', error);
      toast({
        title: "Erro ao carregar solicitações recebidas",
        variant: "destructive"
      });
    }
  }, [user]);

  // Load sent share requests
  const loadSentRequests = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('content_share_requests')
        .select(`
          *,
          shared_content:shared_content_id(*),
          recipient_profile:profiles!fk_recipient_id(nickname, avatar_url)
        `)
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mapped = (data || []).map((d: any) => ({ ...d, status: d.status as ContentShareRequestStatus })) as ContentShareRequest[];
      setSentRequests(mapped);
    } catch (error) {
      console.error('Error loading sent requests:', error);
      toast({
        title: "Erro ao carregar solicitações enviadas",
        variant: "destructive"
      });
    }
  }, [user]);

  // Create shared content package
  const createSharedContent = useCallback(async (
    title: string,
    description: string,
    contentType: string,
    items: Array<{ type: string; id: string; data: unknown }>
  ) => {
    if (!user) return null;

    try {
      // Create shared content
      const { data: sharedContent, error: contentError } = await supabase
        .from('shared_content')
        .insert({
          owner_id: user.id,
          title,
          description,
          content_type: contentType
        })
        .select()
        .single();

      if (contentError) throw contentError;

      // Add items to shared content
      const itemsToInsert = items.map(item => ({
        shared_content_id: sharedContent.id,
        item_type: item.type,
        item_id: item.id,
        item_data: item.data
      }));

      const { error: itemsError } = await supabase
        .from('shared_content_items')
        .insert(itemsToInsert as any);

      if (itemsError) throw itemsError;

      await loadSharedContent();
      toast({
        title: "Conteúdo compartilhado criado com sucesso!"
      });
      return sharedContent;
    } catch (error) {
      console.error('Error creating shared content:', error);
      toast({
        title: "Erro ao criar conteúdo compartilhado",
        variant: "destructive"
      });
      return null;
    }
  }, [user, loadSharedContent]);

  // Send share request to friend
  const sendShareRequest = useCallback(async (
    sharedContentId: string,
    contentTitle: string,
    recipientId: string,
    message?: string
  ) => {
    if (!user) return false;

    try {
      const { error: requestError } = await supabase
        .from('content_share_requests')
        .insert({
          shared_content_id: sharedContentId,
          sender_id: user.id,
          recipient_id: recipientId,
          message
        });

      if (requestError) throw requestError;

      // Create a notification for the recipient
      const { error: notificationError } = await (supabase as any)
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: 'content_share_request',
          data: {
            sender_id: user.id,
            shared_content_id: sharedContentId,
            content_title: contentTitle,
          }
        });

      if (notificationError) {
        // Log the error but don't fail the whole operation,
        // as the main share request was successful.
        console.error('Error creating notification:', notificationError);
      }

      await loadSentRequests();
      toast({
        title: "Solicitação de compartilhamento enviada!"
      });
      return true;
    } catch (error) {
      console.error('Error sending share request:', error);
      toast({
        title: "Erro ao enviar solicitação",
        variant: "destructive"
      });
      return false;
    }
  }, [user, loadSentRequests]);

  // Respond to share request
  const respondToShareRequest = useCallback(async (
    request: ContentShareRequest,
    accept: boolean
  ) => {
    if (!user) return false;

    try {
      if (accept) {
        // Call the clone function
        const { error: cloneError } = await supabase.rpc('clone_shared_content', {
          p_shared_content_id: request.shared_content_id,
          p_recipient_id: user.id
        });

        if (cloneError) throw cloneError;

        // Update the request status
        const { error: updateError } = await supabase
          .from('content_share_requests')
          .update({
            status: 'accepted',
            responded_at: new Date().toISOString()
          })
          .eq('id', request.id);

        if (updateError) throw updateError;

        toast({
          title: "Conteúdo aceito e importado!",
          description: "O conteúdo compartilhado agora está na sua conta."
        });

      } else {
        // Just reject the request
        const { error } = await supabase
          .from('content_share_requests')
          .update({
            status: 'rejected',
            responded_at: new Date().toISOString()
          })
          .eq('id', request.id);

        if (error) throw error;

        toast({
          title: "Solicitação rejeitada"
        });
      }

      // Mark the corresponding notification as read
      // Notification entries are derived from pending requests in AppState.
      // No direct DB notification update needed here.

      await loadReceivedRequests();
      return true;
    } catch (error) {
      console.error('Error responding to share request:', error);
      const errorMessage = (error as any).message || 'Ocorreu um erro desconhecido.';
      toast({
        title: "Erro ao responder solicitação",
        description: `Detalhes: ${errorMessage}`,
        variant: "destructive"
      });
      return false;
    }
  }, [user, loadReceivedRequests]);

  // Get shared content items
  const getSharedContentItems = useCallback(async (sharedContentId: string) => {
    try {
      const { data, error } = await supabase
        .from('shared_content_items')
        .select('*')
        .eq('shared_content_id', sharedContentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading shared content items:', error);
      toast({
        title: "Erro ao carregar itens compartilhados",
        variant: "destructive"
      });
      return [];
    }
  }, []);

  const refetch = useCallback(() => {
    return Promise.all([
      loadSharedContent(),
      loadReceivedRequests(),
      loadSentRequests()
    ]);
  }, [loadSharedContent, loadReceivedRequests, loadSentRequests]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      refetch().finally(() => setLoading(false));
    }
  }, [user, refetch]);

  return {
    sharedContent,
    receivedRequests,
    sentRequests,
    loading,
    createSharedContent,
    sendShareRequest,
    respondToShareRequest,
    getSharedContentItems,
    refetch
  };
};