import { useState } from 'react';
import { X, ArrowLeft, Send } from 'lucide-react';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  status: 'online' | 'offline';
}

interface Message {
  id: string;
  text: string;
  time: string;
  sent: boolean;
}

export function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
  const [activeTab, setActiveTab] = useState<'conversations' | 'contacts'>('conversations');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');

  const [conversations] = useState<Conversation[]>([
    { id: '1', name: 'Amanda Mendes', avatar: 'AM', lastMessage: 'Oi, como está o estudo para a prova?', time: '14:20', status: 'online' },
    { id: '2', name: 'Carlos Silva', avatar: 'CS', lastMessage: 'Encontrei um material interessante', time: '13:45', status: 'online' },
    { id: '3', name: 'João Santos', avatar: 'JS', lastMessage: 'Vamos estudar juntos amanhã?', time: '10:15', status: 'online' },
  ]);

  const [messages, setMessages] = useState<Record<string, Message[]>>({
    '1': [
      { id: '1', text: 'Oi, como está o estudo para a prova?', time: '14:20', sent: false },
      { id: '2', text: 'Estou indo bem, revisando o conteúdo agora', time: '14:22', sent: true },
      { id: '3', text: 'Que bom! Preciso de ajuda com a matéria de ontem', time: '14:23', sent: false },
    ],
    '2': [
      { id: '1', text: 'Encontrei um material interessante', time: '13:45', sent: false },
      { id: '2', text: 'Pode compartilhar?', time: '13:46', sent: true },
    ],
    '3': [
      { id: '1', text: 'Vamos estudar juntos amanhã?', time: '10:15', sent: false },
      { id: '2', text: 'Boa ideia! Que horas?', time: '10:16', sent: true },
    ],
  });

  const getActiveConversation = () => {
    return conversations.find(conv => conv.id === activeChat);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeChat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageInput,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      sent: true,
    };

    setMessages(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMessage],
    }));

    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`
      fixed bottom-0 right-4 w-80 h-96 bg-app-panel border border-app-border border-b-0 rounded-t-lg z-50
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      flex flex-col shadow-lg
    `}>
      {!activeChat ? (
        <>
          {/* Header - List View */}
          <div className="flex items-center justify-between p-3 border-b border-app-border">
            <h3 className="font-semibold text-app-text">Conversas</h3>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-app-muted rounded transition-colors"
            >
              <X className="w-4 h-4 text-app-text" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-app-border">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex-1 py-2 px-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'conversations'
                  ? 'border-app-accent text-app-accent'
                  : 'border-transparent text-app-text-muted hover:text-app-text'
              }`}
            >
              Conversas
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex-1 py-2 px-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'contacts'
                  ? 'border-app-accent text-app-accent'
                  : 'border-transparent text-app-text-muted hover:text-app-text'
              }`}
            >
              Contatos
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'conversations' && (
              <div>
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setActiveChat(conv.id)}
                    className="flex items-center gap-3 p-3 hover:bg-app-muted cursor-pointer border-b border-app-border last:border-b-0"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-app-muted rounded-full flex items-center justify-center font-semibold text-sm text-app-text">
                        {conv.avatar}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-app-panel ${
                        conv.status === 'online' ? 'bg-app-success' : 'bg-app-text-muted'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm text-app-text truncate">{conv.name}</div>
                        <div className="text-xs text-app-text-muted">{conv.time}</div>
                      </div>
                      <div className="text-xs text-app-text-muted truncate">{conv.lastMessage}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Header - Chat View */}
          <div className="flex items-center gap-3 p-3 border-b border-app-border">
            <button 
              onClick={() => setActiveChat(null)}
              className="p-1 hover:bg-app-muted rounded transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-app-text" />
            </button>
            <div className="w-8 h-8 bg-app-muted rounded-full flex items-center justify-center font-semibold text-sm text-app-text">
              {getActiveConversation()?.avatar}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm text-app-text">{getActiveConversation()?.name}</div>
              <div className="text-xs text-app-text-muted">Online</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages[activeChat]?.map((message) => (
              <div key={message.id} className={`flex ${message.sent ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-3 py-2 rounded-2xl ${
                  message.sent 
                    ? 'bg-app-accent text-white rounded-tr-sm' 
                    : 'bg-app-muted text-app-text rounded-tl-sm'
                }`}>
                  <div className="text-sm">{message.text}</div>
                  <div className={`text-xs mt-1 ${
                    message.sent ? 'text-white opacity-70' : 'text-app-text-muted'
                  }`}>
                    {message.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="flex items-center gap-2 p-3 border-t border-app-border">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite uma mensagem..."
              className="flex-1 px-3 py-2 bg-app-muted border border-app-border rounded-full text-app-text placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="w-8 h-8 bg-app-accent hover:bg-app-accent-2 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}