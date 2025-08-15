import React, { useState } from 'react';

import avatar from '../../public/placeholder.svg';
import UserActivitiesModal from './UserActivitiesModal';

export interface UserCardInfo {
  name: string;
  avatar?: string;
  role: string;
  stats: {
    aulas: number;
    flashcards: number;
    streak: number;
  };
}

interface UserCardProps {
  user?: UserCardInfo;
  onClose?: () => void;
  onShowActivities?: () => void;
}

// Icon components defined as simple SVGs for consistent look without external dependencies.
const SquareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x={4} y={4} width={16} height={16} rx={3} ry={3} />
  </svg>
);

const CardsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x={2} y={7} width={15} height={15} rx={2} ry={2} />
    <rect x={7} y={2} width={15} height={15} rx={2} ry={2} />
  </svg>
);

const FlameIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2s-5 4-5 9.5c0 5.25 5 9.5 5 9.5s5-4.25 5-9.5C17 6 12 2 12 2z" />
  </svg>
);

const MailIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x={2.5} y={5.5} width={19} height={13} rx={2} ry={2} />
    <polyline points="3.5 6.5 12 13 20.5 6.5" />
  </svg>
);

const PhoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.72 19.72 0 0 1-8.63-3.07 19.49 19.49 0 0 1-6-6A19.72 19.72 0 0 1 3.07 4.18 2 2 0 0 1 5 2h3a2 2 0 0 1 2 1.72c.12.84.45 1.66.93 2.36a2.49 2.49 0 0 1-.45 3.16L8.21 10.21a16 16 0 0 0 4 4l1.27-1.27a2.49 2.49 0 0 1 3.16-.45c.7.48 1.52.81 2.36.93a2 2 0 0 1 1.72 2z" />
  </svg>
);

const StarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polygon points="12 2 15.3 8.3 22 9.3 17 14 18.2 20.7 12 17.3 5.8 20.7 7 14 2 9.3 8.7 8.3 12 2" />
  </svg>
);

const LinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M10.94 13.06a3 3 0 0 1 0-4.24l2.12-2.12a3 3 0 0 1 4.24 0l2.12 2.12a3 3 0 0 1 0 4.24l-2.12 2.12a3 3 0 0 1-4.24 0l-2.12-2.12z" />
    <path d="M13.06 10.94a3 3 0 0 1 0 4.24l-2.12 2.12a3 3 0 0 1-4.24 0l-2.12-2.12a3 3 0 0 1 0-4.24l2.12-2.12a3 3 0 0 1 4.24 0l2.12 2.12z" />
  </svg>
);

const MoreIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
    <circle cx={5} cy={12} r={2} />
    <circle cx={12} cy={12} r={2} />
    <circle cx={19} cy={12} r={2} />
  </svg>
);

const ArrowRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function UserCard({ user, onClose, onShowActivities }: UserCardProps) {
  const [showActivities, setShowActivities] = useState(false);

  const handleActivityClick = () => {
    if (onShowActivities) {
      onShowActivities();
    } else {
      setShowActivities(true);
    }
  };

  const name = user?.name ?? 'Aline Rocha';
  const role = user?.role ?? 'Participante';
  const stats = user?.stats ?? { aulas: 5, flashcards: 120, streak: 7 };

  if (showActivities) {
    return (
      <UserActivitiesModal
        onClose={onClose ?? (() => setShowActivities(false))}
        userName={name}
      />
    );
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-3xl shadow-md p-6">
      {/* Avatar with gradient ring */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div className="rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 p-1">
            <div className="bg-white rounded-full p-1">
              <img src={avatar} alt={name} className="rounded-full w-28 h-28 object-cover" />
            </div>
          </div>
        </div>
      </div>

      {/* Name and role */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
        <p className="text-gray-500 text-sm">{role}</p>
      </div>

      {/* Stats row */}
      <div className="flex justify-center gap-6 mb-4 text-sm text-gray-700">
        {/* Aulas */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
            <SquareIcon className="w-4 h-4 text-gray-600" />
          </div>
          <span className="font-medium text-gray-600">
            Aulas: <span className="text-gray-900">{stats.aulas}</span>
          </span>
        </div>
        {/* Flashcards */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
            <CardsIcon className="w-4 h-4 text-gray-600" />
          </div>
          <span className="font-medium text-gray-600">
            Flashcards: <span className="text-gray-900">{stats.flashcards}</span>
          </span>
        </div>
        {/* Streak */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
            <FlameIcon className="w-4 h-4 text-gray-600" />
          </div>
          <span className="font-medium text-gray-600">
            Streak: <span className="text-gray-900">{stats.streak}d</span>
          </span>
        </div>
      </div>

      {/* Primary action buttons */}
      <div className="flex gap-4 mb-4">
        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 text-white font-medium shadow">
          <MailIcon className="w-5 h-5 text-white" />
          <span>Mensagem</span>
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-cyan-500 text-cyan-600 font-medium shadow"
          onClick={handleActivityClick}
        >
          <PhoneIcon className="w-5 h-5 text-cyan-600" />
          <span>Atividade</span>
        </button>
      </div>

      {/* Secondary action buttons */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-sm text-gray-600">
        <button className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-gray-50 border border-gray-200 shadow-sm">
          <StarIcon className="w-5 h-5 text-gray-600" />
          <span className="text-center leading-tight">
            Promover<span className="block text-xs">(Moderador)</span>
          </span>
        </button>
        <button className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-gray-50 border border-gray-200 shadow-sm">
          <LinkIcon className="w-5 h-5 text-gray-600" />
          <span>Link</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-gray-50 border border-gray-200 shadow-sm">
          <MoreIcon className="w-5 h-5 text-gray-600" />
          <span>Mais</span>
        </button>
      </div>

      {/* Activity feed */}
      <div className="mb-3">
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="p-2 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
            <CardsIcon className="w-4 h-4 text-gray-600" />
          </div>
          <span className="flex-1 text-sm text-gray-700 font-medium">
            Adicionou flashcards <span className="text-gray-500">• 20m</span>
          </span>
          <ArrowRightIcon className="w-5 h-5 text-gray-400" />
        </div>
        {/* Second activity item */}
        <div className="flex items-center gap-3 pt-3">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img src={avatar} alt={name} className="w-8 h-8 object-cover" />
          </div>
          <span className="text-sm text-gray-700 font-medium">Adicionou flashcards</span>
        </div>
      </div>
    </div>
  );
}

