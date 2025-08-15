import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface PublicRoom {
  id: string;
  name: string;
  description: string;
  topic: string;
  capacity: number;
  participant_count: number;
}

const PublicRooms: React.FC = () => {
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPublicRooms = async () => {
      setLoading(true);
      try {
        // We can create a view or a function for this later to be more efficient
        const { data, error } = await supabase
          .from('study_rooms')
          .select(`
            id,
            name,
            description,
            topic,
            capacity,
            participant_count:study_room_participants(count)
          `)
          .eq('type', 'public');

        if (error) throw error;

        setRooms(data || []);
      } catch (error: any) {
        toast({ title: 'Erro ao carregar salas', description: error.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchPublicRooms();
  }, [toast]);

  const handleJoinRoom = async (roomId: string) => {
    try {
      const { error } = await supabase.rpc('join_public_room', { p_room_id: roomId });
      if (error) throw error;
      toast({ title: 'Você entrou na sala!', description: 'Você será redirecionado em breve.' });
      navigate(`/sala-de-estudos/${roomId}`);
    } catch (error: any) {
      toast({ title: 'Erro ao entrar na sala', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Salas de Estudo Públicas</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Salas de Estudo Públicas</CardTitle>
          <CardDescription>Encontre um grupo e comece a estudar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.length === 0 && <p>Nenhuma sala pública encontrada no momento.</p>}
          {rooms.map(room => (
            <Card key={room.id}>
              <CardHeader>
                <CardTitle>{room.name}</CardTitle>
                {room.topic && <Badge variant="secondary">{room.topic}</Badge>}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{room.description || 'Sem descrição.'}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{room.participant_count[0].count} / {room.capacity}</span>
                  </div>
                  <Button onClick={() => handleJoinRoom(room.id)} disabled={room.participant_count[0].count >= room.capacity}>
                    {room.participant_count[0].count >= room.capacity ? 'Lotada' : 'Entrar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicRooms;
