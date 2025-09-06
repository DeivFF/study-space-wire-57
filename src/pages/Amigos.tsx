import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Bell, Search as SearchIcon } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useFriends } from '@/hooks/useFriends';
import { FriendsList } from '@/components/Friends/FriendsList';
import { FriendRequests } from '@/components/Friends/FriendRequests';
import { UserSearch } from '@/components/Friends/UserSearch';

export default function Amigos() {
  const [activeTab, setActiveTab] = useState('friends');
  const { onlineUsers, notifications } = useSocket();
  const { friends } = useFriends();

  const onlineFriendsCount = friends.filter(friend => 
    onlineUsers.has(friend.id)
  ).length;

  const friendRequestsCount = notifications.filter(
    notif => notif.type === 'friend_request'
  ).length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold">Amigos</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Amigos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{friends.length}</div>
              <p className="text-xs text-muted-foreground">
                Conexões estabelecidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Amigos Online</CardTitle>
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{onlineFriendsCount}</div>
              <p className="text-xs text-muted-foreground">
                Disponíveis agora
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitações</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{friendRequestsCount}</div>
              <p className="text-xs text-muted-foreground">
                Pendentes de resposta
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Meus Amigos
              {friends.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {friends.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Solicitações
              {friendRequestsCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {friendRequestsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <SearchIcon className="h-4 w-4" />
              Buscar
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="friends">
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Amigos</CardTitle>
                </CardHeader>
                <CardContent>
                  <FriendsList />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle>Solicitações de Amizade</CardTitle>
                </CardHeader>
                <CardContent>
                  <FriendRequests />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search">
              <Card>
                <CardHeader>
                  <CardTitle>Buscar Novos Amigos</CardTitle>
                </CardHeader>
                <CardContent>
                  <UserSearch />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Layout>
  );
}
