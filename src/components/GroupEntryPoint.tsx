import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '@/hooks/use-toast';

interface GroupEntryPointProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StudyRoom {
  id: string;
  name: string;
}

const CreateStudyRoomForm = ({ onClose }: { onClose: () => void }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [capacity, setCapacity] = useState(8);
  const [type, setType] = useState<'public' | 'private'>('private');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Erro", description: "O nome da sala é obrigatório.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('create_study_room', {
        p_name: name,
        p_description: description,
        p_topic: topic,
        p_capacity: capacity,
        p_type: type,
      });

      if (error) throw error;

      const roomId = data;
      toast({ title: "Sucesso!", description: "Sala criada com sucesso." });
      navigate(`/sala-de-estudos/${roomId}`);
      onClose();
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast({ title: "Erro ao criar sala", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Sala de Estudos</DialogTitle>
          <DialogDescription>
            Preencha os detalhes abaixo para criar sua nova sala.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome da Sala</label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700">Tópico/Matéria</label>
            <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacidade</label>
            <Input id="capacity" type="number" value={capacity} onChange={(e) => setCapacity(parseInt(e.target.value, 10))} min="2" max="50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Sala</label>
            <Select onValueChange={(value) => setType(value as 'public' | 'private')} defaultValue={type}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de sala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Privada (apenas por convite)</SelectItem>
                <SelectItem value="public">Pública (qualquer um pode entrar)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Sala'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};


export const GroupEntryPoint = ({ isOpen, onClose }: GroupEntryPointProps) => {
  if (!isOpen) return null;

  return <CreateStudyRoomForm onClose={onClose} />;
};
