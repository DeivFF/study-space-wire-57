import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudySession } from '@/contexts/StudySessionContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogOut, ArrowRight } from 'lucide-react';

export const ActiveStudySessionBar: React.FC = () => {
  const { activeRoomId, leaveSession } = useStudySession();
  const navigate = useNavigate();

  if (!activeRoomId) {
    return null;
  }

  const handleGoToRoom = () => {
    navigate(`/study-room/${activeRoomId}`);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-primary text-primary-foreground p-4 rounded-lg shadow-lg flex items-center space-x-4">
        <AlertTriangle className="h-6 w-6" />
        <div className="flex flex-col">
          <span className="font-semibold">Você está em uma sessão de estudo.</span>
          <span className="text-sm opacity-80">ID da sala: {activeRoomId.substring(0, 8)}...</span>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm" onClick={handleGoToRoom}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Ir para a sala
          </Button>
          <Button variant="destructive" size="sm" onClick={leaveSession}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair da sessão
          </Button>
        </div>
      </div>
    </div>
  );
};
