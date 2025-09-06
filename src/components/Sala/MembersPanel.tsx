import { Users, UserPlus, LogOut, Loader2, MoreVertical, User, Shield, UserX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useRoomMembers, useLeaveRoom, usePromoteMember, useDemoteMember, useKickMember, Member } from "@/hooks/useRooms";
import { useAuth } from "@/contexts/AuthContext";

interface MembersPanelProps {
  roomId: string | null;
  userRole?: 'owner' | 'moderator' | 'member';
  onAddMember?: () => void;
}

export function MembersPanel({ roomId, userRole, onAddMember }: MembersPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
  // Buscar membros reais da API
  const { data: members = [], isLoading, error } = useRoomMembers(roomId);
  const leaveRoomMutation = useLeaveRoom();
  const promoteMemberMutation = usePromoteMember();
  const demoteMemberMutation = useDemoteMember();
  const kickMemberMutation = useKickMember();

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Função para gerar iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Verificar se usuário pode convidar (apenas moderadores e donos)
  const canInvite = userRole === 'owner' || userRole === 'moderator';

  const handleLeaveRoom = async () => {
    if (!roomId) return;
    
    try {
      await leaveRoomMutation.mutateAsync(roomId);
    } catch (error) {
      console.error('Erro ao sair da sala:', error);
    }
  };

  const handlePromoteMember = async (memberId: string) => {
    if (!roomId) return;
    try {
      await promoteMemberMutation.mutateAsync({ roomId, memberId });
    } catch (error) {
      console.error('Erro ao promover membro:', error);
    }
  };

  const handleDemoteMember = async (memberId: string) => {
    if (!roomId) return;
    try {
      await demoteMemberMutation.mutateAsync({ roomId, memberId });
    } catch (error) {
      console.error('Erro ao rebaixar moderador:', error);
    }
  };

  const handleKickMember = async (memberId: string) => {
    if (!roomId) return;
    try {
      await kickMemberMutation.mutateAsync({ roomId, memberId });
    } catch (error) {
      console.error('Erro ao expulsar membro:', error);
    }
  };

  const canManageMember = (member: Member) => {
    if (!user || member.id === user.id) return false;
    if (member.role === 'owner') return false;
    if (userRole === 'owner') return true;
    if (userRole === 'moderator' && member.role === 'member') return true;
    return false;
  };

  return (
    <section className="bg-card border border-border rounded-2xl shadow-lg flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="p-2 lg:p-3 border-b border-border flex items-center gap-2 lg:gap-3">
        <Users className="h-4 w-4 lg:h-5 lg:w-5" />
        <h2 className="text-base lg:text-lg font-semibold">Membros</h2>
        <div className="flex-1" />
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span className="text-sm text-muted-foreground">{members.length}</span>
        )}
      </div>

      {/* Body */}
      <div className="p-2 lg:p-3 flex flex-col gap-2 lg:gap-3 flex-1 min-h-0 overflow-auto">
        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Buscar membro"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm"
            disabled={isLoading}
          />
          {canInvite && (
            <Button variant="outline" size="sm" onClick={onAddMember} className="px-2">
              <UserPlus className="h-4 w-4" />
              <span className="sr-only">Adicionar membro</span>
            </Button>
          )}
        </div>

        {/* Members List */}
        <div className="flex flex-col gap-1.5 lg:gap-2 flex-1 min-h-0 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando membros...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-sm text-red-500">
              Erro ao carregar membros
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {searchQuery ? 'Nenhum membro encontrado' : 'Nenhum membro na sala'}
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 lg:gap-3 p-2 border border-border rounded-xl bg-muted/30"
              >
                <Avatar className="h-6 w-6 lg:h-7 lg:w-7 flex-shrink-0">
                  <AvatarFallback className="text-xs font-semibold bg-primary/10">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 lg:gap-2">
                    <span className="font-semibold truncate text-sm lg:text-base">{member.name}</span>
                    {member.role === 'owner' && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0 hidden sm:inline-flex">
                        dono
                      </Badge>
                    )}
                    {member.role === 'moderator' && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 hidden sm:inline-flex">
                        mod
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {member.email}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full flex-shrink-0 bg-green-500"
                    title="membro ativo"
                  />
                  
                  {canManageMember(member) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-muted"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="gap-2">
                          <User className="h-4 w-4" />
                          Ver perfil
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {member.role === 'member' ? (
                          <DropdownMenuItem 
                            className="gap-2"
                            onClick={() => handlePromoteMember(member.id)}
                            disabled={promoteMemberMutation.isPending}
                          >
                            <Shield className="h-4 w-4" />
                            {promoteMemberMutation.isPending ? 'Promovendo...' : 'Promover moderador'}
                          </DropdownMenuItem>
                        ) : member.role === 'moderator' ? (
                          <DropdownMenuItem 
                            className="gap-2"
                            onClick={() => handleDemoteMember(member.id)}
                            disabled={demoteMemberMutation.isPending}
                          >
                            <User className="h-4 w-4" />
                            {demoteMemberMutation.isPending ? 'Rebaixando...' : 'Tornar membro'}
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="gap-2 text-red-600 focus:text-red-600"
                          onClick={() => handleKickMember(member.id)}
                          disabled={kickMemberMutation.isPending}
                        >
                          <UserX className="h-4 w-4" />
                          {kickMemberMutation.isPending ? 'Expulsando...' : 'Expulsar'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Leave Room Button */}
        <div className="flex justify-end pt-2 lg:pt-3 border-t border-border/50">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLeaveRoom} 
            className="px-2"
            disabled={leaveRoomMutation.isPending}
          >
            {leaveRoomMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span className="sr-only">Sair da sala</span>
          </Button>
        </div>
      </div>
    </section>
  );
}