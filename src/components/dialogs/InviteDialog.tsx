import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppContext } from '@/contexts/AppContext';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/hooks/useAuth';
import { UserPlus, Check, X } from 'lucide-react';

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trailId: string | null;
  trailName?: string;
}

export const InviteDialog: React.FC<InviteDialogProps> = ({ open, onOpenChange, trailId, trailName }) => {
  const { user } = useAuth();
  const { friends, loading: friendsLoading } = useFriends();
  const { actions } = useAppContext();
  const { getInvitableFriends, inviteToTrail, cancelInvitation } = actions;

  const [invitableFriends, setInvitableFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitedFriendIds, setInvitedFriendIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchInvitable = async () => {
      if (open && trailId && friends.length > 0) {
        setLoading(true);
        const invitable = await getInvitableFriends(trailId, friends);
        setInvitableFriends(invitable);
        setLoading(false);
        setInvitedFriendIds(new Set()); // Reset invited list when dialog opens
      }
    };
    fetchInvitable();
  }, [open, trailId, friends]);

  const handleInvite = async (friendId: string) => {
    if (!trailId) return;
    const success = await inviteToTrail(trailId, friendId);
    if (success) {
      setInvitedFriendIds(prev => new Set(prev).add(friendId));
    }
  };

  const handleCancelInvite = async (friendId: string) => {
    if (!trailId) return;
    const success = await cancelInvitation(trailId, friendId);
    if (success) {
      setInvitedFriendIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    }
  };

  const filteredFriends = useMemo(() => {
    if (!searchQuery) {
      return invitableFriends;
    }
    return invitableFriends.filter(friend =>
      friend.friend_profile?.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, invitableFriends]);

  if (!trailId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Amigos para "{trailName}"</DialogTitle>
          <DialogDescription>
            Apenas amigos que ainda não fazem parte ou não foram convidados para esta trilha aparecerão aqui.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Buscar amigo por apelido..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {loading || friendsLoading ? (
              <p className="text-center text-gray-500">Carregando amigos...</p>
            ) : filteredFriends.length === 0 ? (
              <p className="text-center text-gray-500">Nenhum amigo disponível para convidar.</p>
            ) : (
              filteredFriends.map(friendship => {
                const friend = friendship.friend_profile;
                if (!friend) return null;

                const friendId = friend.user_id;
                const isInvited = invitedFriendIds.has(friendId);

                return (
                  <div key={friendship.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={friend.avatar_url || ''} />
                        <AvatarFallback>
                          {friend.nickname?.slice(0, 2).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{friend.nickname || `User #${friendId.slice(0,8)}`}</span>
                    </div>
                    {isInvited ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCancelInvite(friendId)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleInvite(friendId)}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Convidar
                      </Button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
