import { useState } from "react";
import { MessageSquare, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface AccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: {
    id: string;
    name: string;
    visibility: 'public' | 'private';
    owner_name?: string;
  } | null;
  onRequestAccess: (roomId: string, message?: string) => Promise<void>;
}

export function AccessRequestModal({ 
  isOpen, 
  onClose, 
  room, 
  onRequestAccess 
}: AccessRequestModalProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!room) return null;

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onRequestAccess(room.id, message);
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Failed to request access:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Solicitar Acesso - {room.name}
          </DialogTitle>
          <DialogDescription>
            Esta sala {room.visibility === 'private' ? 'privada' : 'pública'} 
            pertence a {room.owner_name || 'um usuário'}. 
            Envie uma mensagem explicando por que deseja entrar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagem (opcional)
            </label>
            <Textarea
              id="message"
              placeholder="Gostaria de estudar junto com vocês..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/200 caracteres
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Solicitar Acesso'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}