import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import UserCard, { UserCardInfo } from '@/components/UserCard';
import InviteParticipantsModal from '@/components/InviteParticipantsModal';
import FocusTimerModal from "@/components/FocusTimerModal";
import ModernRoomChat from '@/components/ModernRoomChat';
import { useAuth } from '@/hooks/useAuth';
const MoreIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props} className="w-5 h-5 text-gray-600">
    <circle cx={5} cy={12} r={2} />
    <circle cx={12} cy={12} r={2} />
    <circle cx={19} cy={12} r={2} />
  </svg>
);

type Participant = UserCardInfo & {
  status: string;
  roleColor: string;
  isStudying?: boolean;
};

const participants: Participant[] = [
    { name: "Ana Souza", avatar: "A", role: "Owner", status: "Online", roleColor: "bg-orange-500", stats: { aulas: 5, flashcards: 120, streak: 7 } },
    { name: "Bruno Lima", avatar: "B", role: "Admin", status: "Estudando", roleColor: "bg-blue-500", isStudying: true, stats: { aulas: 10, flashcards: 200, streak: 15 } },
    { name: "Carla Mendes", avatar: "C", role: "Member", status: "Online", roleColor: "bg-success", stats: { aulas: 2, flashcards: 50, streak: 3 } },
    { name: "Luana Alves", avatar: "L", role: "Member", status: "Online", roleColor: "bg-success", stats: { aulas: 8, flashcards: 150, streak: 10 } },
    { name: "Marcos Teixeira", avatar: "M", role: "Member", status: "Online", roleColor: "bg-success", stats: { aulas: 1, flashcards: 20, streak: 1 } }
];

const AdvancedStudyRoom = () => {
  const { user, loading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Participant | null>(null);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [isFocusTimerModalOpen, setFocusTimerModalOpen] = useState(false);

  const handleUserClick = (user: Participant) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto p-6 h-[calc(100vh-48px)]">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-5">
          <h1 className="text-2xl font-bold text-foreground mr-auto">Sala de Estudos Avançados</h1>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <div className="w-2 h-2 bg-success rounded-full mr-2" />
            Conectado
          </Badge>
          <Button variant="outline" onClick={() => setInviteModalOpen(true)}>Convidar</Button>
          <Button variant="outline">Biblioteca</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setFocusTimerModalOpen(true)}>
            ⏱️ Timer de Foco
          </Button>
        </div>

        {/* Three columns layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] gap-0 h-full min-h-0">
          {/* Left: Participants */}
          <div className="bg-card border border-border rounded-2xl rounded-r-none overflow-hidden flex flex-col h-full">
            <div className="p-4 flex-shrink-0">
              <h2 className="font-bold text-lg text-foreground">Participantes</h2>
            </div>
            
            <div className="px-4 pb-4 flex-shrink-0">
              <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg" onClick={() => setInviteModalOpen(true)}>
                + Convidar
              </Button>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="px-4 pb-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  Participantes
                </h4>
                
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {participants.map((participant, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gray-200 text-gray-700 font-semibold text-sm">
                            {participant.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-foreground">{participant.name}</div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-600">{participant.role}</span>
                            <span className="text-gray-400">•</span>
                            <span className={participant.isStudying ? "text-blue-600 font-medium" : "text-green-600"}>
                              {participant.isStudying ? "Estudando" : "Online"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* Center: Chat */}
          <div className="rounded-none border-x-0 overflow-hidden flex flex-col h-full">
            <ModernRoomChat
              roomId="demo-room"
              user={user}
              roomTitle="Sala ENEM 2026"
              roomSubtitle="Estudo em Grupo"
            />
          </div>

          {/* Right: Activity Feed */}
          <Card className="rounded-l-none border-l-0 lg:rounded-r-2xl lg:rounded-l-none overflow-hidden flex flex-col h-full">
            <div className="p-5 flex-shrink-0">
              <h2 className="text-lg font-bold mb-1.5">Atividades da Sala</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Últimas 24 horas de interações e eventos.
              </p>

              <div className="flex gap-3 mb-3">
                <Button variant="outline" size="sm" className="flex-1 justify-between text-xs font-semibold">
                  <span className="text-foreground">Filtrar por tipo de evento</span>
                  <span className="text-muted-foreground">›</span>
                </Button>
                <Button variant="outline" size="sm" className="flex-1 justify-between text-xs font-semibold">
                  <span className="text-foreground">Selecionar período</span>
                  <span className="text-muted-foreground">›</span>
                </Button>
              </div>
            </div>

            <Card className="flex-1 mx-5 mb-5 overflow-hidden flex flex-col min-h-0 shadow-sm">
              <ScrollArea className="flex-1">
                <div className="divide-y divide-border">
                  {[
                    { icon: "⏱", color: "bg-primary", title: "Maria iniciou sessão de foco", subtitle: "25 minutos de estudo ininterrupto", time: "09:05" },
                    { icon: "✓", color: "bg-success", title: "João completou exercícios", subtitle: "10 questões respondidas de Licitações", time: "09:10" },
                    { icon: "📘", color: "bg-warning", title: "Bruno está estudando", subtitle: "Administração — Capítulo 3", time: "09:20" },
                    { icon: "📄", color: "bg-purple-500", title: "PDF adicionado à Biblioteca", subtitle: "mapas. mentais.pdf", time: "08:55" },
                    { icon: "⏸", color: "bg-orange-500", title: "Resumo diário do grupo", subtitle: "5 horas estudadas, 150 questões respondidas, 10 videoaulas", time: "ontem 21:00" }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3.5 first:border-t-0">
                      <div className={`w-8 h-8 ${activity.color} rounded-full flex items-center justify-center text-white text-sm shrink-0`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm leading-tight">{activity.title}</div>
                        <div className="text-xs text-muted-foreground leading-tight">{activity.subtitle}</div>
                      </div>
                      <div className="text-xs text-muted-foreground font-semibold whitespace-nowrap">
                        {activity.time}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            <div className="p-3 text-center flex-shrink-0">
              <p className="text-xs text-muted-foreground">
                Mostrando apenas eventos das últimas 24 horas.
              </p>
            </div>
          </Card>
        </div>
      </div>
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => setDialogOpen(open)}
      >
        <DialogContent className="p-0 bg-transparent border-none max-w-sm">
          {selectedUser && (
            <UserCard user={selectedUser} onClose={() => setDialogOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
      <InviteParticipantsModal isOpen={isInviteModalOpen} onClose={() => setInviteModalOpen(false)} />
      {isFocusTimerModalOpen && <FocusTimerModal onClose={() => setFocusTimerModalOpen(false)} />}
    </main>
  );
};

export default AdvancedStudyRoom;
