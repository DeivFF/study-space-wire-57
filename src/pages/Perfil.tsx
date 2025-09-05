import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Users, MapPin, Mail, Sparkles, UserPlus, MessageCircle, UserCheck, UserX, Loader2 } from 'lucide-react';
import ProfilePostsSection from '@/components/Profile/ProfilePostsSection';
import { useConnections, ConnectionStatus } from '@/hooks/useConnections';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  cidade: string;
  interesses: string[];
  private: boolean;
  avatarUrl?: string;
  counters: { friends: number; posts: number; photos: number };
}

export default function Perfil() {
  const { nickname } = useParams<{ nickname: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isMyProfile = window.location.pathname === '/meu-perfil';
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();
  
  // States
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('none');
  
  // Connection hooks
  const { 
    sendFriendRequest, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    getConnectionStatus,
    loading: connectionLoading,
    error: connectionError 
  } = useConnections();
  
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    bio: '',
    cidade: '',
    interesses: '',
    private: false
  });

  const avatarOptions = [
    { id: 'a1', emoji: '😀' }, { id: 'a2', emoji: '😎' }, { id: 'a3', emoji: '👋' },
    { id: 'a4', emoji: '✨' }, { id: 'a5', emoji: '👩‍🎓' }, { id: 'a6', emoji: '👾' }
  ];

  const getAvatarEmoji = (avatarId: string) => {
    const avatar = avatarOptions.find(option => option.id === avatarId);
    return avatar ? avatar.emoji : '👤';
  };

  // Friend action handlers
  const handleAddFriend = async () => {
    if (!profile) return;
    
    try {
      await sendFriendRequest(profile.id);
      setConnectionStatus('request_sent');
      toast({
        title: 'Solicitação enviada!',
        description: `Solicitação de amizade enviada para ${profile.name}`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a solicitação de amizade',
        variant: 'destructive',
      });
    }
  };

  const handleAcceptRequest = async () => {
    // This would need the request ID which we'd get from connection status check
    // For now, we'll implement a simplified version
    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'Aceitar solicitação será implementado em breve',
    });
  };

  const handleRejectRequest = async () => {
    // This would need the request ID which we'd get from connection status check
    // For now, we'll implement a simplified version
    toast({
      title: 'Funcionalidade em desenvolvimento', 
      description: 'Rejeitar solicitação será implementado em breve',
    });
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchProfileFromAPI = async (userIdentifier: string | undefined) => {
    if (!userIdentifier) throw new Error('User identifier is required');

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) throw new Error('No access token found');

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(userIdentifier);
    
    const apiEndpoint = isUUID 
      ? `http://localhost:3002/api/profile/${userIdentifier}`
      : `http://localhost:3002/api/profile/by-nickname/${userIdentifier}`;

    const response = await fetch(apiEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 403) throw new Error('Este perfil é privado');
      if (response.status === 404) throw new Error('Usuário não encontrado');
      throw new Error(`Erro ao buscar perfil: ${response.status}`);
    }

    const data = await response.json();
    const apiProfile = data.data;
    
    const profileData: ProfileData = {
      id: apiProfile.id,
      name: apiProfile.name,
      username: apiProfile.nickname || 'user',
      email: apiProfile.email || '',
      bio: apiProfile.bio || '',
      cidade: apiProfile.city || '',
      interesses: apiProfile.interests || [],
      private: apiProfile.privateProfile || false,
      avatarUrl: apiProfile.avatarUrl || '',
      counters: { friends: 0, posts: 0, photos: 0 }
    };

    setProfile(profileData);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) {
        setError('Usuário não autenticado');
        setLoading(false);
        return;
      }

      if (!isMyProfile && !nickname) {
        setError('Nickname do perfil não encontrado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        await fetchProfileFromAPI(isMyProfile ? currentUser?.id : nickname);
        
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Erro ao carregar perfil');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [nickname, currentUser, isMyProfile]);

  // Check connection status after profile is loaded
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!isMyProfile && profile && profile.id) {
        try {
          const status = await getConnectionStatus(profile.id);
          setConnectionStatus(status);
        } catch (error) {
          console.error('Error checking connection status:', error);
        }
      }
    };

    checkConnectionStatus();
  }, [profile, isMyProfile, getConnectionStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-medium">Carregando perfil...</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium mb-2">Erro ao carregar perfil</h3>
            <p className="text-muted-foreground text-sm mb-4">{error}</p>
            <Button onClick={() => window.history.back()}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card className="mb-4 shadow-study">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  {profile.avatarUrl && profile.avatarUrl.startsWith('a') ? (
                    <div className="w-full h-full bg-primary text-primary-foreground flex items-center justify-center text-2xl">
                      {getAvatarEmoji(profile.avatarUrl)}
                    </div>
                  ) : profile.avatarUrl ? (
                    <AvatarImage src={profile.avatarUrl} alt={`Avatar de ${profile.name}`} />
                  ) : (
                    <AvatarFallback className="text-2xl">
                      {profile.name.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  <Badge variant="secondary">@{profile.username}</Badge>
                  {isMyProfile ? (
                    <Badge variant="outline" className="text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                      Meu Perfil
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-blue-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                      Perfil Público
                    </Badge>
                  )}
                </div>
                {profile.bio && <p className="text-muted-foreground">{profile.bio}</p>}
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {isMyProfile ? (
                    <Button onClick={() => setIsEditing(true)} size="sm" className="btn-cta">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar perfil
                    </Button>
                  ) : (
                    <>
                      {connectionStatus === 'none' && (
                        <Button 
                          size="sm" 
                          className="btn-cta"
                          onClick={handleAddFriend}
                          disabled={connectionLoading}
                        >
                          {connectionLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <UserPlus className="w-4 h-4 mr-2" />
                          )}
                          {connectionLoading ? 'Enviando...' : 'Adicionar amigo'}
                        </Button>
                      )}
                      
                      {connectionStatus === 'request_sent' && (
                        <Button size="sm" variant="outline" disabled>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Solicitação enviada
                        </Button>
                      )}
                      
                      {connectionStatus === 'request_received' && (
                        <>
                          <Button 
                            size="sm" 
                            className="btn-cta"
                            onClick={handleAcceptRequest}
                            disabled={connectionLoading}
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Aceitar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={handleRejectRequest}
                            disabled={connectionLoading}
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Recusar
                          </Button>
                        </>
                      )}
                      
                      {connectionStatus === 'friends' && (
                        <Button size="sm" variant="outline" disabled>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Amigos
                        </Button>
                      )}
                      
                      <Button size="sm" variant="outline">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Mensagem
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-study">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Sobre mim
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{profile.cidade || 'Não informado'}</span>
                </div>
                {isMyProfile && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Interesses</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.interesses.length > 0 ? (
                      profile.interesses.map((interesse, index) => (
                        <Badge key={index} variant="secondary">
                          {interesse}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">Nenhum interesse informado</p>
                    )}
                  </div>
                </div>
                
                {/* Nova seção: Posts do usuário */}
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-4">
                    {isMyProfile ? 'Minhas Publicações' : 'Publicações do Usuário'}
                  </h4>
                  <ProfilePostsSection 
                    userId={profile.id} 
                    isMyProfile={isMyProfile}
                    initialLimit={10}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-study">
              <CardHeader>
                <CardTitle>Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Amigos</span>
                  </div>
                  <Badge variant="outline">{profile.counters.friends}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Posts</span>
                  </div>
                  <Badge variant="outline">{profile.counters.posts}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Nome de usuário</Label>
              <Input
                id="username"
                value={editForm.username}
                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={editForm.cidade}
                onChange={(e) => setEditForm(prev => ({ ...prev, cidade: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="interesses">Interesses (separados por vírgula)</Label>
              <Input
                id="interesses"
                value={editForm.interesses}
                onChange={(e) => setEditForm(prev => ({ ...prev, interesses: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsEditing(false)} className="btn-cta">
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}