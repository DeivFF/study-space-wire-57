import { useState } from 'react';
import { Bell, X, Settings } from 'lucide-react';
import { NotificationDropdown } from '@/components/Feed/NotificationDropdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotificationsCount } from '@/hooks/useNotifications';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface NotificationCenterProps {
  variant?: 'button' | 'icon';
  showBadge?: boolean;
}

export function NotificationCenter({ variant = 'icon', showBadge = true }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: unreadCount = 0 } = useNotificationsCount();

  const triggerContent = variant === 'button' ? (
    <Button variant="ghost" size="sm" className="relative hover:bg-muted">
      <Bell className="w-5 h-5" />
      <span className="ml-2 hidden sm:inline">Notificações</span>
      {showBadge && unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 px-1.5 py-0 text-xs min-w-[18px] h-[18px] flex items-center justify-center"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  ) : (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="relative hover:bg-muted">
            <Bell className="w-5 h-5" />
            {showBadge && unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 px-1.5 py-0 text-xs min-w-[18px] h-[18px] flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {unreadCount > 0 
              ? `${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}`
              : 'Nenhuma notificação'
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {triggerContent}
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 bg-app-bg-soft border-app-border" 
        align="end"
        sideOffset={8}
      >
        <NotificationDropdown isOpen={isOpen} onToggle={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}