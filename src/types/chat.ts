export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  isRead?: boolean; // Legacy property for compatibility
  type: 'text' | 'image' | 'file';
}

export interface ChatConversation {
  id: string;
  friendId: string;
  friendName: string;
  friendNickname: string;
  friendAvatarUrl: string | null;
  friendStatus: 'online' | 'offline' | 'busy';
  messages: ChatMessage[];
  unreadCount: number;
  isMinimized: boolean;
  isMuted?: boolean;
  lastActivity: Date;
}

export interface ChatState {
  conversations: Record<string, ChatConversation>;
  activeChats: string[];
  currentUserId: string | null;
}