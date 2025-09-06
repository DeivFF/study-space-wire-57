import { AlertTriangle, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LeaveRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  roomName: string;
  isLoading?: boolean;
}

export function LeaveRoomModal({
  isOpen,
  onClose,
  onConfirm,
  roomName,
  isLoading = false,
}: LeaveRoomModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Sair da sala
          </DialogTitle>
          <DialogDescription className="pt-2">
            Tem certeza de que deseja sair da sala{" "}
            <span className="font-semibold">"{roomName}"</span>?
            <br />
            <br />
            Você precisará ser convidado novamente para retornar à sala.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Sair da sala
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}