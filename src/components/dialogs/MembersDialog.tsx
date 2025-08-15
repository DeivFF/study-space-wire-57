import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown } from 'lucide-react';

interface Member {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  profiles?: {
    nickname: string | null;
    avatar_url: string | null;
  };
}

interface MembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
}

export const MembersDialog: React.FC<MembersDialogProps> = ({ open, onOpenChange, members }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Membros da Trilha</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4 max-h-[50vh] overflow-y-auto">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.profiles?.avatar_url || ''} />
                  <AvatarFallback>
                    {member.profiles?.nickname?.slice(0, 2).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <span>{member.profiles?.nickname || `User #${member.user_id.slice(0,8)}`}</span>
              </div>
              {member.role === 'admin' && (
                <Crown className="w-5 h-5 text-yellow-500" />
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
