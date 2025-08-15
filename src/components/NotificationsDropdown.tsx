import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell, Check, X, UserPlus, BookOpen, Share2 } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { UnifiedNotification } from '@/hooks/useAppState';

const NotificationIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'friend_request':
            return <UserPlus className="w-4 h-4 text-blue-500" />;
        case 'trail_invitation':
            return <BookOpen className="w-4 h-4 text-purple-500" />;
        case 'content_share_request':
            return <Share2 className="w-4 h-4 text-green-500" />;
        default:
            return <Bell className="w-4 h-4 text-gray-500" />;
    }
};

export const NotificationsDropdown = () => {
  const { state } = useAppContext();
  const { notifications, trailsLoading: loading } = state;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <DropdownMenuItem disabled>Carregando...</DropdownMenuItem>
        ) : notifications.length === 0 ? (
          <DropdownMenuItem disabled>Nenhuma notificação nova</DropdownMenuItem>
        ) : (
          notifications.map((notification: UnifiedNotification) => (
            <div key={notification.id} className="px-2 py-2 text-sm border-b last:border-b-0">
              <div className="flex items-start space-x-3">
                <NotificationIcon type={notification.type} />
                <div className="flex-1 space-y-1">
                    <p className="text-sm text-muted-foreground">
                        <span className="font-bold text-primary">{notification.senderName}</span>
                        {notification.message}
                        {notification.contextName && <span className="font-bold text-primary">{notification.contextName}</span>}
                    </p>
                    <div className="flex gap-2 pt-1">
                        <Button
                        size="sm"
                        className="w-full h-8 bg-green-600 hover:bg-green-700"
                        onClick={notification.onAccept}
                        >
                        <Check className="w-4 h-4 mr-2" />
                        Aceitar
                        </Button>
                        <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-8"
                        onClick={notification.onReject}
                        >
                        <X className="w-4 h-4 mr-2" />
                        Recusar
                        </Button>
                    </div>
                </div>
              </div>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
