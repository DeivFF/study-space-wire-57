import { useState } from "react";
import { Plus, Lock, Globe, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomData: {
    name: string;
    description: string;
    visibility: "pública" | "privada";
    code: string;
  }) => void;
}

export function CreateRoomModal({ isOpen, onClose, onCreateRoom }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"pública" | "privada">("pública");
  const [isLoading, setIsLoading] = useState(false);

  const generateRoomCode = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const number = numbers[Math.floor(Math.random() * numbers.length)];
    return `#${letter}${number}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomName.trim()) {
      toast.error("Nome da sala é obrigatório");
      return;
    }

    if (roomName.trim().length < 3) {
      toast.error("Nome da sala deve ter pelo menos 3 caracteres");
      return;
    }

    setIsLoading(true);

    // Simulate room creation delay
    setTimeout(() => {
      const roomCode = generateRoomCode();
      
      onCreateRoom({
        name: roomName.trim(),
        description: description.trim(),
        visibility,
        code: roomCode,
      });

      toast.success("Sala criada com sucesso!", {
        description: `Sua sala "${roomName}" foi criada com o código ${roomCode}.`,
      });

      // Reset form
      setRoomName("");
      setDescription("");
      setVisibility("pública");
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  const handleClose = () => {
    if (!isLoading) {
      setRoomName("");
      setDescription("");
      setVisibility("pública");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base lg:text-lg">
            <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
            Criar Nova Sala
          </DialogTitle>
          <DialogDescription className="text-sm">
            Crie uma sala de estudo para colaborar com outros membros.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-name" className="text-sm">Nome da Sala *</Label>
            <Input
              id="room-name"
              placeholder="Ex: Matemática — Álgebra Linear"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={50}
              disabled={isLoading}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {roomName.length}/50 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva o foco da sua sala de estudo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              disabled={isLoading}
              className="text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/200 caracteres
            </p>
          </div>

          <div className="space-y-2 lg:space-y-3">
            <Label className="text-sm">Visibilidade</Label>
            <RadioGroup
              value={visibility}
              onValueChange={(value) => setVisibility(value as "pública" | "privada")}
              disabled={isLoading}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2 p-2 lg:p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="pública" id="public" />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <Label htmlFor="public" className="cursor-pointer text-sm">
                      Pública
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Qualquer pessoa pode encontrar e entrar
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-2 lg:p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="privada" id="private" />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <Label htmlFor="private" className="cursor-pointer text-sm">
                      Privada
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Apenas pessoas convidadas podem entrar
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 text-sm"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !roomName.trim()}
              className="flex-1 text-sm"
            >
              {isLoading ? (
                <>
                  <Users className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Sala
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}