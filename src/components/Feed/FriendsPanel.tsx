import { useState, useEffect } from 'react';
import { X, Search, Check } from 'lucide-react';

interface FriendsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestsUpdate?: (count: number) => void;
}

interface FriendRequest {
  id: string;
  requesterId: string;
  requester: {
    id: string;
    name: string;
    email: string;
    nickname: string;
    avatarUrl: string | null;
  };
  createdAt: string;
}

interface Friend {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    nickname: string;
    avatarUrl: string | null;
    status: string;
  };
  status: 'accepted' | 'pending' | 'rejected' | 'blocked';
  createdAt: string;
}

export function FriendsPanel({ isOpen, onClose, onRequestsUpdate }: FriendsPanelProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'all'>('requests');
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchRequests();
      fetchFriends();
    }
  }, [isOpen, activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await fetch('http://localhost:3002/api/connections/requests', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
        onRequestsUpdate?.(data.data.length);
      } else {
        setError(data.message || 'Erro ao carregar solicitações');
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Erro de conexão ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

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
        setFriends(data.data);
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

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await fetch(`http://localhost:3002/api/connections/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ action: 'accept' })
      });
      
      const data = await response.json();
      if (data.success) {
        // Remove accepted request from list
        setRequests(prev => {
          const updated = prev.filter(req => req.id !== requestId);
          onRequestsUpdate?.(updated.length);
          return updated;
        });
        
        // Refresh friends list
        fetchFriends();
      } else {
        setError(data.message || 'Erro ao aceitar solicitação');
      }
    } catch (err) {
      console.error('Error accepting request:', err);
      setError('Erro de conexão ao aceitar solicitação');
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await fetch(`http://localhost:3002/api/connections/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ action: 'reject' })
      });
      
      const data = await response.json();
      if (data.success) {
        // Remove denied request from list
        setRequests(prev => {
          const updated = prev.filter(req => req.id !== requestId);
          onRequestsUpdate?.(updated.length);
          return updated;
        });
      } else {
        setError(data.message || 'Erro ao recusar solicitação');
      }
    } catch (err) {
      console.error('Error denying request:', err);
      setError('Erro de conexão ao recusar solicitação');
    }
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
        flex flex-col
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-app-border">
          <h2 className="text-lg font-semibold text-app-text">Amigos</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-app-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-app-text" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-app-border">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'requests'
                ? 'border-app-accent text-app-accent'
                : 'border-transparent text-app-text-muted hover:text-app-text'
            }`}
          >
            Solicitações
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-app-accent text-app-accent'
                : 'border-transparent text-app-text-muted hover:text-app-text'
            }`}
          >
            Todos os amigos
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-app-text-muted" />
            <input
              type="text"
              placeholder={`Buscar ${activeTab === 'requests' ? 'solicitações' : 'amigos'}...`}
              className="w-full pl-10 pr-4 py-2 bg-app-muted border border-app-border rounded-lg text-app-text placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent"
            />
          </div>

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="text-center py-8 text-app-text-muted">
                  {loading ? 'Carregando solicitações...' : 'Nenhuma solicitação pendente'}
                </div>
              ) : (
                requests.map((request) => (
                  <div key={request.id} className="flex items-center gap-2 p-2 border border-app-border rounded-lg">
                    <div className="w-8 h-8 bg-app-muted rounded-full flex items-center justify-center font-medium text-sm text-app-text">
                      {request.requester.avatarUrl ? (
                        <img
                          src={request.requester.avatarUrl}
                          alt={request.requester.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span>{request.requester.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-app-text">{request.requester.name}</div>
                      <div className="text-xs text-app-text-muted">@{request.requester.nickname}</div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="w-6 h-6 bg-app-success hover:bg-opacity-80 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDenyRequest(request.id)}
                        className="w-6 h-6 bg-app-muted hover:bg-app-border text-app-text rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* All Friends Tab */}
          {activeTab === 'all' && (
            <div className="space-y-2">
              {friends.length === 0 ? (
                <div className="text-center py-8 text-app-text-muted">
                  {loading ? 'Carregando amigos...' : 'Nenhum amigo encontrado'}
                </div>
              ) : (
                friends.map((friend) => (
                  <div key={friend.id} className="flex items-center gap-2 p-2 border border-app-border rounded-lg hover:bg-app-muted transition-colors">
                    <div className="relative">
                      <div className="w-8 h-8 bg-app-muted rounded-full flex items-center justify-center font-medium text-sm text-app-text">
                        {friend.user.avatarUrl ? (
                          <img
                            src={friend.user.avatarUrl}
                            alt={friend.user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span>{friend.user.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-app-panel ${
                        friend.user.status === 'online' ? 'bg-app-success' : 'bg-app-text-muted'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-app-text">{friend.user.name}</div>
                      <div className="text-xs text-app-text-muted capitalize">@{friend.user.nickname}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}