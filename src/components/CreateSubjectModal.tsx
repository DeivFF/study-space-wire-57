import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Palette } from 'lucide-react';
import { studyAPI, StudyType } from '@/services/studyApi';
import { useToast } from '@/hooks/use-toast';

interface CreateSubjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubjectCreated?: () => void;
}


export function CreateSubjectModal({ open, onOpenChange, onSubjectCreated }: CreateSubjectModalProps) {
  const [form, setForm] = useState({
    name: '',
    studyTypeId: ''
  });
  const [studyTypes, setStudyTypes] = useState<StudyType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStudyTypes, setIsLoadingStudyTypes] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadStudyTypes();
    }
  }, [open]);

  const loadStudyTypes = async () => {
    setIsLoadingStudyTypes(true);
    try {
      const types = await studyAPI.getStudyTypes();
      setStudyTypes(types);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de estudo",
        variant: "destructive"
      });
    } finally {
      setIsLoadingStudyTypes(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!form.studyTypeId) {
      toast({
        title: "Erro",
        description: "Tipo de estudo é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await studyAPI.createSubject(form.studyTypeId, {
        name: form.name.trim(),
        color: '#28a745'
      });

      toast({
        title: "Sucesso",
        description: "Disciplina criada com sucesso!",
      });

      setForm({ name: '', studyTypeId: '' });
      onOpenChange(false);
      onSubjectCreated?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar disciplina",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: '', studyTypeId: '' });
    onOpenChange(false);
  };

  const selectedStudyType = studyTypes.find(type => type.id === form.studyTypeId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md bg-app-panel border-app-border">
        <DialogHeader className="flex flex-row items-center gap-2 space-y-0 pb-4 border-b border-app-border">
          <FileText className="w-5 h-5 text-app-text" />
          <DialogTitle className="text-app-text">Nova Disciplina</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="studyType" className="text-xs text-app-text-muted">Tipo de Estudo *</Label>
            <Select
              value={form.studyTypeId}
              onValueChange={(value) => setForm(prev => ({ ...prev, studyTypeId: value }))}
            >
              <SelectTrigger className="bg-app-bg border-app-border text-app-text">
                <SelectValue placeholder={isLoadingStudyTypes ? "Carregando..." : "Selecione um tipo de estudo"} />
              </SelectTrigger>
              <SelectContent className="bg-app-panel border-app-border">
                {studyTypes.map((type) => (
                  <SelectItem 
                    key={type.id} 
                    value={type.id}
                    className="text-app-text hover:bg-app-muted focus:bg-app-muted"
                  >
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs text-app-text-muted">Nome *</Label>
            <Input
              id="name"
              placeholder="Ex: Matemática, Português, História..."
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
            disabled={!form.name.trim() || !form.studyTypeId || isLoading}
            className="bg-gradient-to-r from-app-accent to-app-accent-2 text-white hover:opacity-90"
          >
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}