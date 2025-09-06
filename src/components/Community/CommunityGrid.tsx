import { Users, MessageCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CommunityGridProps {
  onViewCommunity: () => void;
}

const communities = [
  {
    id: 1,
    name: 'Administração Pública',
    slug: '/comunidades/admin-publica',
    avatar: 'AP',
    description: 'Comunidade para discussão de concursos públicos na área de administração...',
    tags: ['#FGV', '#Administração'],
    members: '12.8k',
    online: '345',
    isPrivate: false,
    memberStatus: 'not-member'
  },
  {
    id: 2,
    name: 'Direito Constitucional',
    slug: '/comunidades/direito-const',
    avatar: 'DC',
    description: 'Estudos para OAB e concursos públicos na área do Direito Constitucional...',
    tags: ['#OAB', '#Direito'],
    members: '8.4k',
    online: '210',
    isPrivate: false,
    memberStatus: 'not-member'
  },
  {
    id: 3,
    name: 'TI & Redes',
    slug: '/comunidades/ti-redes',
    avatar: 'TI',
    description: 'Comunidade exclusiva para profissionais de TI e redes de computadores...',
    tags: ['#TI', '#Redes'],
    members: '580',
    online: '24',
    isPrivate: true,
    memberStatus: 'not-member'
  },
  {
    id: 4,
    name: 'Matemática ENEM',
    slug: '/comunidades/matematica-enem',
    avatar: 'ME',
    description: 'Preparação para o ENEM com foco em matemática e suas tecnologias...',
    tags: ['#ENEM', '#Matemática'],
    members: '5.2k',
    online: '189',
    isPrivate: false,
    memberStatus: 'not-member'
  }
];

export function CommunityGrid({ onViewCommunity }: CommunityGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {communities.map((community) => (
        <div key={community.id} className="bg-app-panel border border-app-border rounded-2xl p-4 space-y-3">
          {/* Header */}
          <div className="flex gap-3 items-start">
            <div className="w-15 h-15 rounded-full bg-gradient-to-br from-app-accent to-app-accent-2 text-white font-bold text-xl flex items-center justify-center">
              {community.avatar}
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-app-text">{community.name}</h3>
              <p className="text-sm text-app-text-muted">{community.slug}</p>
              {community.isPrivate && (
                <Badge variant="secondary" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Privada
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-app-text-muted line-clamp-2">
            {community.description}
          </p>

          {/* Tags */}
          <div className="flex gap-1 flex-wrap">
            {community.tags.map((tag, index) => (
              <span key={index} className="text-xs bg-app-muted px-2 py-1 rounded-full text-app-text border border-app-border">
                {tag}
              </span>
            ))}
          </div>

          {/* Metrics */}
          <div className="flex gap-4 text-xs text-app-text-muted">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {community.members} membros
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {community.online} online
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-gradient-to-r from-app-accent to-app-accent-2" 
              size="sm"
            >
              {community.isPrivate ? 'Solicitar entrada' : 'Entrar'}
            </Button>
            <Button variant="outline" size="sm" onClick={onViewCommunity}>
              Ver
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}