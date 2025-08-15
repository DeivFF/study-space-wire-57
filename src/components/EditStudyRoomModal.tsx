import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '@/hooks/use-toast';

interface EditStudyRoomModalProps {
  room: any;
  isOpen: boolean;
  onClose: () => void;
  onRoomUpdate: (updatedRoom: any) => void;
}

export const EditStudyRoomModal = ({ room, isOpen, onClose, onRoomUpdate }: EditStudyRoomModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [capacity, setCapacity] = useState(8);
  const [type, setType] = useState<'public' | 'private'>('private');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (room) {
      setName(room.name || '');
      setDescription(room.description || '');
      setTopic(room.topic || '');
      setCapacity(room.capacity || 8);
      setType(room.type || 'private');
    }
  }, [room]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Erro", description: "O nome da sala é obrigatório.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('update_study_room', {
        p_room_id: room.id,
        p_name: name,
        p_description: description,
        p_topic: topic,
        p_capacity: capacity,
        p_type: type,
      });

      if (error) throw error;

      const updatedRoom = { ...room, name, description, topic, capacity, type };
      onRoomUpdate(updatedRoom);
      toast({ title: "Sucesso!", description: "Sala atualizada com sucesso." });
      onClose();
    } catch (error: any) {
      console.error('Error updating room:', error);
      toast({ title: "Erro ao atualizar sala", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Sala de Estudos</DialogTitle>
          <DialogDescription>
            Atualize os detalhes da sua sala de estudos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">Nome da Sala</label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">Descrição</label>
            <Input id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label htmlFor="edit-topic" className="block text-sm font-medium text-gray-700">Tópico/Matéria</label>
            <Input id="edit-topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div>
            <label htmlFor="edit-capacity" className="block text-sm font-medium text-gray-700">Capacidade</label>
            <Input id="edit-capacity" type="number" value={capacity} onChange={(e) => setCapacity(parseInt(e.target.value, 10))} min="2" max="50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Sala</label>
            <Select onValueChange={(value) => setType(value as 'public' | 'private')} value={type}>
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
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
