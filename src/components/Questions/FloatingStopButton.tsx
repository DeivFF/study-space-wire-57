import React from 'react';
import { Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingStopButtonProps {
  onStop: () => void;
  sessionActive: boolean;
}

export const FloatingStopButton: React.FC<FloatingStopButtonProps> = ({
  onStop,
  sessionActive
}) => {
  if (!sessionActive) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <Button
        onClick={onStop}
        variant="destructive"
        size="lg"
        className="shadow-lg hover:shadow-xl transition-shadow"
        data-testid="stop-session-button"
      >
        <Square className="h-5 w-5 mr-2" />
        Parar Sessão
      </Button>
    </div>
  );
};