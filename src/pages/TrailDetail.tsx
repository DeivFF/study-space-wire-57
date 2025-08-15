// @ts-nocheck
import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import TrailChat from '@/components/TrailChat';

const TrailDetail = () => {
  const { trailId } = useParams<{ trailId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLeaveRoom = useCallback(async () => {
    if (!trailId) return;
    try {
      const { error } = await (supabase as any).rpc('leave_study_room', { p_room_id: trailId });
      if (error) throw error;

      toast({
        title: "Você saiu da sala",
        description: "Você será redirecionado para a página de trilhas.",
      });
      navigate('/trilhas');
    } catch (error) {
      console.error("Error leaving study room:", error);
      toast({
        title: "Erro ao sair da sala",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }, [trailId, navigate, toast]);

  return (
    <div className="flex h-screen">
      <Sidebar activeSection="trilhas" setActiveSection={() => {}} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/trilhas')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para Trilhas
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLeaveRoom}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair da Sala
              </Button>
            </div>
            <h1 className="text-3xl font-bold">Sala de Estudos</h1>
            <p className="text-muted-foreground mt-2">
              Bem-vindo ao chat da sala de estudos!
            </p>
            <div className="mt-6">
              {trailId ? (
                <TrailChat trailId={trailId} />
              ) : (
                <p>ID da trilha não encontrado.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TrailDetail;
