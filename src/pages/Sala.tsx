import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { StudyRoomHeader } from "@/components/Sala/StudyRoomHeader";
import { MembersPanel } from "@/components/Sala/MembersPanel";
import { GroupChat } from "@/components/Sala/GroupChat";
import { FeedAndRoomsPanel } from "@/components/Sala/FeedAndRoomsPanel";
import { EmptyRoomState } from "@/components/Sala/EmptyRoomState";
import { CreateRoomModal } from "@/components/Sala/CreateRoomModal";
import { AccessRequestModal } from "@/components/Sala/AccessRequestModal";
import { AccessRequestNotifications } from "@/components/Sala/AccessRequestNotifications";
import { useCreateRoom, useRoom, useRoomMembers, useRooms, useJoinRoom, useRequestAccess } from "@/hooks/useRooms";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "sonner";

// Mock data
const initialMembers = [
  {
    id: "1",
    name: "Paulo Andrade",
    initials: "PA",
    activity: "Foco em Português",
    isOnline: true,
    isHost: true,
  },
  {
    id: "2",
    name: "Júlia Ribeiro",
    initials: "JU",
    activity: "História • 30 min",
    isOnline: true,
  },
  {
    id: "3",
    name: "Alex Souza",
    initials: "AL",
    activity: "Álgebra",
    isOnline: false,
  },
  {
    id: "4",
    name: "Beatriz Lima",
    initials: "BE",
    activity: "Revisão ENEM",
    isOnline: true,
  },
];

const initialMessages = [
  {
    id: "1",
    sender: "Júlia",
    content: "Comecei a assistir à aula de Revolução Francesa.",
    timestamp: "há 2 min",
    isOwn: false,
  },
  {
    id: "2",
    sender: "Você",
    content: "Boa! Depois faço os exercícios de adjetivos.",
    timestamp: "há 1 min",
    isOwn: true,
  },
  {
    id: "3",
    sender: "Paulo",
    content: "Fiz o exercício vinculado à aula \"Adjetivos\" e acertei.",
    timestamp: "agora mesmo",
    isOwn: false,
  },
];

const initialActivities = [
  {
    id: "1",
    icon: "check-circle" as const,
    content: 'Paulo fez o exercício vinculado à aula <b>"Adjetivos"</b> e acertou.',
    timestamp: "agora mesmo",
  },
  {
    id: "2",
    icon: "graduation-cap" as const,
    content: "Júlia assistiu à aula de <b>Revolução Francesa</b> de 30 minutos.",
    timestamp: "há 3 min",
  },
  {
    id: "3",
    icon: "book-open" as const,
    content: "Alex revisou 20 flashcards de Álgebra.",
    timestamp: "há 12 min",
  },
];

// Load rooms from API instead of using mock data

