import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Users, MoreHorizontal, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '@/contexts/ChatContext';
import { useUserPresence } from '@/hooks/useUserPresence';

interface Friend {
  id: string;
  name: string;
  nickname: string;
  avatarUrl: string | null;
  status: 'online' | 'offline' | 'busy';
  lastLogin?: Date | string | null;
  note?: string;
}

interface FriendsDropdownProps {
  isOpen: boolean;
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

export function FriendsDropdown({ isOpen, onClose, onUserClick }: FriendsDropdownProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  
  const navigate = useNavigate();
  const { openChat } = useChat();
  const { getUserStatus } = useUserPresence();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch friends when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchFriends();
      // Focus search input when dropdown opens
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts and clicks outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeDropdown) {
          setActiveDropdown(null);
        } else {
          onClose();
        }
      } else if (e.key === '/' && isOpen && !activeDropdown) {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (activeDropdown && 
          !target.closest(`[data-friend-dropdown="${activeDropdown}"]`) &&
          !target.closest(`[data-friend-actions-dropdown="${activeDropdown}"]`)) {
        setActiveDropdown(null);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isOpen, onClose, activeDropdown]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await fetch('http://localhost:3002/api/connections?status=accepted', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        // Transform API data to expected format with real presence data
        const transformedFriends: Friend[] = data.data.map((connection: any) => {
          const userStatus = getUserStatus(connection.user.id, connection.user.lastLogin);
          
          return {
            id: connection.user.id,
            name: connection.user.name,
            nickname: connection.user.nickname,
            avatarUrl: connection.user.avatarUrl,
            status: userStatus.status,
            note: userStatus.note,
            lastLogin: connection.user.lastLogin
          };
        });
        setFriends(transformedFriends);
      } else {
        setError(data.message || 'Erro ao carregar amigos');
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError('Erro de conexão ao carregar amigos');
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend => {
    const matchesQuery = !query || 
      friend.name.toLowerCase().includes(query.toLowerCase()) ||
      friend.nickname.toLowerCase().includes(query.toLowerCase()) ||
      (friend.note && friend.note.toLowerCase().includes(query.toLowerCase()));
    
    const matchesFilter = filter === 'all' || friend.status === filter;
    
    return matchesQuery && matchesFilter;
  });

  const handleUserClick = (friend: Friend) => {
    // Store navigation context to preserve Feed header
    sessionStorage.setItem('navigationSource', 'feed');
    const profilePath = `/perfil/${friend.nickname}`;
    navigate(profilePath);
    onClose();
    if (onUserClick) {
      onUserClick(friend.id);
    }
  };

  const handleViewProfile = (friend: Friend) => {
    handleUserClick(friend);
    setActiveDropdown(null);
  };

  const handleCallToStudy = (friend: Friend) => {
    // TODO: Implement study invitation logic
    console.log('Chamar para estudar:', friend.name);
    alert(`Funcionalidade "Chamar para estudar" será implementada em breve para ${friend.name}`);
    setActiveDropdown(null);
  };

  const handleSendMessage = (friend: Friend) => {
    openChat({
      id: friend.id,
      name: friend.name,
      nickname: friend.nickname,
      avatarUrl: friend.avatarUrl,
      status: friend.status
    });
    setActiveDropdown(null);
    onClose();
  };

  const calculateDropdownPosition = (buttonElement: HTMLButtonElement) => {
    const rect = buttonElement.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX - 160 // 160px is the width of dropdown (w-40 = 10rem = 160px)
    };
  };

  const getStatusDot = (friend: Friend) => {
    const userStatus = getUserStatus(friend.id, friend.lastLogin);
    return userStatus.dotColor;
  };

  const getStatusLabel = (friend: Friend) => {
    const userStatus = getUserStatus(friend.id, friend.lastLogin);
    return userStatus.statusText;
  };

  if (!isOpen) return null;

  // Find the active friend for the portal - use all friends, not filtered
  const activeFriend = friends.find(f => f.id === activeDropdown);

  return (
    <>
    <div className="absolute top-full right-0 mt-2 w-96 max-w-[94vw] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 animate-in slide-in-from-top-2 duration-200 overflow-visible">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-700">
        <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <div className="font-semibold text-gray-900 dark:text-gray-100">Amigos</div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar amigo… (/)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setFilter(filter === 'online' ? 'all' : 'online')}
          className={`inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-full text-xs font-medium transition-colors ${
            filter === 'online'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Online
        </button>
        
        <button
          onClick={() => setFilter(filter === 'offline' ? 'all' : 'offline')}
          className={`inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-full text-xs font-medium transition-colors ${
            filter === 'offline'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
          Offline
        </button>
      </div>

      {/* Friends List */}
      <div className="max-h-80 overflow-y-auto" style={{ overflowX: 'visible' }}>
        {loading ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Carregando amigos...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500 text-sm">
            {error}
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {query || filter !== 'all' ? 'Nenhum amigo encontrado' : 'Nenhum amigo ainda'}
          </div>
        ) : (
          filteredFriends.map((friend, index) => (
            <div
              key={friend.id}
              data-friend-dropdown={friend.id}
              className={`grid grid-cols-[48px_1fr_auto] gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                index === filteredFriends.length - 1 ? '' : 'border-b border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Avatar */}
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center font-semibold text-gray-700 dark:text-gray-300">
                {friend.avatarUrl ? (
                  friend.avatarUrl.startsWith('a') ? (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-lg">
                      {getAvatarEmoji(friend.avatarUrl)}
                    </div>
                  ) : (
                    <img
                      src={friend.avatarUrl}
                      alt={friend.name}
                      className="w-full h-full rounded-lg object-cover"
                    />
                  )
                ) : (
                  <span>{friend.name.charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {friend.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <span className={`w-2 h-2 rounded-full ${getStatusDot(friend)}`}></span>
                    {getStatusLabel(friend)}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {friend.note || `@${friend.nickname}`}
                </div>
              </div>

              {/* Actions */}
              <div className="relative flex-shrink-0">
                <button
                  ref={activeDropdown === friend.id ? activeButtonRef : null}
                  onClick={(e) => {
                    e.stopPropagation();
                    const buttonElement = e.currentTarget as HTMLButtonElement;
                    console.log('Three dots clicked for:', friend.name, 'Current active:', activeDropdown, 'Friend ID:', friend.id);
                    const newActiveDropdown = activeDropdown === friend.id ? null : friend.id;
                    console.log('Setting activeDropdown to:', newActiveDropdown);
                    
                    if (newActiveDropdown) {
                      const position = calculateDropdownPosition(buttonElement);
                      setDropdownPosition(position);
                    }
                    
                    setActiveDropdown(newActiveDropdown);
                  }}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    
    {/* Portal for friend dropdown menu */}
    {activeDropdown && activeFriend && createPortal(
      <div 
        className="fixed w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[9999]"
        style={{ 
          top: dropdownPosition.top,
          left: dropdownPosition.left,
        }}
        data-friend-actions-dropdown={activeFriend.id}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewProfile(activeFriend);
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg transition-colors"
        >
          Ver perfil
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSendMessage(activeFriend);
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Enviar mensagem
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCallToStudy(activeFriend);
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg transition-colors"
        >
          Chamar para estudar
        </button>
      </div>,
      document.body
    )}
    </>
  );
}