import React, { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { Users, Plus, Crown, Trash2, LogOut, ArrowLeft, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TrailCard } from '@/components/TrailCard';
import { CreateTrailDialog } from '@/components/dialogs/CreateTrailDialog';
import { MembersDialog } from '@/components/dialogs/MembersDialog';
import { InviteDialog } from '@/components/dialogs/InviteDialog';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';

const StudyTrails = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state, actions } = useAppContext();
  const { trails, trailsLoading: loading } = state;
  const { leaveTrail, deleteTrail, fetchTrailMembers } = actions;

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const [members, setMembers] = useState<any[]>([]);
  const [selectedTrail, setSelectedTrail] = useState<{id: string, name: string} | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    action: 'leave' | 'delete' | null;
    handler: (() => void) | null;
  }>({ action: null, handler: null });

  const handleViewMembers = async (trailId: string) => {
    const fetchedMembers = await fetchTrailMembers(trailId);
    setMembers(fetchedMembers);
    setIsMembersDialogOpen(true);
  };

  const handleInvite = (trailId: string) => {
    const trail = trails.find(t => t.id === trailId);
    if (trail) {
      setSelectedTrail({ id: trail.id, name: trail.name });
      setIsInviteDialogOpen(true);
    }
  };

  const confirmLeaveTrail = (trailId: string) => {
    setConfirmAction({
      action: 'leave',
      handler: () => leaveTrail(trailId)
    });
    setIsConfirmDialogOpen(true);
  };

  const confirmDeleteTrail = (trailId: string) => {
    setConfirmAction({
      action: 'delete',
      handler: () => deleteTrail(trailId)
    });
    setIsConfirmDialogOpen(true);
  };

  const isTrailAdmin = (trail: any) => {
    return trail.admin_id === user?.id;
  };

  return (
    <div className="flex h-screen">
      <Sidebar activeSection="trilhas" setActiveSection={() => {}} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Users className="w-8 h-8" />
                    Trilhas de Estudo
                  </h1>
                  <p className="text-muted-foreground">
                    Crie e gerencie suas trilhas de estudo colaborativas
                  </p>
                </div>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Nova Trilha
              </Button>
            </div>

            <div className="space-y-4 mt-6">
              <h2 className="text-xl font-semibold">Minhas Trilhas</h2>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Carregando trilhas...
                  </div>
                </div>
              ) : trails.length === 0 ? (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma trilha encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                      Você ainda não possui ou participa de nenhuma trilha de estudo.
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeira Trilha
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {trails.map((trail) => (
                    <TrailCard
                      key={trail.id}
                      trail={trail}
                      isTrailAdmin={isTrailAdmin(trail)}
                      onViewMembers={handleViewMembers}
                      onInvite={handleInvite}
                      onDelete={confirmDeleteTrail}
                      onLeave={confirmLeaveTrail}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
        <CreateTrailDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
        <MembersDialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen} members={members} />
        <InviteDialog
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
          trailId={selectedTrail?.id || null}
          trailName={selectedTrail?.name || ''}
        />
        <ConfirmDialog
          open={isConfirmDialogOpen}
          onOpenChange={setIsConfirmDialogOpen}
          onConfirm={() => {
            if (confirmAction.handler) {
              confirmAction.handler();
            }
            setIsConfirmDialogOpen(false);
          }}
          title={confirmAction.action === 'delete' ? 'Excluir Trilha?' : 'Sair da Trilha?'}
          description={
            confirmAction.action === 'delete'
              ? 'Esta ação não pode ser desfeita. A trilha e todo o seu conteúdo serão permanentemente excluídos.'
              : 'Você tem certeza que deseja sair desta trilha? Você perderá o acesso ao seu conteúdo.'
          }
        />
      </div>
    </div>
  );
};

export default StudyTrails;