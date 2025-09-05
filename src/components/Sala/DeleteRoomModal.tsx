import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  roomName: string;
  isLoading?: boolean;
}

export function DeleteRoomModal({
  isOpen,
  onClose,
  onConfirm,
  roomName,
  isLoading = false,
}: DeleteRoomModalProps) {
  const [confirmationInput, setConfirmationInput] = useState("");
  
  const isConfirmationValid = confirmationInput === roomName;

  const handleConfirm = () => {
    if (isConfirmationValid) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setConfirmationInput("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir sala permanentemente
          </DialogTitle>
          <DialogDescription className="pt-2 space-y-3">
            <div>
              Tem certeza de que deseja excluir permanentemente a sala{" "}
              <span className="font-semibold">"{roomName}"</span>?
            </div>
            
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-sm text-destructive font-medium mb-2">
                ⚠️ Esta ação não pode ser desfeita:
              </p>
              <ul className="text-sm text-destructive/80 space-y-1 list-disc list-inside">
                <li>Todos os membros serão removidos automaticamente</li>
                <li>Todo o histórico de mensagens será perdido</li>
                <li>Todos os convites pendentes serão cancelados</li>
                <li>A sala não poderá ser recuperada</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmation" className="text-sm font-medium">
                Digite o nome da sala para confirmar:
              </Label>
              <Input
                id="confirmation"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={`Digite: ${roomName}`}
                disabled={isLoading}
                className="font-mono"
              />
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !isConfirmationValid}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Excluir sala permanentemente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}