import { Users, UserPlus, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface Member {
  id: string;
  name: string;
  initials: string;
  activity: string;
  isOnline: boolean;
  isHost?: boolean;
}

interface MembersPanelProps {
  members: Member[];
  onAddMember?: () => void;
  onLeaveRoom?: () => void;
}

export function MembersPanel({ members, onAddMember, onLeaveRoom }: MembersPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="bg-card border border-border rounded-2xl shadow-lg flex flex-col min-h-[200px] lg:min-h-[calc(100vh-56px-28px)] max-h-[40vh] lg:max-h-none overflow-hidden">
      {/* Header */}
      <div className="p-2 lg:p-3 border-b border-border flex items-center gap-2 lg:gap-3">
        <Users className="h-4 w-4 lg:h-5 lg:w-5" />
        <h2 className="text-base lg:text-lg font-semibold">Membros</h2>
        <div className="flex-1" />
        <span className="text-sm text-muted-foreground">{members.length}</span>
      </div>

      {/* Body */}
      <div className="p-2 lg:p-3 flex flex-col gap-2 lg:gap-3 flex-1 min-h-0 overflow-auto">
        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Buscar membro"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm"
          />
          <Button variant="outline" size="sm" onClick={onAddMember} className="px-2">
            <UserPlus className="h-4 w-4" />
            <span className="sr-only">Adicionar membro</span>
          </Button>
        </div>

        {/* Members List */}
        <div className="flex flex-col gap-1.5 lg:gap-2 flex-1 min-h-0 overflow-auto">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 lg:gap-3 p-2 border border-border rounded-xl bg-muted/30"
            >
              <Avatar className="h-6 w-6 lg:h-7 lg:w-7 flex-shrink-0">
                <AvatarFallback className="text-xs font-semibold bg-primary/10">
                  {member.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 lg:gap-2">
                  <span className="font-semibold truncate text-sm lg:text-base">{member.name}</span>
                  {member.isHost && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 hidden sm:inline-flex">
                      host
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {member.activity}
                </div>
              </div>
              <div
                className={`w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full flex-shrink-0 ${
                  member.isOnline ? "bg-green-500" : "bg-muted-foreground"
                }`}
                title={member.isOnline ? "online" : "offline"}
              />
            </div>
          ))}
        </div>

        {/* Leave Room Button */}
        <div className="flex justify-end pt-2 lg:pt-3 border-t border-border/50">
          <Button variant="ghost" size="sm" onClick={onLeaveRoom} className="px-2">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sair da sala</span>
          </Button>
        </div>
      </div>
    </section>
  );
}