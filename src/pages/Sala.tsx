import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { StudyRoomHeader } from "@/components/Sala/StudyRoomHeader";
import { MembersPanel } from "@/components/Sala/MembersPanel";
import { ChatPanel } from "@/components/Sala/ChatPanel";
import { FeedAndRoomsPanel } from "@/components/Sala/FeedAndRoomsPanel";
import { EmptyRoomState } from "@/components/Sala/EmptyRoomState";
import { CreateRoomModal } from "@/components/Sala/CreateRoomModal";

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

const initialRooms = [
  {
    id: "r1",
    name: "Português — Adjetivos",
    code: "#A1",
    isOwner: true,
    visibility: "pública" as const,
    members: 18,
    isFavorite: false,
  },
  {
    id: "r2",
    name: "Redação — Temas atuais",
    code: "#R2",
    isOwner: true,
    visibility: "privada" as const,
    members: 9,
    isFavorite: false,
  },
  {
    id: "r3",
    name: "História — Rev. Francesa",
    code: "#H3",
    isOwner: false,
    visibility: "pública" as const,
    members: 50,
    isFavorite: true,
  },
  {
    id: "r4",
    name: "Matemática — Álgebra",
    code: "#M4",
    isOwner: false,
    visibility: "privada" as const,
    members: 12,
    isFavorite: false,
  },
  {
    id: "r5",
    name: "Inglês — Listening",
    code: "#I5",
    isOwner: false,
    visibility: "pública" as const,
    members: 27,
    isFavorite: false,
  },
];

export default function Sala() {
  const { theme, toggleTheme } = useTheme();
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [members] = useState(initialMembers);
  const [messages, setMessages] = useState(initialMessages);
  const [activities] = useState(initialActivities);
  const [rooms, setRooms] = useState(initialRooms);

  // Initialize room state from localStorage and URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlRoom = params.get("sala") || params.get("room");
    const urlCode = params.get("code");
    
    // Check if user was in a room before
    const storedRoom = localStorage.getItem("currentRoom");
    const storedCode = localStorage.getItem("currentRoomCode");
    
    if (urlRoom && urlCode) {
      // URL has room info, use it
      setRoomName(urlRoom);
      setRoomCode(urlCode);
      setIsInRoom(true);
      // Save to localStorage
      localStorage.setItem("currentRoom", urlRoom);
      localStorage.setItem("currentRoomCode", urlCode);
    } else if (storedRoom && storedCode) {
      // Use stored room info
      setRoomName(storedRoom);
      setRoomCode(storedCode);
      setIsInRoom(true);
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set("sala", storedRoom);
      url.searchParams.set("code", storedCode);
      window.history.replaceState({}, "", url);
    } else {
      // No room info, show empty state
      setIsInRoom(false);
    }
  }, []);

  const handleSendMessage = (content: string) => {
    const newMessage = {
      id: Date.now().toString(),
      sender: "Você",
      content,
      timestamp: "agora mesmo",
      isOwn: true,
    };
    setMessages([...messages, newMessage]);
  };

  const handleToggleFavorite = (roomId: string) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { ...room, isFavorite: !room.isFavorite }
        : room
    ));
  };

  const handleJoinRoom = (room: typeof initialRooms[0]) => {
    
    // Update room info
    setRoomName(room.name);
    setRoomCode(room.code);
    setIsInRoom(true);
    
    // Save to localStorage
    localStorage.setItem("currentRoom", room.name);
    localStorage.setItem("currentRoomCode", room.code);
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("sala", room.name);
    url.searchParams.set("code", room.code);
    window.history.replaceState({}, "", url);
    
    // Add system message to chat
    const systemMessage = {
      id: Date.now().toString(),
      sender: "Sistema",
      content: `Você entrou em ${room.name} (${room.code}).`,
      timestamp: "agora mesmo",
      isOwn: false,
    };
    setMessages([...messages, systemMessage]);
  };

  const handleCreateRoom = (roomData: {
    name: string;
    description: string;
    visibility: "pública" | "privada";
    code: string;
  }) => {
    // Update room info
    setRoomName(roomData.name);
    setRoomCode(roomData.code);
    setIsInRoom(true);
    
    // Save to localStorage
    localStorage.setItem("currentRoom", roomData.name);
    localStorage.setItem("currentRoomCode", roomData.code);
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("sala", roomData.name);
    url.searchParams.set("code", roomData.code);
    window.history.replaceState({}, "", url);
    
    // Add new room to rooms list
    const newRoom = {
      id: `r${Date.now()}`,
      name: roomData.name,
      code: roomData.code,
      isOwner: true,
      visibility: roomData.visibility,
      members: 1,
      isFavorite: false,
    };
    setRooms([newRoom, ...rooms]);
    
    // Add welcome message
    const welcomeMessage = {
      id: Date.now().toString(),
      sender: "Sistema",
      content: `Bem-vindo à sua nova sala "${roomData.name}"! Convide membros para começar a colaborar.`,
      timestamp: "agora mesmo",
      isOwn: false,
    };
    setMessages([welcomeMessage]);
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <StudyRoomHeader
        roomName={isInRoom ? roomName : "Escolher Sala"}
        roomCode={isInRoom ? roomCode : ""}
        isDark={theme === 'dark'}
        onToggleTheme={toggleTheme}
        onCreateRoom={() => setIsCreateRoomModalOpen(true)}
        currentMembers={isInRoom ? members.map(member => ({ id: member.id, name: member.name })) : []}
      />
      
      {isInRoom ? (
        // Full room layout with 3 columns
        <main className="flex-1 flex flex-col lg:grid lg:grid-cols-[240px_minmax(0,1fr)_320px] xl:grid-cols-[280px_minmax(0,1fr)_360px] gap-3 p-3 lg:gap-4 lg:p-4 max-w-[100vw] overflow-hidden">
          {/* Mobile: Chat first, then members and rooms in tabs or separate views */}
          <div className="flex-1 flex flex-col lg:order-2 min-h-0">
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          </div>
          
          {/* Mobile: Bottom sections, Desktop: Left panel */}
          <div className="lg:order-1 lg:flex lg:flex-col">
            <MembersPanel 
              members={members}
              onAddMember={() => console.log("Add member")}
              onLeaveRoom={() => console.log("Leave room")}
            />
          </div>
          
          {/* Mobile: Can be hidden/toggled, Desktop: Right panel */}
          <div className="lg:order-3 lg:flex lg:flex-col">
            <FeedAndRoomsPanel
              activities={activities}
              rooms={rooms}
              onToggleFavorite={handleToggleFavorite}
              onJoinRoom={handleJoinRoom}
            />
          </div>
        </main>
      ) : (
        // Empty state layout
        <main className="flex-1 flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] gap-3 p-3 lg:gap-4 lg:p-4 max-w-[100vw] overflow-hidden">
          {/* Mobile: Rooms list first */}
          <div className="lg:order-2 mb-4 lg:mb-0">
            <FeedAndRoomsPanel
              activities={[]} // No activities when not in a room
              rooms={rooms}
              onToggleFavorite={handleToggleFavorite}
              onJoinRoom={handleJoinRoom}
              showActivities={false} // Don't show activities section
            />
          </div>
          
          {/* Mobile: Create room state below */}
          <div className="flex-1 flex items-center justify-center lg:order-1">
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
    </div>
  );
}