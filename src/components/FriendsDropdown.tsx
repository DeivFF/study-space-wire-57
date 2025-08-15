import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Users, Trash2, Check, X, MoreVertical } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/hooks/useAuth';

export const FriendsDropdown = () => {
  const { user } = useAuth();
  const [nickname, setNickname] = useState('');
  const {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend
  } = useFriends();

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      await sendFriendRequest(nickname.trim());
      setNickname('');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Users className="w-4 h-4" />
          <span>Amigos</span>
          {pendingRequests.length > 0 && (
            <Badge variant="destructive" className="ml-1 text-xs">
              {pendingRequests.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-4">
        <div className="space-y-4">
          <form onSubmit={handleSendRequest} className="space-y-2">
            <Label htmlFor="nickname-dropdown">Adicionar amigo</Label>
            <div className="flex space-x-2">
              <Input
                id="nickname-dropdown"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Apelido do usuário"
                required
              />
              <Button type="submit" size="sm">
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
          </form>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Amigos ({friends.length})</h3>
            {loading ? (
              <p className="text-xs text-center">Carregando...</p>
            ) : friends.length === 0 ? (
              <p className="text-xs text-muted-foreground">Você ainda não tem amigos.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {friends.map((friendship) => {
                  const lastSeen = friendship.friend_profile?.last_seen;
                  const isInactive = lastSeen ? Date.now() - new Date(lastSeen).getTime() > 5 * 60 * 1000 : false;
                  const isOnline = friendship.friend_profile?.status === 'online' && !isInactive;
                  return (
                    <div key={friendship.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {friendship.friend_profile?.nickname?.substring(0, 2).toUpperCase() || 'AM'}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute bottom-0 right-0 block h-2 w-2 rounded-full ${
                              isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                        </div>
                        <div className="text-xs font-medium">
                          {friendship.friend_profile?.nickname || `Usuário #${(friendship.user1_id === user?.id ? friendship.user2_id : friendship.user1_id)?.substring(0, 8)}`}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-6 w-6">
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => removeFriend(friendship.id)} className="text-red-500">
                              <Trash2 className="w-3 h-3 mr-2" />
                              Remover Amigo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {sentRequests.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Convites enviados ({sentRequests.length})</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {sentRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                      <div className="text-xs">
                        {request.receiver_profile?.nickname || `Usuário #${request.receiver_id.substring(0, 8)}`}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge variant="secondary">Aguardando</Badge>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600 hover:text-red-700" onClick={() => cancelFriendRequest(request.id)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
