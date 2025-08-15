import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreVertical, Shield, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Participant {
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  profile?: {
    nickname: string;
    avatar_url?: string;
  };
}

interface StudyRoomParticipantsProps {
  participants: Participant[];
  currentUserRole: 'owner' | 'admin' | 'member' | null;
  roomId: string;
}

const RoleBadge = ({ role }: { role: string }) => {
  const roleInfo = {
    owner: { label: 'Dono', color: 'bg-yellow-500' },
    admin: { label: 'Admin', color: 'bg-blue-500' },
    member: { label: 'Membro', color: 'bg-gray-400' },
  };
  const info = roleInfo[role] || roleInfo.member;
  return (
    <Badge className={`text-white text-xs ${info.color}`}>{info.label}</Badge>
  );
};

const ParticipantActions = ({ participant, currentUserRole, roomId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isSelf = participant.user_id === user?.id;

  if (isSelf || !currentUserRole || currentUserRole === 'member') {
    return null;
  }

  const handlePromote = async () => {
    try {
      const { error } = await supabase.rpc('promote_to_admin', { p_room_id: roomId, p_member_id: participant.user_id });
      if (error) throw error;
      toast({ title: "Sucesso", description: `${participant.profile.nickname} foi promovido a admin.` });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleRemove = async () => {
    if (!window.confirm(`Tem certeza que deseja remover ${participant.profile.nickname}?`)) return;
    try {
      const { error } = await supabase.rpc('remove_from_room', { p_room_id: roomId, p_member_id: participant.user_id });
      if (error) throw error;
      toast({ title: "Sucesso", description: `${participant.profile.nickname} foi removido da sala.` });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const canManage =
    (currentUserRole === 'owner' && participant.role !== 'owner') ||
    (currentUserRole === 'admin' && participant.role === 'member');

  if (!canManage) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentUserRole === 'owner' && participant.role === 'member' && (
          <DropdownMenuItem onClick={handlePromote}>
            <Shield className="w-4 h-4 mr-2" />
            Promover a Admin
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleRemove} className="text-red-600">
          <Trash2 className="w-4 h-4 mr-2" />
          Remover da Sala
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const StudyRoomParticipants: React.FC<StudyRoomParticipantsProps> = ({
  participants,
  currentUserRole,
  roomId
}) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Participantes</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {participants.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {participants.map((participant) => (
          <div key={participant.user_id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
            <Avatar className="w-8 h-8">
              <AvatarImage
                src={participant.profile?.avatar_url}
                alt={participant.profile?.nickname || 'Usuário'}
              />
              <AvatarFallback className="text-xs">
                {participant.profile?.nickname?.substring(0, 2).toUpperCase() || 'US'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {participant.profile?.nickname || 'Usuário'}
              </p>
              <RoleBadge role={participant.role} />
            </div>
            <ParticipantActions
              participant={participant}
              currentUserRole={currentUserRole}
              roomId={roomId}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default StudyRoomParticipants;