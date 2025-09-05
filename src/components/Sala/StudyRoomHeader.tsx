import { Library, Link2, UserPlus, Plus, LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { InviteModal } from "./InviteModal";
import { LeaveRoomModal } from "./LeaveRoomModal";
import { DeleteRoomModal } from "./DeleteRoomModal";
import { useState } from "react";
import { useLeaveRoom, useDeleteRoom } from "@/hooks/useRooms";
import { useNavigate } from "react-router-dom";

interface StudyRoomHeaderProps {
  roomName: string;
  roomCode?: string;
  roomId?: string;
  userRole?: 'owner' | 'moderator' | 'member';
  onCreateRoom?: () => void;
  onLeaveRoom?: () => void;
  currentMembers?: { id: string; name: string }[];
}

export function StudyRoomHeader({ roomName, roomCode, roomId, userRole, onCreateRoom, onLeaveRoom, currentMembers }: StudyRoomHeaderProps) {
  const { toast } = useToast();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const leaveRoomMutation = useLeaveRoom();
  const deleteRoomMutation = useDeleteRoom();
  const navigate = useNavigate();

  // Verificar se usuário pode convidar (apenas moderadores e donos)
  const canInvite = userRole === 'owner' || userRole === 'moderator';
  
  // Verificar se usuário pode excluir sala (apenas donos)
  const canDeleteRoom = userRole === 'owner';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link da sala foi copiado para sua área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId) return;
    
    try {
      await leaveRoomMutation.mutateAsync(roomId);
      setShowLeaveModal(false);
      if (onLeaveRoom) {
        onLeaveRoom();
      }
    } catch (error) {
      console.error('Erro ao sair da sala:', error);
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomId) return;
    
    try {
      await deleteRoomMutation.mutateAsync(roomId);
      setShowDeleteModal(false);
      // Redirecionar para o feed após excluir
      navigate('/feed');
    } catch (error) {
      console.error('Erro ao excluir sala:', error);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-card border-b border-border px-3 lg:px-4 py-2 lg:py-3 flex items-center gap-2 lg:gap-3 min-h-[56px]">
        <Library className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
        <h1 className="text-base lg:text-xl font-semibold truncate flex-1 min-w-0">{roomName}</h1>
        {roomCode && (
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            {roomCode}
          </Badge>
        )}
        
        <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onCreateRoom}>
              <Plus className="h-4 w-4" />
              Criar Sala
            </Button>
            
            {roomCode && (
              <Button variant="outline" size="sm" onClick={() => setShowLeaveModal(true)}>
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            )}
            
            {roomCode && canDeleteRoom && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDeleteModal(true)}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20"
              >
                <Trash2 className="h-4 w-4" />
                Excluir Sala
              </Button>
            )}
            
            {roomCode && (
              <>
                {canInvite && (
                  <Button variant="outline" size="sm" onClick={() => setShowInviteModal(true)}>
                    <UserPlus className="h-4 w-4" />
                    Convidar
                  </Button>
                )}
                
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  <Link2 className="h-4 w-4" />
                  Copiar Link
                </Button>
              </>
            )}
          </div>
          
          {/* Mobile compact buttons */}
          <div className="md:hidden flex items-center gap-1">
            {onCreateRoom && (
              <Button variant="outline" size="sm" onClick={onCreateRoom}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
            
            {roomCode && canInvite && (
              <Button variant="outline" size="sm" onClick={() => setShowInviteModal(true)}>
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
          </div>
          
        </div>
      </header>
      
        {roomId && (
          <InviteModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            roomId={roomId}
            currentMembers={currentMembers || []}
          />
        )}
        
        <LeaveRoomModal
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          onConfirm={handleLeaveRoom}
          roomName={roomName}
          isLoading={leaveRoomMutation.isPending}
        />
        
        <DeleteRoomModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteRoom}
          roomName={roomName}
          isLoading={deleteRoomMutation.isPending}
        />
    </>
  );
}