import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  nickname: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (nickname?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{ 
          user_id: user.id,
          nickname: nickname || null
        }])
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      toast({
        title: "Perfil criado",
        description: "Seu perfil foi criado com sucesso!",
      });

      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o perfil.",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (updates: Partial<Pick<Profile, 'nickname' | 'avatar_url'>>) => {
    if (!user || !profile) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        // Check if it's a unique constraint violation for nickname
        if (error.code === '23505' && error.message?.includes('profiles_nickname_unique')) {
          toast({
            title: "Erro",
            description: "Este apelido já está em uso. Escolha outro.",
            variant: "destructive",
          });
          return null;
        }
        throw error;
      }

      setProfile(data);
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso!",
      });

      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await updateProfile({ avatar_url: data.publicUrl });

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso!",
      });

      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a senha.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteAccount = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase.functions.invoke('delete-account');

      if (error) throw error;

      toast({
        title: "Conta excluída",
        description: "Seu usuário foi removido com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conta.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    createProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
    deleteAccount,
    refetchProfile: fetchProfile
  };
};