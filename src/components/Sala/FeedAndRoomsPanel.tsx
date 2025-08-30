import { LayoutList, CheckCircle, GraduationCap, BookOpen, Globe, Lock, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface ActivityItem {
  id: string;
  icon: "check-circle" | "graduation-cap" | "book-open";
  content: string;
  timestamp: string;
}

interface Room {
  id: string;
  name: string;
  code: string;
  isOwner: boolean;
  visibility: "pública" | "privada";
  members: number;
  isFavorite?: boolean;
}

interface FeedAndRoomsPanelProps {
  activities: ActivityItem[];
  rooms: Room[];
  onToggleFavorite?: (roomId: string) => void;
  onJoinRoom?: (room: Room) => void;
  showActivities?: boolean;
}

export function FeedAndRoomsPanel({ 
  activities, 
  rooms, 
  onToggleFavorite, 
  onJoinRoom,
  showActivities = true
}: FeedAndRoomsPanelProps) {
  const [roomsFilter, setRoomsFilter] = useState<"mine" | "all">("mine");
  const [roomsSearch, setRoomsSearch] = useState("");

  const getActivityIcon = (icon: ActivityItem["icon"]) => {
    switch (icon) {
      case "check-circle":
        return <CheckCircle className="h-4 w-4" />;
      case "graduation-cap":
        return <GraduationCap className="h-4 w-4" />;
      case "book-open":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const filteredRooms = rooms
    .filter(room => {
      const matchesFilter = roomsFilter === "mine" ? room.isOwner : !room.isOwner;
      const matchesSearch = room.name.toLowerCase().includes(roomsSearch.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      // Favoritas primeiro
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
      // Públicas antes das privadas
      if (a.visibility !== b.visibility) {
        return a.visibility === "pública" ? -1 : 1;
      }
      // Ordem alfabética
      return a.name.localeCompare(b.name);
    });

  return (
    <aside className="bg-card border border-border rounded-2xl shadow-lg flex flex-col min-h-[300px] lg:min-h-[calc(100vh-56px-28px)] max-h-[50vh] lg:max-h-none overflow-hidden">
      {/* Header */}
      <Tabs defaultValue={showActivities ? "feed" : "rooms"} className="flex flex-col flex-1 min-h-0">
        <div className="p-3 border-b border-border flex items-center gap-2 lg:gap-3 flex-wrap">
          <LayoutList className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
          <h2 className="text-base lg:text-lg font-semibold flex-1 min-w-0">
            {showActivities ? "Feed / Salas" : "Minhas Salas"}
          </h2>
          {showActivities && (
            <TabsList className="grid w-auto grid-cols-2 flex-shrink-0">
              <TabsTrigger value="feed" className="text-xs px-2 py-1">Feed</TabsTrigger>
              <TabsTrigger value="rooms" className="text-xs px-2 py-1">Salas</TabsTrigger>
            </TabsList>
          )}
        </div>
        
        {/* Feed Tab - only show if showActivities is true */}
        {showActivities && (
          <TabsContent value="feed" className="p-3 flex-1 m-0">
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border border-border rounded-xl bg-muted/30">
                    {getActivityIcon(activity.icon)}
                    <div className="flex-1">
                      <div dangerouslySetInnerHTML={{ __html: activity.content }} />
                      <div className="text-xs text-muted-foreground mt-1">
                        {activity.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        )}

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="p-2 lg:p-3 flex flex-col flex-1 m-0 min-h-0" forceMount={!showActivities}>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
            <ToggleGroup 
              type="single" 
              value={roomsFilter} 
              onValueChange={(value) => value && setRoomsFilter(value as "mine" | "all")}
              className="border rounded-lg p-1 w-full sm:w-auto"
            >
              <ToggleGroupItem value="mine" className="text-xs flex-1 sm:flex-none">
                Minhas salas
              </ToggleGroupItem>
              <ToggleGroupItem value="all" className="text-xs flex-1 sm:flex-none">
                Salas
              </ToggleGroupItem>
            </ToggleGroup>
            <Input
              placeholder="Buscar sala"
              value={roomsSearch}
              onChange={(e) => setRoomsSearch(e.target.value)}
              className="w-full sm:min-w-[160px] text-sm"
            />
          </div>

          {/* Rooms List */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-2 pr-2">
              {filteredRooms.map((room) => {
                return (
                  <div
                    key={room.id}
                    className="flex items-center gap-2 lg:gap-3 p-2 lg:p-3 border border-border rounded-xl bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onJoinRoom?.(room)}
                  >
                    {room.visibility === "pública" ? (
                      <Globe className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <Lock className="h-4 w-4 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate text-sm lg:text-base">{room.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {room.visibility} • {room.members} membros
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {room.isOwner && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5 hidden sm:inline-flex">
                          sua
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 lg:h-8 lg:w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite?.(room.id);
                        }}
                      >
                        <Star
                          className={`h-3.5 w-3.5 lg:h-4 lg:w-4 ${
                            room.isFavorite ? "fill-yellow-400 text-yellow-400" : ""
                          }`}
                        />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          
          <div className="text-xs text-muted-foreground mt-2 lg:mt-3 px-1 hidden lg:block">
            Dica: clique na estrela para favoritar. Favoritas vão para o topo.
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}