import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAppContext } from '@/contexts/AppContext';
import { Plus } from 'lucide-react';

interface CreateTrailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateTrailDialog: React.FC<CreateTrailDialogProps> = ({ open, onOpenChange }) => {
  const { actions } = useAppContext();
  const { createTrail } = actions;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Use a timeout to ensure the input is rendered before focusing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('O nome da trilha não pode estar em branco.');
      return;
    }
    setError(null);
    setIsCreating(true);
    const success = await createTrail(name, description, isPrivate);
    setIsCreating(false);
    if (success) {
      setName('');
      setDescription('');
      setIsPrivate(true);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Trilha de Estudo</DialogTitle>
          <DialogDescription>
            Crie uma nova trilha para colaborar com amigos e organizar seus estudos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="trail-name">Nome da Trilha</Label>
            <Input
              ref={inputRef}
              id="trail-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Concurso Público 2024"
              required
              disabled={isCreating}
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
          <div>
            <Label htmlFor="trail-description">Descrição (opcional)</Label>
            <Textarea
              id="trail-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo desta trilha de estudo..."
              rows={3}
              disabled={isCreating}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="trail-private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              disabled={isCreating}
            />
            <Label htmlFor="trail-private">Trilha privada (apenas por convite)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? 'Criando...' : 'Criar Trilha'}
            {!isCreating && <Plus className="w-4 h-4 ml-2" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
