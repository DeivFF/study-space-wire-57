import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, Crown, Trash2, LogOut, MoreVertical, UserPlus, Settings } from 'lucide-react';

export interface Trail {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  admin_id: string;
}

interface TrailCardProps {
  trail: Trail;
  isTrailAdmin: boolean;
  onViewMembers: (trailId: string) => void;
  onInvite: (trailId: string) => void;
  onDelete: (trailId: string) => void;
  onLeave: (trailId: string) => void;
}

export const TrailCard: React.FC<TrailCardProps> = ({
  trail,
  isTrailAdmin,
  onViewMembers,
  onInvite,
  onDelete,
  onLeave,
}) => {
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <Link to={`/trilhas/${trail.id}`} className="flex flex-col no-underline text-current hover:bg-gray-50 rounded-lg transition-colors">
      <Card key={trail.id} className="flex flex-col flex-grow w-full h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="flex items-center gap-2">
              {trail.name}
              {isTrailAdmin && (
                <Crown className="w-4 h-4 text-yellow-500" />
              )}
            </CardTitle>
            <Badge variant={trail.is_private ? 'secondary' : 'default'}>
              {trail.is_private ? 'Privada' : 'Pública'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow">
          <div className="flex-grow">
              {trail.description && (
              <p className="text-sm text-muted-foreground mb-3 h-10 overflow-hidden">
                  {trail.description}
              </p>
              )}
          </div>
          <div className="flex items-center justify-between mt-4" onClick={handleActionClick}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewMembers(trail.id)}
            >
              <Users className="w-4 h-4 mr-1" />
              Ver Membros
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isTrailAdmin ? (
                  <>
                    <DropdownMenuItem onClick={() => onInvite(trail.id)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      <span>Convidar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-500 focus:text-red-500"
                      onClick={() => onDelete(trail.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Excluir Trilha</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    className="text-red-500 focus:text-red-500"
                    onClick={() => onLeave(trail.id)}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair da Trilha</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
