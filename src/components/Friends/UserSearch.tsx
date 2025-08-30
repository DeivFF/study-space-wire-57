import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConnections } from '@/hooks/useConnections';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SearchUser {
  id: string;
  name: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface SearchResponse {
  success: boolean;
  message: string;
  data: SearchUser[];
}

export function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [requestingIds, setRequestingIds] = useState<Set<string>>(new Set());
  
  const { token } = useAuth();
  const { sendFriendRequest } = useConnections();
  const { toast } = useToast();

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !token) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(
        `http://localhost:3002/api/connections/search?query=${encodeURIComponent(searchQuery.trim())}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        if (response.status === 403) {
          throw new Error('Acesso negado');
        }
        throw new Error(`Erro na busca: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao buscar usuários');
      }

      setResults(data.data);
    } catch (err) {
      console.error('Error searching users:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchUsers(query);
    }
  };

  const handleAddFriend = async (userId: string, userName: string) => {
    setRequestingIds(prev => new Set([...prev, userId]));
    
    try {
      await sendFriendRequest(userId);
      
      toast({
        title: 'Solicitação enviada!',
        description: `Solicitação de amizade enviada para ${userName}`,
      });

      // Remove user from results or mark as request sent
      setResults(prev => prev.filter(user => user.id !== userId));
      
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a solicitação de amizade',
        variant: 'destructive',
      });
    } finally {
      setRequestingIds(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    }
  };

  const retry = () => {
    if (query.trim()) {
      searchUsers(query);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchUsers(query);
      } else {
        setResults([]);
        setHasSearched(false);
        setError(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, searchUsers]);

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar usuários por nome ou nickname..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </form>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Erro na busca</span>
              </div>
              <Button variant="outline" size="sm" onClick={retry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Buscando usuários...</span>
          </div>
        </div>
      )}

      {hasSearched && !loading && results.length === 0 && !error && (
        <div className="text-center py-8">
          <div className="text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum usuário encontrado</p>
            <p className="text-sm">Tente buscar por um nome ou nickname diferente</p>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-foreground">
            Resultados da busca ({results.length})
          </h3>
          {results.map((user) => (
            <Card key={user.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    {user.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                    ) : (
                      <AvatarFallback>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{user.name}</h4>
                      <Badge variant="secondary">@{user.nickname}</Badge>
                    </div>
                    {(user.firstName || user.lastName) && (
                      <p className="text-sm text-muted-foreground">
                        {[user.firstName, user.lastName].filter(Boolean).join(' ')}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => handleAddFriend(user.id, user.name)}
                    disabled={requestingIds.has(user.id)}
                    className="shrink-0"
                  >
                    {requestingIds.has(user.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {requestingIds.has(user.id) ? 'Enviando...' : 'Adicionar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!hasSearched && !loading && (
        <div className="text-center py-8">
          <div className="text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Encontre novos amigos</p>
            <p className="text-sm">Digite o nome ou nickname de quem você quer adicionar</p>
          </div>
        </div>
      )}
    </div>
  );
}