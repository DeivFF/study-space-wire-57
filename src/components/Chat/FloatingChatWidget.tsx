import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { FloatingChatModal } from './FloatingChatModal';
import './FloatingChat.css';

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount] = useState(3); // This would come from chat context in real app

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="chat-fab">
            <MessageCircle size={20} />
            <span className="chat-fab-text">Mensagens</span>
            {unreadCount > 0 && (
              <span className="chat-fab-badge">{unreadCount}</span>
            )}
          </button>
        </DialogTrigger>
        <DialogContent className="chat-dialog-content">
          <FloatingChatModal onClose={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}