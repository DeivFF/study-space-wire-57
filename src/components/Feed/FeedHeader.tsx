import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, MessageCircle, Menu, GraduationCap, User, Settings, Moon, Sun, LogOut, Bell, Calendar } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { SearchResultsDropdown } from './SearchResultsDropdown';
import { NotificationDropdown } from './NotificationDropdown';
import { FriendsDropdown } from './FriendsDropdown';
import { HeaderNavigation } from './HeaderNavigation';
import { NotificationCenter } from '@/components/Notifications/NotificationCenter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificationsCount } from '@/hooks/useNotifications';
import { getUnreadNotificationsCount } from '@/lib/notification-seeds';
import { StreakWidget } from '@/components/Gamification/StreakWidget';

interface User {
  id: string;
  name: string;
  nickname: string;
  avatarUrl: string | null;
  status: 'online' | 'offline' | 'away' | 'busy';
}

interface FeedHeaderProps {
  onToggleFriends: () => void;
  onToggleSidebar: (side: 'left' | 'right') => void;
  friendRequestsCount: number;
  isMobile: boolean;
  onAddFriend?: (userId: string) => void;
}

// Avatar options mapping (same as in OnboardingModal)
const avatarOptions = [
  { id: 'a1', bg: '#FEE2E2', fg: '#991B1B', emoji: '😀' },
  { id: 'a2', bg: '#E0F2FE', fg: '#075985', emoji: '😎' },
  { id: 'a3', bg: '#ECFDF5', fg: '#065F46', emoji: '👋' },
  { id: 'a4', bg: '#FFF7ED', fg: '#9A3412', emoji: '✨' },
  { id: 'a5', bg: '#EEF2FF', fg: '#3730A3', emoji: '👩‍🎓' },
  { id: 'a6', bg: '#FAE8FF', fg: '#86198F', emoji: '👾' },
  { id: 'a7', bg: '#F0FDFA', fg: '#155E75', emoji: '🤩' },
  { id: 'a8', bg: '#F5F5F4', fg: '#1C1917', emoji: '💻' },
  { id: 'a9', bg: '#E9D5FF', fg: '#6B21A8', emoji: '🔥' },
  { id: 'a10', bg: '#DCFCE7', fg: '#166534', emoji: '🌱' },
  { id: 'a11', bg: '#FFE4E6', fg: '#9F1239', emoji: '💜' },
  { id: 'a12', bg: '#E2E8F0', fg: '#0F172A', emoji: '🔍' }
];

const getAvatarEmoji = (avatarId: string) => {
  const avatar = avatarOptions.find(option => option.id === avatarId);
  return avatar ? avatar.emoji : '👤';
};

