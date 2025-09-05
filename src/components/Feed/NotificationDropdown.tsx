import { useState, useEffect, useRef } from 'react';
import { X, Bell, Check, Trash2, Users, Calendar, Trophy, Target, Flame, List } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification, useAcceptRoomInvite, useRejectRoomInvite } from '@/hooks/useNotifications';
import { getNotificationsByFilter, type MockNotification } from '@/lib/notification-seeds';
import './NotificationStyles.css';

interface NotificationDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'room_invite':
      return <Users className="w-4 h-4" />;
    case 'connection_request':
      return <Users className="w-4 h-4" />;
    case 'connection_accepted':
      return <Check className="w-4 h-4" />;
    case 'event_reminder':
      return <Calendar className="w-4 h-4" />;
    case 'achievement':
      return <Trophy className="w-4 h-4" />;
    case 'study_streak':
      return <Flame className="w-4 h-4" />;
    case 'daily_goal':
      return <Target className="w-4 h-4" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};


const formatTimeAgo = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: ptBR 
    });
  } catch (error) {
    return 'há alguns momentos';
  }
};

export function NotificationDropdown({ isOpen, onToggle }: NotificationDropdownProps) {
  const [filter] = useState<'all' | 'social' | 'rooms' | 'agenda'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Use mock data for now - in the future this will be replaced with real API data
  const notifications = getNotificationsByFilter(filter) as MockNotification[];
  const isLoading = false;
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const acceptInviteMutation = useAcceptRoomInvite();
  const rejectInviteMutation = useRejectRoomInvite();

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        if (isOpen) {
          onToggle();
        }
      }
    }

    // Handle escape key
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        onToggle();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onToggle]);

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleAcceptInvite = (notification: MockNotification) => {
    if (notification.relatedId) {
      // relatedId now contains the invitation ID
      acceptInviteMutation.mutate(notification.relatedId);
    }
  };

  const handleRejectInvite = (notification: MockNotification) => {
    if (notification.relatedId) {
      // relatedId now contains the invitation ID
      rejectInviteMutation.mutate(notification.relatedId);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const unreadCount = unreadNotifications.length;

  const getAvatarFallback = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  };

  const renderNotificationContent = (notification: MockNotification) => {
    const isUnread = !notification.read;
    
    return (
      <div key={notification.id} className={`notif-item ${isUnread ? 'notif-unread' : ''}`}>
        {notification.sender ? (
          <div className="notif-avatar">
            {getAvatarFallback(notification.sender.name)}
          </div>
        ) : (
          <div className="notif-icon">
            {getNotificationIcon(notification.type)}
          </div>
        )}
        <div>
          <div className="notif-title-row">
            <div className="notif-title">{notification.title}</div>
            <div className="notif-meta">{formatTimeAgo(notification.createdAt)}</div>
          </div>
          <div className="notif-msg">{notification.message}</div>
          <div className="notif-actions">
            {isUnread && (
              <button 
                className="notif-btn notif-btn-xs" 
                onClick={() => handleMarkAsRead(notification.id)}
                disabled={markAsReadMutation.isPending}
              >
                Marcar como lida
              </button>
            )}
            {notification.type === 'room_invite' && isUnread && (
              <>
                <button 
                  className="notif-btn notif-btn-primary notif-btn-xs" 
                  onClick={() => handleAcceptInvite(notification)}
                  disabled={acceptInviteMutation.isPending || rejectInviteMutation.isPending}
                >
                  <Check className="w-3 h-3" /> Aceitar
                </button>
                <button 
                  className="notif-btn notif-btn-xs" 
                  onClick={() => handleRejectInvite(notification)}
                  disabled={acceptInviteMutation.isPending || rejectInviteMutation.isPending}
                >
                  <X className="w-3 h-3" /> Rejeitar
                </button>
              </>
            )}
            {notification.type === 'connection_request' && isUnread && (
              <>
                <button 
                  className="notif-btn notif-btn-primary notif-btn-xs" 
                  onClick={() => handleAcceptInvite(notification)}
                  disabled={acceptInviteMutation.isPending || rejectInviteMutation.isPending}
                >
                  <Check className="w-3 h-3" /> Aceitar
                </button>
                <button 
                  className="notif-btn notif-btn-xs" 
                  onClick={() => handleRejectInvite(notification)}
                  disabled={acceptInviteMutation.isPending || rejectInviteMutation.isPending}
                >
                  <X className="w-3 h-3" /> Rejeitar
                </button>
              </>
            )}
            {(notification.type === 'event_reminder' || notification.type === 'achievement' || notification.type === 'study_streak' || notification.type === 'daily_goal') && isUnread && (
              <>
                <button 
                  className="notif-btn notif-btn-xs" 
                  onClick={() => handleMarkAsRead(notification.id)}
                  disabled={markAsReadMutation.isPending}
                >
                  Marcar como lida
                </button>
                <button 
                  className="notif-btn notif-btn-primary notif-btn-xs" 
                  onClick={() => handleMarkAsRead(notification.id)}
                  disabled={markAsReadMutation.isPending}
                >
                  <Check className="w-3 h-3" /> Aceitar
                </button>
                <button 
                  className="notif-btn notif-btn-xs" 
                  onClick={() => handleDeleteNotification(notification.id)}
                  disabled={deleteNotificationMutation.isPending}
                >
                  <X className="w-3 h-3" /> Rejeitar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="notification-container">
      {/* Bell icon integrado no header */}
      <div className="bell-wrap notif-dropdown">
        <button 
          ref={buttonRef}
          className="notif-btn notif-btn-icon relative" 
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          title="Notificações" 
          aria-haspopup="true" 
          aria-expanded={isOpen} 
          aria-controls="notifMenu"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="notif-badge">{unreadCount}</span>
          )}
        </button>

        {isOpen && (
          <div 
            ref={dropdownRef}
            className={`notif-menu ${isOpen ? 'open' : ''}`} 
            role="dialog" 
            aria-label="Notificações" 
            aria-modal="false"
          >
            <div className="notif-menu-header">
              <Bell className="w-5 h-5" />
              <div className="title">Notificações</div>
              <div className="grow"></div>
              {unreadCount > 0 && (
                <button 
                  className="notif-btn notif-btn-xs" 
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation?.isPending}
                >
                  <Check className="w-3 h-3" /> Marcar todas lidas
                </button>
              )}
            </div>

            <div className="notif-menu-body">
              {isLoading ? (
                <div className="notif-loading">
                  <div className="notif-loading-spinner"></div>
                  Carregando notificações...
                </div>
              ) : notifications.length === 0 ? (
                <div className="notif-empty">
                  <Bell className="notif-empty-icon" />
                  <p className="notif-empty-title">Nenhuma notificação</p>
                  <p className="notif-empty-desc">Você está em dia!</p>
                </div>
              ) : (
                <>
                  {notifications.map(renderNotificationContent)}
                </>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="notif-menu-footer">
                <button 
                  className="notif-btn notif-btn-xs" 
                  onClick={() => {
                    // Future: Navigate to dedicated notifications page
                    console.log('Ver todas');
                  }}
                >
                  <List className="w-3 h-3" /> Ver todas
                </button>
                <div className="grow"></div>
                <button 
                  className="notif-btn notif-btn-primary notif-btn-xs" 
                  onClick={() => {
                    // Clear read notifications
                    const readNotifications = notifications.filter(n => n.read);
                    readNotifications.forEach(n => handleDeleteNotification(n.id));
                  }}
                  disabled={deleteNotificationMutation.isPending}
                >
                  <Trash2 className="w-3 h-3" /> Limpar lidas
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}