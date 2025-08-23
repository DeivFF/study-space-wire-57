import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones, Plus, BookOpen, Beaker, Calculator, Users, Layers, Upload, Ellipsis } from 'lucide-react';

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
}

interface Room {
  id: string;
  name: string;
  icon: any;
  members: number;
  color: string;
}

interface Suggestion {
  id: string;
  name: string;
  avatar: string;
  mutualFriends: number;
}

export function RightSidebar({ isOpen, onClose }: RightSidebarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const onlineFriends: Friend[] = [
    { id: '1', name: 'Amanda Mendes', avatar: 'AM', status: 'online' },
    { id: '2', name: 'Carlos Silva', avatar: 'CS', status: 'online' },
    { id: '3', name: 'João Santos', avatar: 'JS', status: 'online' },
    { id: '4', name: 'Ana Costa', avatar: 'AC', status: 'offline' },
    { id: '5', name: 'Ricardo Mendes', avatar: 'RM', status: 'online' },
  ];

  const activeRooms: Room[] = [
    { id: '1', name: 'Direito Constitucional', icon: BookOpen, members: 12, color: 'app-accent' },
    { id: '2', name: 'Química Orgânica', icon: Beaker, members: 8, color: 'app-accent-2' },
    { id: '3', name: 'Matemática Financeira', icon: Calculator, members: 5, color: 'app-success' },
  ];

  const suggestions: Suggestion[] = [
    { id: '1', name: 'Paula Mendonça', avatar: 'PM', mutualFriends: 5 },
    { id: '2', name: 'Lucas Souza', avatar: 'LS', mutualFriends: 3 },
    { id: '3', name: 'Fernanda Costa', avatar: 'FC', mutualFriends: 8 },
  ];

  const shortcuts = [
    { icon: Users, label: 'Criar sala', color: 'text-app-accent' },
    { icon: Layers, label: 'Novo flashcard', color: 'text-app-accent-2' },
    { icon: Upload, label: 'Importar material', color: 'text-app-success' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`
        fixed lg:sticky top-0 right-0 h-screen w-80 bg-app-panel border-l border-app-border z-50 lg:z-auto
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        pt-16 lg:pt-0
      `}>
        <div className="p-4 h-full overflow-y-auto space-y-4">
          
          {/* Amigos online */}
          <div className="bg-app-bg-soft border border-app-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-app-text">Amigos online</h3>
              <span className="text-xs text-app-text-muted">{onlineFriends.filter(f => f.status === 'online').length}</span>
            </div>
            <div className="space-y-3">
              {onlineFriends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 bg-app-muted rounded-full flex items-center justify-center font-semibold text-sm text-app-text">
                      {friend.avatar}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-app-panel ${
                      friend.status === 'online' ? 'bg-app-success' : 'bg-app-text-muted'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-app-text">{friend.name}</div>
                    <div className="text-xs text-app-text-muted capitalize">{friend.status}</div>
                  </div>
                  <div className="relative" ref={openMenuId === friend.id ? menuRef : null}>
                    <button
                      data-testid={`friend-options-${friend.id}`}
                      onClick={() => setOpenMenuId(openMenuId === friend.id ? null : friend.id)}
                      className="p-1 text-app-text-muted hover:text-app-text hover:bg-app-muted rounded-full"
                    >
                      <Ellipsis className="w-5 h-5" />
                    </button>
                    {openMenuId === friend.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-app-bg-soft border border-app-border rounded-lg shadow-lg z-10">
                        <ul className="py-1">
                          <li>
                            <a href="#" className="block px-4 py-2 text-sm text-app-text hover:bg-app-muted">
                              Convidar para sala
                            </a>
                          </li>
                          <li>
                            <button 
                              onClick={() => {
                                navigate(`/perfil/${friend.id}`);
                                setOpenMenuId(null);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-app-text hover:bg-app-muted"
                            >
                              Ver perfil
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Salas ativas */}
          <div className="bg-app-bg-soft border border-app-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-app-text">Salas ativas</h3>
              <Headphones className="w-4 h-4 text-app-text-muted" />
            </div>
            <div className="space-y-3">
              {activeRooms.map((room) => (
                <div key={room.id} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-r from-app-accent to-app-accent-2 bg-opacity-20`}>
                    <room.icon className={`w-4 h-4 text-app-accent`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-app-text">{room.name}</div>
                    <div className="text-xs text-app-text-muted">{room.members} participantes</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sugestões */}
          <div className="bg-app-bg-soft border border-app-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-app-text">Sugestões para você</h3>
            </div>
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-app-muted rounded-full flex items-center justify-center font-semibold text-sm text-app-text">
                    {suggestion.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-app-text">{suggestion.name}</div>
                    <div className="text-xs text-app-text-muted">{suggestion.mutualFriends} amigos em comum</div>
                  </div>
                  <button className="w-8 h-8 bg-app-muted hover:bg-app-accent hover:text-white rounded-full flex items-center justify-center transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Atalhos */}
          <div className="bg-app-bg-soft border border-app-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-app-text">Atalhos</h3>
            </div>
            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-app-muted rounded-lg cursor-pointer hover:bg-app-accent hover:text-white transition-colors group">
                  <shortcut.icon className={`w-4 h-4 ${shortcut.color} group-hover:text-white`} />
                  <span className="text-sm text-app-text group-hover:text-white">{shortcut.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}