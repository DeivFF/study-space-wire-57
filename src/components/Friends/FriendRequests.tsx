import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConnections } from '@/hooks/useConnections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserCheck, UserX, Loader2, AlertCircle, RefreshCw, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FriendRequest {
  id: string;
  requesterId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  requester: {
    id: string;
    name: string;
    email: string;
    nickname: string;
    avatarUrl: string | null;
  };
}

interface RequestsResponse {
  success: boolean;
  message: string;
  data: FriendRequest[];
}

export function FriendRequests() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  
  const { token } = useAuth();
  const { acceptFriendRequest, rejectFriendRequest } = useConnections();
  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    if (!token) {
      setError('Token de acesso não encontrado');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3002/api/connections/requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        if (response.status === 403) {
          throw new Error('Acesso negado');
        }
        throw new Error(`Erro ao carregar solicitações: ${response.status}`);
      }

      const data: RequestsResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao carregar solicitações');
      }

      setRequests(data.data);
    } catch (err) {
      console.error('Error fetching friend requests:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleAccept = async (requestId: string, requesterName: string) => {
    setProcessingIds(prev => new Set([...prev, requestId]));
    
    try {
      await acceptFriendRequest(requestId);
      
      toast({
        title: 'Solicitação aceita!',
        description: `Você e ${requesterName} agora são amigos!`,
      });

      // Remove from list
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aceitar a solicitação',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const updated = new Set(prev);
        updated.delete(requestId);
        return updated;
      });
    }
  };

  const handleReject = async (requestId: string, requesterName: string) => {
    setProcessingIds(prev => new Set([...prev, requestId]));
    
    try {
      await rejectFriendRequest(requestId);
      
      toast({
        title: 'Solicitação rejeitada',
        description: `Solicitação de ${requesterName} foi rejeitada`,
      });

      // Remove from list
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar a solicitação',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const updated = new Set(prev);
        updated.delete(requestId);
        return updated;
      });
    }
  };

  const retry = () => {
    fetchRequests();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Agora há pouco';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`;
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando solicitações...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Erro ao carregar solicitações</span>
            </div>
            <Button variant="outline" size="sm" onClick={retry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Nenhuma solicitação pendente</p>
          <p className="text-sm">Quando alguém enviar uma solicitação, ela aparecerá aqui</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground">
          Solicitações de amizade ({requests.length})
        </h3>
        <Button variant="outline" size="sm" onClick={retry} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {requests.map((request) => (
        <Card key={request.id} className="hover:bg-muted/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                {request.requester.avatarUrl ? (
                  <AvatarImage src={request.requester.avatarUrl} alt={request.requester.name} />
                ) : (
                  <AvatarFallback>
                    {request.requester.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{request.requester.name}</h4>
                  <Badge variant="secondary">@{request.requester.nickname}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Quer ser seu amigo • {formatDate(request.createdAt)}
                </p>
              </div>
              
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => handleAccept(request.id, request.requester.name)}
                  disabled={processingIds.has(request.id)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {processingIds.has(request.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-2" />
                  )}
                  Aceitar
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(request.id, request.requester.name)}
                  disabled={processingIds.has(request.id)}
                >
                  {processingIds.has(request.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserX className="h-4 w-4 mr-2" />
                  )}
                  Recusar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}