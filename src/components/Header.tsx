import { Timer, Users, LogOut, Route, ChevronDown, Compass, AlertTriangle } from 'lucide-react';
import { useGlobalTimers } from '@/hooks/useGlobalTimers';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProfileModal } from '@/components/ProfileModal';
import { FriendsDropdown } from '@/components/FriendsDropdown';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GroupEntryPoint } from './GroupEntryPoint';
import { ConfirmDialog } from './dialogs/ConfirmDialog';

const Header = () => {
  const { hasActiveTimers, totalActiveTime, formatTime, activeTimers } = useGlobalTimers();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGroupEntryPoint, setShowGroupEntryPoint] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleForceLeave = async () => {
    try {
      const { error } = await supabase.rpc('force_leave_all_rooms' as any);
      if (error) throw error;
      toast({
        title: "Operação Concluída",
        description: "Você foi forçado a sair de todas as salas. Tente aceitar um convite agora.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível forçar a saída das salas.",
        variant: "destructive",
      });
    }
  };

  const getDisplayName = () => {
    if (profile?.nickname) return profile.nickname;
    return 'Definir apelido';
  };

  const getInitials = () => {
    if (profile?.nickname) {
      return profile.nickname.substring(0, 2).toUpperCase();
    }
    return '?';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-4">
          {hasActiveTimers && (
            <div className="flex items-center space-x-2 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <Timer className="w-4 h-4 text-green-600 animate-pulse" />
                <span className="text-sm font-medium text-green-800">
                  {formatTime(totalActiveTime)}
                </span>
              </div>
              <div className="text-xs text-green-600">
                {activeTimers.length} timer{activeTimers.length > 1 ? 's' : ''} ativo{activeTimers.length > 1 ? 's' : ''}
              </div>
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Compass className="w-4 h-4" />
                <span>Explorar</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => navigate('/trilhas')}>
                <Route className="w-4 h-4 mr-2" />
                <span>Trilhas</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/salas-publicas')}>
                <Compass className="w-4 h-4 mr-2" />
                <span>Salas Públicas</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/sala-de-estudos-avancada')}>
                <Users className="w-4 h-4 mr-2" />
                <span>Minhas Salas</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleForceLeave}
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
            title="Forçar Saída de Salas"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Sair de Salas (Emergência)
          </Button>

          <FriendsDropdown />

          <NotificationsDropdown />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="bg-gradient-to-r from-blue-100 to-indigo-100 p-2 rounded-full hover:from-blue-200 hover:to-indigo-200 transition-all duration-200 cursor-pointer flex items-center space-x-2 px-3"
              >
                <Avatar className="w-5 h-5">
                  <AvatarImage src={profile?.avatar_url || ''} alt="Avatar" />
                  <AvatarFallback className="text-xs bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">{getDisplayName()}</span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem>
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowLogoutConfirm(true)}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <ProfileModal 
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
      />

      <GroupEntryPoint
        isOpen={showGroupEntryPoint}
        onClose={() => setShowGroupEntryPoint(false)}
      />

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        onConfirm={signOut}
        title="Confirmar Logout"
        description="Você tem certeza que deseja sair?"
      />
    </header>
  );
};

export default Header;
