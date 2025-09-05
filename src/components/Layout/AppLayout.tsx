import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FeedHeader } from '@/components/Feed/FeedHeader';
import { FriendsPanel } from '@/components/Feed/FriendsPanel';
import { useState, useEffect } from 'react';
import { useConnectionRequests } from '@/hooks/useConnections';

interface AppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export function AppLayout({ children, showHeader = true }: AppLayoutProps) {
  const { user } = useAuth();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [friendsPanelOpen, setFriendsPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Dynamic counts from API
  const { data: connectionRequests = [] } = useConnectionRequests();
  
  const friendRequestsCount = connectionRequests.filter(req => req.status === 'pending').length;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleToggleSidebar = (side: 'left' | 'right') => {
    if (side === 'left') {
      setLeftSidebarOpen(!leftSidebarOpen);
    } else {
      setRightSidebarOpen(!rightSidebarOpen);
    }
  };

  const handleAddFriend = async (userId: string) => {
    try {
      console.log('Adding friend:', userId);
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg">
      {user && showHeader && (
        <FeedHeader
          onToggleFriends={() => setFriendsPanelOpen(!friendsPanelOpen)}
          onToggleSidebar={handleToggleSidebar}
          friendRequestsCount={friendRequestsCount}
          isMobile={isMobile}
          onAddFriend={handleAddFriend}
        />
      )}
      
      <main className={user && showHeader ? "pt-0" : ""}>
        {children}
      </main>
      
      {user && (
        <>
          <FriendsPanel
            isOpen={friendsPanelOpen}
            onClose={() => setFriendsPanelOpen(false)}
          />
          
        </>
      )}
    </div>
  );
}