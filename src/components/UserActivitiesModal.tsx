import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import FaIcon from '@/components/ui/fa-icon';
import { X, Timer, CheckCircle, BookOpen, FileText } from 'lucide-react';

interface Activity {
  id: number;
  title: string;
  description: string;
  time: string;
  bg: string;
  iconColor: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const activities: Activity[] = [
  {
    id: 1,
    title: 'Iniciou sessão de foco',
    description: '25 minutos de estudo ininterrupto',
    time: '09:05',
    bg: 'bg-gradient-to-br from-blue-500 to-purple-500',
    iconColor: '#FFFFFF',
    icon: Timer,
  },
  {
    id: 2,
    title: 'Completou exercicios',
    description: '10 questões respondidas ieLicitações',
    time: '09:10',
    bg: 'bg-green-100',
    iconColor: '#16A34A',
    icon: CheckCircle,
  },
  {
    id: 3,
    title: 'Estudando',
    description: 'Administração — Capítulo 3',
    time: '09:20',
    bg: 'bg-orange-100',
    iconColor: '#D97706',
    icon: BookOpen,
  },
  {
    id: 4,
    title: 'Adicionou recurso à Biblioteca',
    description: 'mapas_mentais.pdf',
    time: '08:35',
    bg: 'bg-purple-100',
    iconColor: '#7C3AED',
    icon: FileText,
  },
];

interface UserActivitiesModalProps {
  onClose: () => void;
  userName?: string;
}

const UserActivitiesModal: React.FC<UserActivitiesModalProps> = ({ onClose, userName = 'Amanda Lopes' }) => {
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="w-full max-w-sm bg-white rounded-3xl shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Atividades de {userName}</h2>
        <button onClick={onClose} className="text-gray-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{userName}</span>
          <Badge variant="secondary" className="w-fit px-2 py-0.5">
            Membro
          </Badge>
        </div>
      </div>

      <h3 className="text-sm font-medium text-gray-500 mb-4">Últimas atividades (24h)</h3>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`mr-3 flex h-9 w-9 items-center justify-center rounded-xl ${activity.bg}`}>
                <FaIcon icon={activity.icon} size={18} color={activity.iconColor} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-xs text-gray-500">{activity.description}</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserActivitiesModal;

