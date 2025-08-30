import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFriends } from '@/hooks/useFriends';
import { useSocket } from '@/contexts/SocketContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  MoreVertical, 
  MessageCircle, 
  UserMinus,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function FriendsList() {
  const { friends, loading, error, retry } = useFriends();
  const { onlineUsers } = useSocket();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [friendToRemove, setFriendToRemove] = useState<{ id: string; name: string } | null>(null);

  const friendsWithStatus = friends.map(friend => ({
    ...friend,
    status: onlineUsers.has(friend.id) ? 'online' as const : 'offline' as const
  }));

  const onlineFriends = friendsWithStatus.filter(friend => friend.status === 'online');
  const offlineFriends = friendsWithStatus.filter(friend => friend.status === 'offline');

  const handleViewProfile = (nickname: string) => {
    navigate(`/perfil/${nickname}`);
  };

  const handleSendMessage = (friendId: string) => {
    // This would navigate to chat with this friend
    // For now, just show a toast
    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'Chat será implementado em breve',
    });
  };

  const handleRemoveFriend = useCallback(async (friendId: string) => {
    if (!friendToRemove) return;
    
    setRemovingId(friendId);
    
    try {
      // This would call the API to remove friend
      // For now, just show a toast
      toast({
        title: 'Funcionalidade em desenvolvimento',
        description: 'Remover amigo será implementado em breve',
      });
      
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o amigo',
        variant: 'destructive',
      });
    } finally {
      setRemovingId(null);
      setFriendToRemove(null);
    }
  }, [friendToRemove, toast]);

  const confirmRemoveFriend = (friend: { id: string; name: string }) => {
    setFriendToRemove(friend);
  };

  const FriendCard = ({ friend }: { friend: typeof friendsWithStatus[0] }) => (
    <Card key={friend.id} className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12">
              {friend.avatarUrl ? (
                <AvatarImage src={friend.avatarUrl} alt={friend.name} />
              ) : (
                <AvatarFallback>
                  {friend.avatar}
                </AvatarFallback>
              )}
            </Avatar>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
              friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{friend.name}</h4>
              <Badge variant="secondary">@{friend.nickname}</Badge>
              <Badge 
                variant={friend.status === 'online' ? 'default' : 'outline'}
                className={friend.status === 'online' ? 'bg-green-100 text-green-800' : ''}
              >
                {friend.status === 'online' ? 'Online' : 'Offline'}
              </Badge>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewProfile(friend.nickname)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSendMessage(friend.id)}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar mensagem
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => confirmRemoveFriend({ id: friend.id, name: friend.name })}
                className="text-destructive"
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Remover amigo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando amigos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Erro ao carregar amigos</span>
            </div>
            <Button variant="outline" size="sm" onClick={retry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Nenhum amigo ainda</p>
          <p className="text-sm">Use a aba "Buscar" para encontrar e adicionar amigos</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground">
            Meus amigos ({friends.length})
          </h3>
          <Button variant="outline" size="sm" onClick={retry} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {onlineFriends.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Online ({onlineFriends.length})
            </h4>
            {onlineFriends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        )}

        {offlineFriends.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Offline ({offlineFriends.length})
            </h4>
            {offlineFriends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!friendToRemove} onOpenChange={() => setFriendToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover amigo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {friendToRemove?.name} da sua lista de amigos? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => friendToRemove && handleRemoveFriend(friendToRemove.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removingId === friendToRemove?.id}
            >
              {removingId === friendToRemove?.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserMinus className="h-4 w-4 mr-2" />
              )}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}