export function FeedHeader({
  onToggleFriends,
  onToggleSidebar,
  friendRequestsCount,
  isMobile,
  onAddFriend
}: FeedHeaderProps) {
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [friendsDropdownOpen, setFriendsDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { data: apiNotificationsCount = 0 } = useNotificationsCount(); // Real API count
  const mockNotificationsCount = getUnreadNotificationsCount(); // Mock data count
  const notificationsCount = apiNotificationsCount + mockNotificationsCount; // Combined count
  const navigate = useNavigate();
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const friendsButtonRef = useRef<HTMLButtonElement>(null);
  const friendsDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setAvatarMenuOpen(false);
      }
      
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      
      if (searchResultsRef.current &&
          !searchResultsRef.current.contains(event.target as Node) &&
          searchInputRef.current !== event.target) {
        setShowSearchResults(false);
      }
      
      if (friendsDropdownRef.current &&
          !friendsDropdownRef.current.contains(event.target as Node) &&
          friendsButtonRef.current !== event.target) {
        setFriendsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search function
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const delayDebounce = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Search users function
  const searchUsers = async (query: string) => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        console.error('No access token found');
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      const response = await fetch(`http://localhost:3002/api/profile/search?q=${encodeURIComponent(query)}&limit=8`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform API response to match component interface
      const transformedUsers: User[] = data.data.users.map((apiUser: any) => ({
        id: apiUser.id,
        name: apiUser.name,
        nickname: apiUser.nickname || apiUser.firstName || 'user',
        avatarUrl: apiUser.avatarUrl || apiUser.avatar_url,
        status: 'online' as const // Default status since API doesn't return this yet
      }));
      
      setSearchResults(transformedUsers);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding a friend
  const handleAddFriend = async (userId: string) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        console.error('No access token found');
        return;
      }

      const response = await fetch('http://localhost:3002/api/connections', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ receiverId: userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao enviar solicitação de amizade');
      }

      const data = await response.json();
      console.log('Connection request sent:', data);
      
      // Remove user from search results
      setSearchResults(prev => prev.filter(user => user.id !== userId));
      
      // Show success message
      alert('Solicitação de amizade enviada!');
      
      if (onAddFriend) {
        onAddFriend(userId);
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert(error instanceof Error ? error.message : 'Erro ao enviar solicitação de amizade');
    }
  };

  const handleMyProfileClick = () => {
    // Store navigation context to preserve Feed header when returning
    sessionStorage.setItem('navigationSource', 'feed');
    navigate('/meu-perfil');
    setAvatarMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setAvatarMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-app-bg-soft border-b border-app-border shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section - Logo and Mobile Menu */}
          <div className="flex items-center gap-4">
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleSidebar('left')}
                className="lg:hidden hover:bg-muted"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/assets/images/Logo.svg" alt="azurk" className="w-8 h-8" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Azurk
                </h1>
                <p className="text-xs text-muted-foreground -mt-1">Conecte e aprenda</p>
              </div>
            </div>
          </div>

          {/* Center section - Gamification + Search */}
          <div className="flex items-center gap-4 flex-1 max-w-4xl mx-6">
            {/* Gamification Widget */}
            <div className="flex-shrink-0">
              <StreakWidget variant="compact" />
            </div>
            
            {/* Search */}
            <div className="flex-1 max-w-md relative" ref={searchResultsRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar ou pressione Cmd+K..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length > 0 && setShowSearchResults(true)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-input rounded-full text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 dark:bg-muted/20"
                />
              </div>
              
              {showSearchResults && (
                <SearchResultsDropdown
                  users={searchResults}
                  isLoading={isLoading}
                  onAddFriend={handleAddFriend}
                  onClose={() => setShowSearchResults(false)}
                  onUserClick={(userId) => {
                    // Store navigation context to preserve Feed header when viewing other profiles
                    sessionStorage.setItem('navigationSource', 'feed');
                    // Find the user in search results to get their nickname
                    const user = searchResults.find(u => u.id === userId);
                    const profilePath = user?.nickname ? `/perfil/${user.nickname}` : `/perfil/${userId}`;
                    navigate(profilePath);
                  }}
                />
              )}
            </div>
          </div>

          {/* Right section - Actions and User */}
          <div className="flex items-center gap-2">
            {/* Header Navigation */}
            <HeaderNavigation className="mr-4" />
            
            {/* Notifications - Now rendered separately with fixed positioning */}
            <NotificationDropdown 
              isOpen={notificationsOpen} 
              onToggle={() => setNotificationsOpen(!notificationsOpen)}
            />

            {/* Friends */}
            <div className="relative" ref={friendsDropdownRef}>
              <Button 
                ref={friendsButtonRef}
                variant="ghost" 
                size="sm" 
                onClick={() => setFriendsDropdownOpen(!friendsDropdownOpen)}
                className="relative hover:bg-muted"
              >
                <Users className="w-5 h-5" />
                {friendRequestsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 px-1.5 py-0 text-xs min-w-[18px] h-[18px] flex items-center justify-center"
                  >
                    {friendRequestsCount}
                  </Badge>
                )}
              </Button>
              
              <FriendsDropdown 
                isOpen={friendsDropdownOpen}
                onClose={() => setFriendsDropdownOpen(false)}
              />
            </div>


            {/* User Avatar Menu */}
            <div className="relative" ref={avatarMenuRef}>
              <button
                onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                className="flex items-center gap-2 p-1 hover:bg-muted rounded-full transition-colors"
              >
                <Avatar className="w-8 h-8">
                  {user?.avatarUrl ? (
                    user.avatarUrl.startsWith('a') ? (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-lg">
                        {getAvatarEmoji(user.avatarUrl)}
                      </div>
                    ) : (
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                    )
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-medium">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
              </button>
              
              {avatarMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-border/50">
                    <p className="font-medium text-foreground">
                      {user?.nickname || user?.name || 'Usuário'}
                    </p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  
                  <button 
                    onClick={handleMyProfileClick}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-muted text-foreground"
                  >
                    <User className="w-4 h-4" />
                    Meu perfil
                  </button>
                  
                  <button 
                    onClick={() => {
                      navigate('/calendario');
                      setAvatarMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-muted text-foreground"
                  >
                    <Calendar className="w-4 h-4" />
                    Calendário
                  </button>
                  
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-muted text-foreground">
                    <Settings className="w-4 h-4" />
                    Configurações
                  </button>
                  
                  <button 
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-muted text-foreground"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                  </button>
                  
                  <hr className="my-2 border-border/50" />
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-destructive/10 text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}