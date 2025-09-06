import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FolderOpen, Palette } from 'lucide-react';
import { studyAPI } from '@/services/studyApi';
import { useToast } from '@/hooks/use-toast';

interface CreateStudyTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudyTypeCreated?: () => void;
}


export function CreateStudyTypeModal({ open, onOpenChange, onStudyTypeCreated }: CreateStudyTypeModalProps) {
  const [form, setForm] = useState({
    name: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await studyAPI.createStudyType({
        name: form.name.trim(),
        color: '#5e6470',
        icon: 'book'
      });

      toast({
        title: "Sucesso",
        description: "Tipo de estudo criado com sucesso!",
      });

      setForm({ name: '' });
      onOpenChange(false);
      onStudyTypeCreated?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar tipo de estudo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md bg-app-panel border-app-border">
        <DialogHeader className="flex flex-row items-center gap-2 space-y-0 pb-4 border-b border-app-border">
          <FolderOpen className="w-5 h-5 text-app-text" />
          <DialogTitle className="text-app-text">Novo Tipo de Estudo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs text-app-text-muted">Nome *</Label>
            <Input
              id="name"
              placeholder="Ex: ENEM, Vestibular, Concurso..."
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="bg-app-bg border-app-border text-app-text placeholder:text-app-text-muted"
            />
          </div>

        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-app-border">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="bg-transparent border-app-border text-app-text hover:bg-app-muted"
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!form.name.trim() || isLoading}
            className="bg-gradient-to-r from-app-accent to-app-accent-2 text-white hover:opacity-90"
          >
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}