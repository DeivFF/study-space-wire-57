import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, User, Lock, Save } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { useNavigate } from 'react-router-dom';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileModal = ({ open, onOpenChange }: ProfileModalProps) => {
  const { user, signOut } = useAuth();
  const { profile, createProfile, updateProfile, uploadAvatar, changePassword, deleteAccount } = useProfile();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleSaveProfile = async () => {
    if (!profile) {
      // Create profile if it doesn't exist
      await createProfile(nickname);
    } else {
      // Update existing profile
      await updateProfile({ nickname: nickname || null });
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    const success = await changePassword(newPassword);
    if (success) {
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    await uploadAvatar(file);
    setUploading(false);
  };

  const getDisplayName = () => {
    if (profile?.nickname) return profile.nickname;
    if (user?.email) return user.email.split('@')[0];
    return 'Usuário';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.substring(0, 2).toUpperCase();
  };

  const handleDeleteAccount = async () => {
    const success = await deleteAccount();
    if (success) {
      await signOut();
      navigate('/');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Meu Perfil</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile?.avatar_url || ''} alt="Avatar" />
                <AvatarFallback className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full p-2 h-8 w-8"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera className="w-3 h-3" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {uploading ? 'Carregando...' : 'Clique na câmera para alterar'}
            </p>
          </div>

          {/* Nickname Section */}
          <div className="space-y-2">
            <Label htmlFor="nickname" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Apelido</span>
            </Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Como você gostaria de ser chamado?"
            />
            <Button onClick={handleSaveProfile} className="w-full" variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Salvar Apelido
            </Button>
          </div>

          {/* Password Section */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>Alterar Senha</span>
            </Label>
            
            <div className="space-y-2">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha"
              />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar nova senha"
              />
              <Button 
                onClick={handlePasswordChange} 
                className="w-full"
                variant="outline"
                disabled={!newPassword || !confirmPassword}
              >
                <Lock className="w-4 h-4 mr-2" />
                Alterar Senha
              </Button>
            </div>
          </div>

          {/* User Info */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Email: {user?.email}</p>
          </div>

          <Button
            variant="destructive"
            className="w-full mt-4"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Excluir conta
          </Button>
        </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteAccount}
        title="Excluir conta?"
        description="Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos."
        confirmText="Excluir"
      />
    </>
  );
};