// @ts-nocheck
import { Mic, Paperclip, Send, Pencil } from 'lucide-react'
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import RoomChat from '@/components/RoomChat';
import StudyRoomParticipants from '@/components/StudyRoomParticipants';
import StudyRoomActivityFeed from '@/components/StudyRoomActivityFeed';
import { EditStudyRoomModal } from '@/components/EditStudyRoomModal';
import './StudyRoom.css';

const StudyRoom: React.FC = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [room, setRoom] = useState<any | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [timers, setTimers] = useState<Record<string, any>>({});
  const [newMessage, setNewMessage] = useState('');
  const [roomLoaded, setRoomLoaded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const currentUserRole = useMemo(() => {
    if (!user || !participants) return null;
    const participant = participants.find(p => p.user_id === user.id);
    return participant?.role;
  }, [user, participants]);

  useEffect(() => {
    document.title = room ? room.name : `Sala de Estudo ${roomId}`;
  }, [room, roomId]);

  useEffect(() => {
    let active = true;
    const loadRoom = async () => {
      if (!roomId) return;
      const { data, error } = await supabase
        .from('study_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) {
        console.error("Error loading room, it might be private or not exist.", error);
        toast({ title: "Erro", description: "Sala não encontrada ou acesso negado.", variant: "destructive" });
        navigate('/');
        return;
      }

      if (active) {
        setRoom(data);
        setRoomLoaded(true);
      }
    };
    loadRoom();
    return () => { active = false; };
  }, [roomId, navigate, toast]);

  useEffect(() => {
    let isMounted = true;
    const loadParticipants = async () => {
      if (!roomId) return;
      const { data, error } = await supabase
        .from('study_room_participants')
        .select('*, profile:user_id(nickname, avatar_url)')
        .eq('room_id', roomId)
        .eq('is_active', true);

      if (!isMounted) return;
      if (error) {
        console.error("Error loading participants", error);
        return;
      }

      setParticipants(data || []);
      if (roomLoaded && user) {
        const isParticipant = data.some(p => p.user_id === user.id);
        if (!isParticipant && room?.type === 'private') {
          toast({ title: "Acesso Negado", description: "Esta é uma sala privada.", variant: "destructive" });
          navigate('/');
        }
      }
    };
    loadParticipants();

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_room_participants', filter: `room_id=eq.${roomId}` },
        () => loadParticipants()
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [roomId, roomLoaded, user, navigate, room?.type, toast]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    const content = newMessage.trim();
    setNewMessage('');
    await supabase.from('study_room_events').insert({
      room_id: roomId,
      event_id: crypto.randomUUID(),
      type: 'chat',
      payload: { message: content, user_id: user.id },
    });
  };

  const handleLeave = async () => {
    if (!roomId) return;
    await supabase.rpc('leave_study_room', { p_room_id: roomId });
    navigate('/');
  };

  const handleRoomUpdate = (updatedRoom: any) => {
    setRoom(updatedRoom);
  };

  return (
    <>
      <div className="app-bg">
        <div className="layout">
          <aside className="col left">
            <StudyRoomParticipants
              participants={participants}
              currentUserRole={currentUserRole}
              roomId={roomId}
            />
          </aside>

          <main className="col center">
            <header className="chat-header">
              <div className="flex items-center gap-2">
                <h1 className="room-name">{room?.name}</h1>
                {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                  <button onClick={() => setShowEditModal(true)} className="p-1 hover:bg-gray-200 rounded-full" aria-label="Editar sala">
                    <Pencil className="w-4 h-4 text-gray-600" />
                  </button>
                )}
              </div>
              <div className="header-actions">
                <button onClick={handleLeave} className="btn btn-danger" type="button" aria-label="Sair da sala">
                  Sair
                </button>
              </div>
            </header>

            <section className="chat scroll">
              <div className="msgs">
                {roomId && <RoomChat roomId={roomId} user={user} />}
              </div>
            </section>

            <form className="composer" onSubmit={handleSendMessage}>
              <div className="composer-bar">
                <button className="btn-ghost" type="button" aria-label="Anexar arquivo">
                  <Paperclip className="icon" />
                </button>
                <input
                  type="text"
                  placeholder="Escreva sua mensagem…"
                  aria-label="Escrever mensagem"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button className="btn-ghost" type="button" aria-label="Gravar áudio">
                  <Mic className="icon" />
                </button>
                <button className="send" type="submit" aria-label="Enviar" disabled={!newMessage.trim()}>
                  <Send className="icon" style={{ color: 'white' }} />
                </button>
              </div>
            </form>
          </main>

          <aside className="col right">
            <StudyRoomActivityFeed roomId={roomId} />
          </aside>
        </div>
      </div>

      <EditStudyRoomModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        room={room}
        onRoomUpdate={handleRoomUpdate}
      />
    </>
  )
}

export default StudyRoom;
