import { useState, useEffect } from 'react';
import { UserPlus, Users } from 'lucide-react';

interface FriendSuggestion {
  id: string;
  name: string;
  nickname: string;
  avatarUrl: string | null;
  mutualFriends: number;
  interests: string[];
}

interface FriendSuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFriend: (userId: string) => void;
}

export function FriendSuggestions({ isOpen, onClose, onAddFriend }: FriendSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
    }
  }, [isOpen]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would call your API
      // For now, we'll use mock data
      const mockSuggestions: FriendSuggestion[] = [
        {
          id: '1',
          name: 'Ana Beatriz',
          nickname: 'anabeatriz',
          avatarUrl: null,
          mutualFriends: 5,
          interests: ['Matemática', 'Física']
        },
        {
          id: '2',
          name: 'Carlos Eduardo',
          nickname: 'carlosedu',
          avatarUrl: null,
          mutualFriends: 3,
          interests: ['Química', 'Biologia']
        },
        {
          id: '3',
          name: 'Fernanda Oliveira',
          nickname: 'fernanda.o',
          avatarUrl: null,
          mutualFriends: 8,
          interests: ['História', 'Geografia']
        },
        {
          id: '4',
          name: 'Gabriel Santos',
          nickname: 'gabriel.s',
          avatarUrl: null,
          mutualFriends: 2,
          interests: ['Português', 'Literatura']
        },
        {
          id: '5',
          name: 'Juliana Costa',
          nickname: 'ju.costaa',
          avatarUrl: null,
          mutualFriends: 6,
          interests: ['Matemática', 'Estatística']
        }
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSuggestions(mockSuggestions);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Erro ao carregar sugestões de amigos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = (userId: string) => {
    onAddFriend(userId);
    // Remove user from suggestions list
    setSuggestions(prev => prev.filter(suggestion => suggestion.id !== userId));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-80 max-w-full bg-app-panel border-l border-app-border z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        pt-16 lg:pt-0
      `}>
        <div className="flex items-center justify-between p-4 border-b border-app-border">
          <h2 className="text-lg font-semibold text-app-text flex items-center gap-2">
            <Users className="w-5 h-5 text-app-accent" />
            Sugestões de Amigos
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-app-muted rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <span className="text-app-text">✕</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-app-text-muted">
              <span className="animate-spin mr-2">⏳</span>
              Carregando sugestões...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-app-text-muted">
              <div className="mb-2">❌ Erro ao carregar sugestões</div>
              <div className="text-sm">{error}</div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8 text-app-text-muted">
              Nenhuma sugestão de amigo encontrada
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="flex items-center gap-3 p-3 border border-app-border rounded-lg hover:bg-app-muted transition-colors">
                  <div className="relative">
                    <div className="w-12 h-12 bg-app-muted rounded-full flex items-center justify-center font-semibold text-lg text-app-text">
                      {suggestion.avatarUrl ? (
                        <img 
                          src={suggestion.avatarUrl} 
                          alt={`Avatar de ${suggestion.name}`} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span>{suggestion.name.charAt(0)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-app-text">{suggestion.name}</div>
                    <div className="text-sm text-app-text-muted">@{suggestion.nickname}</div>
                    <div className="text-xs text-app-text-muted mt-1">
                      {suggestion.mutualFriends} amigos em comum
                    </div>
                    {suggestion.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {suggestion.interests.slice(0, 3).map((interest, index) => (
                          <span key={index} className="px-2 py-1 bg-app-muted text-app-text text-xs rounded-full">
                            {interest}
                          </span>
                        ))}
                        {suggestion.interests.length > 3 && (
                          <span className="px-2 py-1 bg-app-muted text-app-text text-xs rounded-full">
                            +{suggestion.interests.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddFriend(suggestion.id)}
                    className="p-2 bg-app-accent text-white rounded-full hover:bg-opacity-90 transition-colors"
                    aria-label={`Adicionar ${suggestion.name} como amigo`}
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}