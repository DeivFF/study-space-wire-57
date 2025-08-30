import { useState } from "react";
import { Search, UserPlus, X, Check, Clock, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  initials: string;
  status: "disponível" | "convidado" | "na_sala";
  invitedAt?: string;
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMembers?: { id: string; name: string }[];
}

// Mock data de usuários disponíveis para convite
const mockUsers: User[] = [
  {
    id: "u1",
    name: "Maria Silva",
    initials: "MS",
    status: "disponível",
  },
  {
    id: "u2",
    name: "João Santos",
    initials: "JS",
    status: "disponível",
  },
  {
    id: "u3",
    name: "Ana Costa",
    initials: "AC",
    status: "convidado",
    invitedAt: "há 5 min",
  },
  {
    id: "u4",
    name: "Pedro Lima",
    initials: "PL",
    status: "disponível",
  },
  {
    id: "u5",
    name: "Laura Oliveira",
    initials: "LO",
    status: "convidado",
    invitedAt: "há 2 min",
  },
  {
    id: "u6",
    name: "Carlos Ferreira",
    initials: "CF",
    status: "na_sala",
  },
  {
    id: "u7",
    name: "Fernanda Rocha",
    initials: "FR",
    status: "disponível",
  },
  {
    id: "u8",
    name: "Bruno Alves",
    initials: "BA",
    status: "convidado",
    invitedAt: "há 10 min",
  },
];

export function InviteModal({ isOpen, onClose, currentMembers = [] }: InviteModalProps) {
  const [users, setUsers] = useState(mockUsers);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableUsers = filteredUsers.filter(user => user.status === "disponível");
  const invitedUsers = filteredUsers.filter(user => user.status === "convidado");

  const handleInviteUser = (userId: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId
          ? { ...user, status: "convidado", invitedAt: "agora mesmo" }
          : user
      )
    );

    const user = users.find(u => u.id === userId);
    toast.success("Convite enviado!", {
      description: `Convite enviado para ${user?.name}.`,
    });
  };

  const handleRevokeInvite = (userId: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId
          ? { ...user, status: "disponível", invitedAt: undefined }
          : user
      )
    );

    const user = users.find(u => u.id === userId);
    toast.success("Convite revogado", {
      description: `Convite de ${user?.name} foi revogado.`,
    });
  };

  const getStatusBadge = (status: User["status"]) => {
    switch (status) {
      case "disponível":
        return <Badge variant="secondary">Disponível</Badge>;
      case "convidado":
        return <Badge variant="default">Convidado</Badge>;
      case "na_sala":
        return <Badge variant="outline">Na sala</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: User["status"]) => {
    switch (status) {
      case "disponível":
        return <UserPlus className="h-4 w-4" />;
      case "convidado":
        return <Clock className="h-4 w-4" />;
      case "na_sala":
        return <Check className="h-4 w-4" />;
      default:
        return <UserPlus className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Convidar para a sala
          </DialogTitle>
          <DialogDescription>
            Busque e convide usuários para participar da sua sala de estudo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="available" className="flex flex-col flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="available">
                Disponíveis ({availableUsers.length})
              </TabsTrigger>
              <TabsTrigger value="invited">
                Convidados ({invitedUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="flex-1 mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {availableUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum usuário disponível encontrado.</p>
                    </div>
                  ) : (
                    availableUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-sm font-semibold bg-primary/10">
                            {user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{user.name}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            @{user.initials.toLowerCase()}
                          </div>
                        </div>
                        {getStatusBadge(user.status)}
                        <Button
                          size="sm"
                          onClick={() => handleInviteUser(user.id)}
                          className="ml-2"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Convidar
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="invited" className="flex-1 mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {invitedUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum convite pendente.</p>
                    </div>
                  ) : (
                    invitedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-sm font-semibold bg-primary/10">
                            {user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{user.name}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            @{user.initials.toLowerCase()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Convidado {user.invitedAt}
                          </div>
                        </div>
                        {getStatusBadge(user.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeInvite(user.id)}
                          className="ml-2"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Revogar
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}