import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Loader2, Users, MessageCircle } from 'lucide-react';
import { useCreateConversation } from '@/hooks/useConversations';
import { useSocket } from '@/contexts/SocketContext';

interface User {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
}

interface NewConversationDialogProps {
  onConversationCreated: (conversationId: string) => void;
}

export const NewConversationDialog: React.FC<NewConversationDialogProps> = ({
  onConversationCreated,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { onlineUsers } = useSocket();
  const createConversation = useCreateConversation();

  // This would normally fetch connected users/friends from an API
  // For now, we'll implement a simple search that would query the backend
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // TODO: Implement actual search API call
      // const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      // const results = await response.json();
      // setSearchResults(results);
      
      // Mock results for now
      setTimeout(() => {
        setSearchResults([]);
        setIsSearching(false);
      }, 500);
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
    }
  };

  const handleCreateConversation = async (userId: string) => {
    try {
      const result = await createConversation.mutateAsync(userId);
      setOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      onConversationCreated(result.data.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Could show toast error here
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <Plus className="w-4 h-4" />
          Nova Conversa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Nova Conversa
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou @usuário..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="pl-10"
            />
          </div>

          {/* Search results */}
          <ScrollArea className="max-h-60">
            <div className="space-y-2">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : searchResults.length === 0 && searchQuery ? (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tente pesquisar por nome completo ou @usuário
                  </p>
                </div>
              ) : searchResults.length === 0 && !searchQuery ? (
                <div className="text-center py-8">
                  <Search className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Busque por um amigo</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Digite o nome ou @usuário para começar
                  </p>
                </div>
              ) : (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => handleCreateConversation(user.id)}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                      <AvatarFallback>
                        {user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{user.name}</p>
                        {onlineUsers.has(user.id) && (
                          <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
                            Online
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Note about connections */}
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 Você só pode conversar com usuários que são seus amigos conectados
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};