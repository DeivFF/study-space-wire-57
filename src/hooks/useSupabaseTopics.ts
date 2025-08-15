import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSupabaseTopics = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const getTopics = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  };

  const addTopic = async (name: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('topics')
      .insert([{ name, user_id: user.id }])
      .select();
    if (error) throw new Error(error.message);
    return data;
  };

  const deleteTopic = async (id: string) => {
    const { error } = await supabase.from('topics').delete().eq('id', id);
    if (error) throw new Error(error.message);
  };

  const { data: topics, isLoading: isLoadingTopics } = useQuery({
    queryKey: ['topics', user?.id],
    queryFn: getTopics,
    enabled: !!user,
  });

  const { mutate: createTopic, isPending: isCreatingTopic } = useMutation({
    mutationFn: addTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics', user?.id] });
    },
  });

  const { mutate: removeTopic, isPending: isDeletingTopic } = useMutation({
    mutationFn: deleteTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics', user?.id] });
    },
  });

  return {
    topics,
    isLoadingTopics,
    createTopic,
    isCreatingTopic,
    removeTopic,
    isDeletingTopic,
  };
};
