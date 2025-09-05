import { useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useApproveAccessRequest, useRejectAccessRequest } from "@/hooks/useRooms";
import { useNavigate } from "react-router-dom";

export function AccessRequestNotifications() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const approveRequest = useApproveAccessRequest();
  const rejectRequest = useRejectAccessRequest();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!socket) return;
    
    // Notificação quando solicitação é aprovada
    const handleAccessApproved = ({ roomId, roomName, approvedBy }: any) => {
      toast.success(`Seu acesso à sala "${roomName}" foi aprovado!`);
      
      // Invalidar queries para atualizar lista de salas
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      
      // Redirecionar automaticamente se usuário quiser
      const autoJoin = confirm(`Deseja entrar na sala "${roomName}" agora?`);
      if (autoJoin) {
        navigate(`/sala/${roomId}`);
      }
    };
    
    // Notificação quando solicitação é rejeitada
    const handleAccessRejected = ({ roomName, rejectedBy, reason }: any) => {
      toast.error(`Seu acesso à sala "${roomName}" foi negado.`);
    };
    
    // Notificação para owner/moderator sobre nova solicitação
    const handleNewAccessRequest = ({ 
      roomId, 
      roomName, 
      requesterName, 
      requestId 
    }: any) => {
      const handleApproveClick = () => {
        approveRequest.mutate({ roomId, requestId });
        toast.dismiss();
      };

      const handleRejectClick = () => {
        rejectRequest.mutate({ roomId, requestId });
        toast.dismiss();
      };

      toast(
        <div className="space-y-2">
          <p className="font-medium">Nova solicitação de acesso</p>
          <p className="text-sm">{requesterName} quer entrar na sala "{roomName}"</p>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              onClick={handleApproveClick}
              disabled={approveRequest.isPending}
            >
              Aprovar
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleRejectClick}
              disabled={rejectRequest.isPending}
            >
              Negar
            </Button>
          </div>
        </div>,
        { duration: 10000 }
      );
    };
    
    socket.on('room:access_approved', handleAccessApproved);
    socket.on('room:access_rejected', handleAccessRejected);
    socket.on('room:access_requested', handleNewAccessRequest);
    
    return () => {
      socket.off('room:access_approved', handleAccessApproved);
      socket.off('room:access_rejected', handleAccessRejected);
      socket.off('room:access_requested', handleNewAccessRequest);
    };
  }, [socket, queryClient, approveRequest, rejectRequest, navigate]);
  
  return null; // Componente apenas para side effects
}