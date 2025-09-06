export interface MockNotification {
  id: string;
  type: 'room_invite' | 'connection_request' | 'connection_accepted' | 'event_reminder' | 'achievement' | 'study_streak' | 'daily_goal';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
  sender?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

const mockUsers = [
  { id: '1', name: 'Ana Silva', avatarUrl: 'a1' },
  { id: '2', name: 'Carlos Santos', avatarUrl: 'a2' },
  { id: '3', name: 'Maria Oliveira', avatarUrl: 'a3' },
  { id: '4', name: 'João Costa', avatarUrl: 'a4' },
  { id: '5', name: 'System', avatarUrl: undefined },
];

export const mockNotificationSeeds: MockNotification[] = [
  // Room invites
  {
    id: 'n1',
    type: 'room_invite',
    title: 'Convite para sala de estudo',
    message: 'Ana Silva convidou você para a sala "Matemática ENEM 2024"',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    relatedId: 'room_1',
    sender: mockUsers[0],
  },
  {
    id: 'n2',
    type: 'room_invite',
    title: 'Convite para sala de estudo',
    message: 'Carlos Santos convidou você para a sala "Física - Mecânica"',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    relatedId: 'room_2',
    sender: mockUsers[1],
  },
  
  // Event reminders
  {
    id: 'n5',
    type: 'event_reminder',
    title: 'Lembrete: Prova de História',
    message: 'Sua prova de História está marcada para amanhã às 14:00',
    read: false,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    relatedId: 'event_1',
  },
  
  // Achievements
  {
    id: 'n6',
    type: 'achievement',
    title: '🏆 Nova conquista desbloqueada!',
    message: 'Parabéns! Você alcançou uma sequência de 7 dias estudando.',
    read: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    relatedId: 'achievement_streak_7',
    sender: mockUsers[4], // System
  },
  
  // Study streak
  {
    id: 'n7',
    type: 'study_streak',
    title: '🔥 Sequência mantida!',
    message: 'Excelente! Você está há 3 dias consecutivos estudando.',
    read: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    relatedId: 'streak_3',
    sender: mockUsers[4], // System
  },
  
  // Daily goal
  {
    id: 'n8',
    type: 'daily_goal',
    title: '🎯 Meta diária alcançada!',
    message: 'Parabéns! Você completou sua meta de 50 XP hoje.',
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    relatedId: 'daily_goal_completed',
    sender: mockUsers[4], // System
  },
  
  {
    id: 'n10',
    type: 'event_reminder',
    title: 'Revisão de Química',
    message: 'Não esqueça da sessão de revisão de Química hoje às 20:00',
    read: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    relatedId: 'event_2',
  },
];

// Helper functions for notification management
export const getNotificationsByFilter = (filter: 'all' | 'social' | 'rooms' | 'agenda'): MockNotification[] => {
  switch (filter) {
    case 'social':
      return mockNotificationSeeds.filter(n => 
        ['connection_request', 'connection_accepted'].includes(n.type)
      );
    case 'rooms':
      return mockNotificationSeeds.filter(n => n.type === 'room_invite');
    case 'agenda':
      return mockNotificationSeeds.filter(n => n.type === 'event_reminder');
    default:
      return mockNotificationSeeds;
  }
};

export const getUnreadNotificationsCount = (): number => {
  return mockNotificationSeeds.filter(n => !n.read).length;
};

export const addSystemNotification = (type: MockNotification['type'], title: string, message: string): MockNotification => {
  const newNotification: MockNotification = {
    id: `n_${Date.now()}`,
    type,
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
    sender: mockUsers[4], // System user
  };
  
  mockNotificationSeeds.unshift(newNotification);
  return newNotification;
};