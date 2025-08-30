import { UserPlus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface SearchUser {
  id: string;
  name: string;
  nickname: string;
  avatarUrl: string | null;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

interface SearchResultsDropdownProps {
  users: SearchUser[];
  isLoading: boolean;
  onAddFriend: (userId: string) => void;
  onClose: () => void;
  onUserClick?: (userId: string) => void;
}

// Avatar options mapping (same as in FeedHeader)
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

export function SearchResultsDropdown({ 
  users, 
  isLoading, 
  onAddFriend,
  onClose,
  onUserClick
}: SearchResultsDropdownProps) {
  const navigate = useNavigate();

  const handleUserClick = (userId: string) => {
    if (onUserClick) {
      onUserClick(userId);
    } else {
      // Find the user in the users array to get their nickname
      const user = users.find(u => u.id === userId);
      const profilePath = user?.nickname ? `/perfil/${user.nickname}` : `/perfil/${userId}`;
      navigate(profilePath);
    }
    onClose();
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
      {isLoading ? (
        <div className="p-4 text-center text-muted-foreground flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
          Buscando usuários...
        </div>
      ) : users.length > 0 ? (
        users.map(user => (
          <div 
            key={user.id} 
            className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg"
            onClick={() => handleUserClick(user.id)}
          >
            <div className="relative">
              <Avatar className="w-10 h-10">
                {user.avatarUrl ? (
                  user.avatarUrl.startsWith('a') ? (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-lg">
                      {getAvatarEmoji(user.avatarUrl)}
                    </div>
                  ) : (
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                  )
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              {user.status && (
                <div 
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                    user.status === 'online' 
                      ? 'bg-green-500' 
                      : user.status === 'away' 
                      ? 'bg-yellow-500' 
                      : user.status === 'busy' 
                      ? 'bg-red-500' 
                      : 'bg-gray-400'
                  }`}
                />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground truncate">{user.name}</div>
              <div className="text-sm text-muted-foreground truncate">@{user.nickname}</div>
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAddFriend(user.id);
              }}
              className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors group"
              aria-label={`Adicionar ${user.name} como amigo`}
              title={`Adicionar ${user.name} como amigo`}
            >
              <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        ))
      ) : (
        <div className="p-6 text-center">
          <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
          <p className="text-xs text-muted-foreground/80 mt-1">
            Tente buscar por nome ou nickname
          </p>
        </div>
      )}
    </div>
  );
}