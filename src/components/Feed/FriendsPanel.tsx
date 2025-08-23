import { useState } from 'react';
import { X, Search, Check } from 'lucide-react';

interface FriendsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestsUpdate: (count: number) => void;
}

interface FriendRequest {
  id: string;
  name: string;
  avatar: string;
  mutualFriends: number;
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
}

export function FriendsPanel({ isOpen, onClose, onRequestsUpdate }: FriendsPanelProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'all'>('requests');
  const [requests, setRequests] = useState<FriendRequest[]>([
    { id: '1', name: 'Paula Mendonça', avatar: 'PM', mutualFriends: 5 },
    { id: '2', name: 'Lucas Souza', avatar: 'LS', mutualFriends: 3 },
  ]);

  const [friends] = useState<Friend[]>([
    { id: '1', name: 'Amanda Mendes', avatar: 'AM', status: 'online' },
    { id: '2', name: 'Carlos Silva', avatar: 'CS', status: 'online' },
    { id: '3', name: 'João Santos', avatar: 'JS', status: 'online' },
    { id: '4', name: 'Ana Costa', avatar: 'AC', status: 'offline' },
    { id: '5', name: 'Ricardo Mendes', avatar: 'RM', status: 'online' },
  ]);

  const handleAcceptRequest = (requestId: string) => {
    setRequests(prev => {
      const updated = prev.filter(req => req.id !== requestId);
      onRequestsUpdate(updated.length);
      return updated;
    });
  };

  const handleDenyRequest = (requestId: string) => {
    setRequests(prev => {
      const updated = prev.filter(req => req.id !== requestId);
      onRequestsUpdate(updated.length);
      return updated;
    });
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
                  Nenhuma solicitação pendente
                </div>
              ) : (
                requests.map((request) => (
                  <div key={request.id} className="flex items-center gap-2 p-2 border border-app-border rounded-lg">
                    <div className="w-8 h-8 bg-app-muted rounded-full flex items-center justify-center font-medium text-sm text-app-text">
                      {request.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-app-text">{request.name}</div>
                      <div className="text-xs text-app-text-muted">{request.mutualFriends} amigos em comum</div>
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
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-2 p-2 border border-app-border rounded-lg hover:bg-app-muted transition-colors">
                  <div className="relative">
                    <div className="w-8 h-8 bg-app-muted rounded-full flex items-center justify-center font-medium text-sm text-app-text">
                      {friend.avatar}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-app-panel ${
                      friend.status === 'online' ? 'bg-app-success' : 'bg-app-text-muted'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-app-text">{friend.name}</div>
                    <div className="text-xs text-app-text-muted capitalize">{friend.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}