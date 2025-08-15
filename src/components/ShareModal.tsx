import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useFriends } from '@/hooks/useFriends';
import type { Friendship } from '@/contexts/FriendsContext';
import { useAuth } from '@/hooks/useAuth';
import { Send } from 'lucide-react';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFriend: (friendId: string) => void;
  contentTitle: string;
}

export const ShareModal = ({
  open,
  onOpenChange,
  onSelectFriend,
  contentTitle,
}: ShareModalProps) => {
  const { user } = useAuth();
  const { friends, loading } = useFriends();

  const handleSelect = (friendship: Friendship) => {
    if (!user) return;
    const friendId =
      friendship.user1_id === user.id
        ? friendship.user2_id
        : friendship.user1_id;
    onSelectFriend(friendId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Send className="w-5 h-5" />
            <span>Compartilhar Conteúdo</span>
          </DialogTitle>
          <DialogDescription>
            Selecione um amigo para compartilhar "{contentTitle}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Seus Amigos ({friends.length})
          </h3>

          {loading ? (
            <div className="text-center py-8">Carregando amigos...</div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Você não tem amigos para compartilhar.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {friends.map(friendship => {
                const friendProfile = friendship.friend_profile;
                const friendNickname =
                  friendProfile?.nickname ||
                  `Usuário #${(friendProfile?.user_id || '').substring(0, 8)}`;

                return (
                  <div
                    key={friendship.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {friendNickname.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">
                          {friendNickname}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelect(friendship)}
                    >
                      <Send className="w-3 h-3 mr-2" />
                      Enviar
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