export default function Sala() {
  const { roomId: urlRoomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { joinRoom, leaveRoom } = useSocket();
  const createRoomMutation = useCreateRoom();
  const joinRoomMutation = useJoinRoom();
  const requestAccess = useRequestAccess();
  const { data: roomData, isLoading: isLoadingRoom, error: roomError } = useRoom(urlRoomId || null);
  const { data: allRooms = [], isLoading: isLoadingRooms } = useRooms('all');
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const { data: roomMembers = [] } = useRoomMembers(roomId);
  const [userRole, setUserRole] = useState<'owner' | 'moderator' | 'member' | undefined>(undefined);
  const [isInRoom, setIsInRoom] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<{ id: string; name: string; visibility: 'public' | 'private'; owner_name?: string } | null>(null);
  const [members] = useState(initialMembers);
  const [messages, setMessages] = useState(initialMessages);
  const [activities] = useState(initialActivities);
  
  // Transform API rooms data to match the component interface
  const rooms = allRooms.map(room => ({
    id: room.id,
    name: room.name,
    code: room.code,
    isOwner: room.user_role === 'owner',
    visibility: room.visibility === 'public' ? 'pública' : 'privada' as 'pública' | 'privada',
    member_count: room.member_count,
    isFavorite: room.is_favorited,
  }));

  // Initialize room state based on API validation
  useEffect(() => {
    if (urlRoomId && roomData) {
      // Room data loaded successfully from API
      setRoomName(roomData.name);
      setRoomCode(roomData.code);
      setRoomId(roomData.id);
      setUserRole(roomData.user_role);
      setIsInRoom(true);
      
      // Update localStorage with validated data
      localStorage.setItem("currentRoom", roomData.name);
      localStorage.setItem("currentRoomCode", roomData.code);
      localStorage.setItem("currentRoomId", roomData.id);
    } else if (urlRoomId && roomError) {
      // Room access failed - user is not a member or room doesn't exist
      console.log("Room access denied:", roomError);
      toast.error("Você não tem acesso a esta sala ou ela não existe.");
      
      // Clear localStorage and redirect to sala list
      localStorage.removeItem("currentRoom");
      localStorage.removeItem("currentRoomCode");
      localStorage.removeItem("currentRoomId");
      navigate("/sala", { replace: true });
    } else if (!urlRoomId) {
      // No roomId in URL, check localStorage for previous session
      const storedRoomId = localStorage.getItem("currentRoomId");
      
      if (storedRoomId) {
        // User was in a room before, redirect to that room
        // The API will validate access when the component re-renders
        navigate(`/sala/${storedRoomId}`, { replace: true });
      } else {
        // No previous room, show empty state
        setIsInRoom(false);
        setRoomId(null);
      }
    }
  }, [urlRoomId, roomData, roomError, navigate]);

  // Event listeners para mudanças de role em tempo real
  useEffect(() => {
    const handleRoleMemberChanged = (event: CustomEvent) => {
      const { roomId: changedRoomId, memberId, newRole } = event.detail;
      
      if (changedRoomId === roomId) {
        // Invalidar cache dos membros da sala para atualizar a lista
        queryClient.invalidateQueries({ queryKey: ['room-members', roomId] });
        
        console.log(`Member ${memberId} role changed to ${newRole} in room ${roomId}`);
      }
    };

    const handleRoleUpdated = (event: CustomEvent) => {
      const { roomId: changedRoomId, newRole } = event.detail;
      
      if (changedRoomId === roomId) {
        // Atualizar o role do usuário atual
        setUserRole(newRole as 'owner' | 'moderator' | 'member');
        
        // Invalidar cache da sala para atualizar os dados
        queryClient.invalidateQueries({ queryKey: ['room', roomId] });
        queryClient.invalidateQueries({ queryKey: ['room-members', roomId] });
        
        toast.success(
          newRole === 'moderator' 
            ? 'Você foi promovido a moderador!' 
            : 'Você foi rebaixado para membro comum!'
        );
        
        console.log(`Your role changed to ${newRole} in room ${roomId}`);
      }
    };

    // Adicionar event listeners
    window.addEventListener('room-member-role-changed', handleRoleMemberChanged as EventListener);
    window.addEventListener('room-role-updated', handleRoleUpdated as EventListener);

    // Join room WebSocket quando entramos na sala
    if (roomId && isInRoom) {
      joinRoom(roomId);
    }

    return () => {
      // Remover event listeners
      window.removeEventListener('room-member-role-changed', handleRoleMemberChanged as EventListener);
      window.removeEventListener('room-role-updated', handleRoleUpdated as EventListener);
      
      // Leave room WebSocket quando saimos da sala
      if (roomId) {
        leaveRoom(roomId);
      }
    };
  }, [roomId, isInRoom, queryClient, joinRoom, leaveRoom]);

  const handleToggleFavorite = (roomId: string) => {
    // This will be handled by the useToggleFavorite hook in the component
    // For now, we can implement it later or use React Query mutation
    console.log('Toggle favorite for room:', roomId);
  };

  const handleJoinRoom = async (room: typeof rooms[0]) => {
    try {
      await joinRoomMutation.mutateAsync(room.id);
      
      // Update room info only on successful join
      setRoomName(room.name);
      setRoomCode(room.code);
      setRoomId(room.id);
      setUserRole(room.isOwner ? 'owner' : 'member');
      setIsInRoom(true);
      
      // Save to localStorage
      localStorage.setItem("currentRoom", room.name);
      localStorage.setItem("currentRoomCode", room.code);
      localStorage.setItem("currentRoomId", room.id);
      
      // Update URL
      navigate(`/sala/${room.id}`, { replace: true });
      
      // Add system message to chat
      const systemMessage = {
        id: Date.now().toString(),
        sender: "Sistema",
        content: `Você entrou em ${room.name} (${room.code}).`,
        timestamp: "agora mesmo",
        isOwn: false,
      };
      setMessages([...messages, systemMessage]);
    } catch (error: any) {
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj.requiresPermission || errorObj.requiresFriendship) {
          setSelectedRoom({
            id: room.id,
            name: room.name,
            visibility: room.visibility === 'pública' ? 'public' : 'private',
            owner_name: errorObj.roomInfo?.owner_name
          });
          setAccessModalOpen(true);
          return;
        }
      } catch {
        // Error normal já tratado pelo hook
      }
    }
  };

  // Adicionar handler para solicitação
  const handleRequestAccess = async (roomId: string, message?: string) => {
    await requestAccess.mutateAsync({ roomId, message });
    setAccessModalOpen(false);
    setSelectedRoom(null);
  };

  const handleCreateRoom = async (roomData: {
    name: string;
    description: string;
    visibility: "pública" | "privada";
    code: string;
  }) => {
    try {
      const apiVisibility = roomData.visibility === "privada" ? "private" : "public";
      
      const response = await createRoomMutation.mutateAsync({
        nome: roomData.name,
        descricao: roomData.description,
        visibilidade: apiVisibility
      });
      
      // Response contains the created room data directly
      const createdRoom = response;
      
      // Update room info
      setRoomName(createdRoom.nome);
      setRoomCode(createdRoom.code);
      setRoomId(createdRoom.id);
      setUserRole('owner');
      setIsInRoom(true);
      
      // Save to localStorage
      localStorage.setItem("currentRoom", createdRoom.nome);
      localStorage.setItem("currentRoomCode", createdRoom.code);
      localStorage.setItem("currentRoomId", createdRoom.id);
      
      // Update URL
      navigate(`/sala/${createdRoom.id}`, { replace: true });
      
      // Clear messages for new room
      setMessages([]);
      
      toast.success("Sala criada com sucesso!");
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error("Erro ao criar sala. Tente novamente.");
    }
  };

  const handleLeaveRoom = () => {
    // Clear room state
    setIsInRoom(false);
    setRoomName("");
    setRoomCode("");
    setRoomId(null);
    setUserRole(undefined);
    
    // Clear localStorage
    localStorage.removeItem("currentRoom");
    localStorage.removeItem("currentRoomCode");
    localStorage.removeItem("currentRoomId");
    
    // Navigate back to sala list
    navigate("/sala", { replace: true });
    
    // Clear messages
    setMessages([]);
  };

  // Show loading state while validating room access
  if (urlRoomId && isLoadingRoom) {
    return (
      <div className="flex-1 flex flex-col bg-background">
        <StudyRoomHeader
          roomName="Carregando..."
          roomCode=""
          roomId={null}
          userRole={undefined}
        onCreateRoom={() => setIsCreateRoomModalOpen(true)}
        onLeaveRoom={() => {}}
        currentMembers={[]}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-muted-foreground">Validando acesso à sala...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4.03rem)] flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <StudyRoomHeader
        roomName={isInRoom ? roomName : "Escolher Sala"}
        roomCode={isInRoom ? roomCode : ""}
        roomId={roomId}
        userRole={userRole}
        onCreateRoom={() => setIsCreateRoomModalOpen(true)}
        onLeaveRoom={handleLeaveRoom}
        currentMembers={isInRoom ? members.map(member => ({ id: member.id, name: member.name })) : []}
      />
      
      {isInRoom ? (
        // Full room layout with 3 columns
        <main className="flex-1 flex flex-col lg:grid lg:grid-cols-[240px_minmax(0,1fr)_280px] gap-2 p-2 lg:gap-3 lg:p-3 min-h-0 overflow-hidden">
          {/* Mobile: Chat first, then members and rooms in tabs or separate views */}
          <div className="flex-1 flex flex-col lg:order-2 min-h-0">
            <GroupChat 
              roomId={roomId} 
              roomName={roomName}
              memberCount={roomMembers.length}
            />
          </div>
          
          {/* Mobile: Bottom sections, Desktop: Left panel */}
          <div className="lg:order-1 lg:flex lg:flex-col min-h-0">
            <MembersPanel 
              roomId={roomId}
              userRole={userRole}
              onAddMember={() => console.log("Add member")}
            />
          </div>
          
          {/* Mobile: Can be hidden/toggled, Desktop: Right panel */}
          <div className="lg:order-3 lg:flex lg:flex-col min-h-0">
            <FeedAndRoomsPanel
              activities={activities}
              rooms={rooms}
              onToggleFavorite={handleToggleFavorite}
              onJoinRoom={handleJoinRoom}
              onCreateRoom={() => setIsCreateRoomModalOpen(true)}
            />
          </div>
        </main>
      ) : (
        // Empty state layout
        <main className="flex-1 flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_280px] gap-2 p-2 lg:gap-3 lg:p-3 min-h-0 overflow-hidden">
          {/* Mobile: Rooms list first */}
          <div className="lg:order-2 mb-4 lg:mb-0 min-h-0">
            <FeedAndRoomsPanel
              activities={[]} // No activities when not in a room
              rooms={rooms}
              onToggleFavorite={handleToggleFavorite}
              onJoinRoom={handleJoinRoom}
              onCreateRoom={() => setIsCreateRoomModalOpen(true)}
              showActivities={false} // Don't show activities section
            />
          </div>
          
          {/* Mobile: Create room state below */}
          <div className="flex-1 flex items-center justify-center lg:order-1 min-h-0">
            <EmptyRoomState onCreateRoom={() => setIsCreateRoomModalOpen(true)} />
          </div>
        </main>
      )}
      
      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />

      {/* Access Request Modal */}
      <AccessRequestModal
        isOpen={accessModalOpen}
        onClose={() => {
          setAccessModalOpen(false);
          setSelectedRoom(null);
        }}
        room={selectedRoom}
        onRequestAccess={handleRequestAccess}
      />

      {/* Access Request Notifications */}
      <AccessRequestNotifications />
    </div>
  );
}