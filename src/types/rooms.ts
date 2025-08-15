export interface StudyRoom {
  id: string;
  created_by: string;
  name: string;
  capacity: number;
  visibility: 'privada' | 'publica_amigos';
  created_at: string;
  deleted_at: string | null;
}

export interface StudyRoomEvent {
  id: number;
  room_id: string;
  event_id: string;
  type: string;
  payload: unknown;
  created_at: string;
}

export interface Invite {
  sender_id: string;
  receiver_id: string;
  recusas_seq: number;
  blocked_until: string | null;
}

export interface EntryRequest {
  id: string;
  room_id: string;
  requester_id: string;
  status: 'pendente' | 'aprovada' | 'recusada';
  created_at: string;
  responded_at: string | null;
}

export interface RoomTimer {
  room_id: string;
  user_id: string;
  state: 'idle' | 'running' | 'paused';
  started_at: string | null;
  accumulated_ms: number;
  updated_at: string;
  event_id: string;
}
