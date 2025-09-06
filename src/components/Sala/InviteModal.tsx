import { useState, useEffect } from "react";
import { Search, UserPlus, X, Check, Clock, Users, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useRoomInvites, useSendInvite, useRevokeInvite } from "@/hooks/useRooms";
import { useConnectionsList } from "@/hooks/useConnections";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  currentMembers?: { id: string; name: string }[];
}

export function InviteModal({ isOpen, onClose, roomId, currentMembers = [] }: InviteModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Usar sistema de amigos em vez de busca geral
  const { data: connections = [], isLoading: connectionsLoading } = useConnectionsList('accepted');
  const { data: invites = [], isLoading: invitesLoading } = useRoomInvites(roomId);
  const sendInviteMutation = useSendInvite();
  const revokeInviteMutation = useRevokeInvite();

  // Filtrar amigos que já são membros ou já foram convidados
  const memberIds = new Set(currentMembers.map(m => m.id));
  const invitedIds = new Set(invites.map(i => i.invited_user_id));
  
  const availableFriends = connections
    .filter(connection => 
      !memberIds.has(connection.user.id) && 
      !invitedIds.has(connection.user.id) &&
      connection.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleInviteUser = (userId: string) => {
    sendInviteMutation.mutate({ roomId, userId });
  };

  const handleRevokeInvite = (inviteId: string) => {
    revokeInviteMutation.mutate({ roomId, inviteId });
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Convidar para a sala
          </DialogTitle>
          <DialogDescription>
            Busque e convide usuários para participar da sua sala de estudo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar entre seus amigos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="available" className="flex flex-col flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="available">
                Amigos ({availableFriends.length})
              </TabsTrigger>
              <TabsTrigger value="invited">
                Convidados ({invites.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="flex-1 mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {connectionsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Carregando amigos...</p>
                    </div>
                  ) : availableFriends.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>
                        {searchQuery.length > 0 
                          ? "Nenhum amigo encontrado com esse nome."
                          : connections.length === 0 
                            ? "Você ainda não tem amigos. Adicione amigos para convidá-los para suas salas!"
                            : "Todos os seus amigos já são membros desta sala ou já foram convidados."
                        }
                      </p>
                    </div>
                  ) : (
                    availableFriends.map((connection) => {
                      const friend = connection.user;
                      const getInitials = (name: string) => {
                        return name
                          .split(' ')
                          .map(part => part[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2);
                      };
                      
                      return (
                        <div
                          key={connection.id}
                          className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-sm font-semibold bg-primary/10">
                              {getInitials(friend.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{friend.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {friend.email}
                            </div>
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            Amigo
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => handleInviteUser(friend.id)}
                            disabled={sendInviteMutation.isPending}
                            className="ml-2"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            {sendInviteMutation.isPending ? "Enviando..." : "Convidar"}
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="invited" className="flex-1 mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {invitesLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Carregando convites...</p>
                    </div>
                  ) : invites.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum convite pendente.</p>
                    </div>
                  ) : (
                    invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-sm font-semibold bg-primary/10">
                            {invite.invited_user_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{invite.invited_user_name}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {invite.invited_user_email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Convidado por {invite.invited_by_name} • {new Date(invite.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="default">Convidado</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeInvite(invite.id)}
                          disabled={revokeInviteMutation.isPending}
                          className="ml-2"
                        >
                          <X className="h-4 w-4 mr-1" />
                          {revokeInviteMutation.isPending ? "Revogando..." : "Revogar"}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}