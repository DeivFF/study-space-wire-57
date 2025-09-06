import { Plus, Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyRoomStateProps {
  onCreateRoom: () => void;
}

export function EmptyRoomState({ onCreateRoom }: EmptyRoomStateProps) {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px] lg:min-h-[400px] p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 lg:p-8 text-center">
          <div className="flex justify-center mb-4 lg:mb-6">
            <div className="relative">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-muted rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 lg:h-8 lg:w-8 text-muted-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 lg:w-6 lg:h-6 bg-primary rounded-full flex items-center justify-center">
                <MessageSquare className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-primary-foreground" />
              </div>
            </div>
          </div>
          
          <h3 className="mb-3 text-base lg:text-lg">Você ainda não está em uma sala</h3>
          
          <p className="text-muted-foreground mb-6 leading-relaxed text-sm lg:text-base">
            Crie uma sala para convidar membros e desbloquear o chat. 
            <span className="hidden sm:inline"> Você também pode participar de uma das salas disponíveis.</span>
            <span className="block sm:hidden mt-2">Ou escolha uma sala da lista acima.</span>
          </p>
          
          <Button onClick={onCreateRoom} className="w-full" size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Criar Sala
          </Button>
          
          <p className="text-xs text-muted-foreground mt-4 hidden lg:block">
            Ou escolha uma sala existente na lista ao lado
          </p>
        </CardContent>
      </Card>
    </div>
  );
}