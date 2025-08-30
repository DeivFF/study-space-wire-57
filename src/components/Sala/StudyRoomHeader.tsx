import { Library, Link2, Moon, Sun, UserPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { InviteModal } from "./InviteModal";
import { useState } from "react";

interface StudyRoomHeaderProps {
  roomName: string;
  roomCode: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onCreateRoom?: () => void;
  currentMembers?: { id: string; name: string }[];
}

export function StudyRoomHeader({ roomName, roomCode, isDark, onToggleTheme, onCreateRoom, currentMembers }: StudyRoomHeaderProps) {
  const { toast } = useToast();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

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
              <>
                <Button variant="outline" size="sm" onClick={() => setIsInviteModalOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  Convidar
                </Button>
                
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
            
            {roomCode && (
              <Button variant="outline" size="sm" onClick={() => setIsInviteModalOpen(true)}>
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleTheme}
            className="ml-1"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>
      
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        roomName={roomName}
        roomCode={roomCode}
        currentMembers={currentMembers || []}
      />
    </>
  );
}