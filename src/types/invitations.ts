export interface StudyInvitation {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  expires_at?: string | null;
  room_id: string | null;
  sender_profile?: {
    nickname: string | null;
    avatar_url: string | null;
  };
}
