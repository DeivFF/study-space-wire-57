import { useState, useRef, useEffect } from 'react';
import { Search, Users, MessageCircle, Menu, GraduationCap, User, Settings, Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface FeedHeaderProps {
  onToggleFriends: () => void;
  onToggleChat: () => void;
  onToggleSidebar: (side: 'left' | 'right') => void;
  friendRequestsCount: number;
  unreadMessagesCount: number;
  isMobile: boolean;
}

export function FeedHeader({ 
  onToggleFriends, 
  onToggleChat, 
  onToggleSidebar,
  friendRequestsCount,
  unreadMessagesCount,
  isMobile
}: FeedHeaderProps) {
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-app-panel border-b border-app-border">
      <div className="flex items-center gap-4 px-4 py-3">
        {isMobile && (
          <button 
            onClick={() => onToggleSidebar('left')}
            className="lg:hidden p-2 hover:bg-app-muted rounded-lg transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5 text-app-text" />
          </button>
        )}
        
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-app-accent" />
          <span className="text-lg font-bold text-app-text">Estudo+</span>
        </div>
        
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-app-text-muted" />
          <input
            type="text"
            placeholder="Buscar no Estudo+..."
            className="w-full pl-10 pr-4 py-2 bg-app-muted border border-app-border rounded-lg text-app-text placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFriends}
            className="relative p-2 hover:bg-app-muted rounded-lg transition-colors"
            aria-label="Amigos"
          >
            <Users className="w-5 h-5 text-app-text" />
            {friendRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-app-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {friendRequestsCount}
              </span>
            )}
          </button>
          
          <button
            onClick={onToggleChat}
            className="relative p-2 hover:bg-app-muted rounded-lg transition-colors"
            aria-label="Chat"
          >
            <MessageCircle className="w-5 h-5 text-app-text" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-app-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadMessagesCount}
              </span>
            )}
          </button>
          
          <div className="relative" ref={avatarMenuRef}>
            <button
              onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              className="w-8 h-8 bg-app-accent text-white rounded-full flex items-center justify-center font-semibold hover:bg-app-accent-2 transition-colors"
              aria-label="Menu do usuário"
            >
              VC
            </button>
            
            {avatarMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-app-panel border border-app-border rounded-lg shadow-lg py-1 z-50">
                <button className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-app-muted text-app-text">
                  <User className="w-4 h-4" />
                  Meu perfil
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-app-muted text-app-text">
                  <Settings className="w-4 h-4" />
                  Configurações
                </button>
                <button 
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-app-muted text-app-text"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  Alternar tema
                </button>
                <hr className="my-1 border-app-border" />
                <button className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-app-muted text-app-text">
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}