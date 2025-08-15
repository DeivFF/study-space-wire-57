export type Role = 'owner' | 'admin' | 'member';

export interface Participant {
  user_id: string;
  role: Role;
}

export function canJoinRoom(current: number, capacity: number): boolean {
  return current < capacity;
}

export function canManageParticipant(manager: Participant, target: Participant): { canPromote: boolean, canRemove: boolean } {
  if (!manager) {
    return { canPromote: false, canRemove: false };
  }

  const isOwner = manager.role === 'owner';
  const isAdmin = manager.role === 'admin';

  if (isOwner && target.role !== 'owner') {
    return {
      canPromote: target.role === 'member',
      canRemove: true,
    };
  }

  if (isAdmin && target.role === 'member') {
    return {
      canPromote: false, // Only owners can promote
      canRemove: true,
    };
  }

  return { canPromote: false, canRemove: false };
}
