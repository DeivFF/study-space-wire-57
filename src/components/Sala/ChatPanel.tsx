import { MessageSquare, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useRef, useEffect } from "react";
import { useRoomMessages, useSendRoomMessage, useRoomMessagesWebSocket } from "@/hooks/useRooms";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "@/hooks/useFriends";
import { useSocket } from "@/contexts/SocketContext";

interface ChatPanelProps {
  roomId: string | null;
}

export function ChatPanel({ roomId }: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const { friends } = useFriends();
  const { sendRoomMessage, sendRoomTypingStart, sendRoomTypingStop } = useSocket();
  
  const { data: messages = [], isLoading } = useRoomMessages(roomId);
  const { typingUsers } = useRoomMessagesWebSocket(roomId);
  const sendMessageMutation = useSendRoomMessage();

  const handleSendMessage = () => {
    if (newMessage.trim() && roomId) {
      const messageData = {
        id: Date.now().toString(),
        content: newMessage.trim(),
        sender_id: user?.id || '',
        sender_name: user?.name || user?.email || '',
        sender_email: user?.email || '',
        message_type: 'text' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Send via WebSocket for real-time delivery
      sendRoomMessage(roomId, messageData);
      
      // Also send via API for persistence
      sendMessageMutation.mutate({ 
        roomId, 
        content: newMessage.trim() 
      });
      
      setNewMessage("");
      
      // Stop typing indicator
      if (isTyping) {
        sendRoomTypingStop(roomId);
        setIsTyping(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!roomId) return;

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      sendRoomTypingStart(roomId);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        sendRoomTypingStop(roomId);
        setIsTyping(false);
      }
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section className="bg-card border border-border rounded-2xl shadow-lg flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="p-2 lg:p-3 border-b border-border flex items-center gap-2 lg:gap-3 flex-shrink-0">
        <MessageSquare className="h-4 w-4 lg:h-5 lg:w-5" />
        <h2 className="text-base lg:text-lg font-semibold">Chat</h2>
        <div className="flex-1" />
        <span className="text-xs lg:text-sm text-muted-foreground">tempo real</span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="p-2 lg:p-3 space-y-2 lg:space-y-3 bg-muted/20 min-h-full">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Carregando mensagens...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma mensagem ainda.</p>
                <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.sender_id === user?.id;
                const isFriend = friends.some(friend => friend.id === message.sender_id);
                const senderFriend = friends.find(friend => friend.id === message.sender_id);
                const timestamp = new Date(message.created_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                return (
                  <div
                    key={message.id}
                    className={`flex items-start gap-2 ${isOwn ? "flex-row-reverse self-end ml-auto" : "self-start mr-auto"}`}
                  >
                    {/* Avatar circle for friends */}
                    {isFriend && !isOwn && (
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary shadow-sm bg-card">
                        {senderFriend?.avatarUrl ? (
                          <img 
                            src={senderFriend.avatarUrl} 
                            alt={message.sender_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-sm">
                            {senderFriend?.avatar || message.sender_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Message bubble */}
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] p-2 lg:p-3 rounded-2xl border text-sm lg:text-base ${
                        isOwn
                          ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-transparent"
                          : isFriend 
                            ? "bg-gradient-to-br from-muted to-muted/80 border-primary/30" 
                            : "bg-muted border-border"
                      }`}
                    >
                      {!isOwn && (
                        <div className="font-semibold mb-1 text-xs lg:text-sm">{message.sender_name}</div>
                      )}
                      <div className="break-words">{message.content}</div>
                      <div
                        className={`text-xs mt-1 lg:mt-2 ${
                          isOwn
                            ? "text-primary-foreground/85"
                            : "text-muted-foreground"
                        }`}
                      >
                        {isOwn ? `você • ${timestamp}` : timestamp}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Indicators */}
            {Object.keys(typingUsers).length > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span>
                  {Object.values(typingUsers).length === 1
                    ? `${Object.values(typingUsers)[0]} está digitando...`
                    : `${Object.values(typingUsers).length} pessoas estão digitando...`
                  }
                </span>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Message Composer */}
      <div className="border-t border-border p-2 lg:p-3 flex items-center gap-2 bg-card flex-shrink-0">
        <Input
          placeholder="Escreva uma mensagem…"
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className="flex-1 text-sm lg:text-base"
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={!newMessage.trim() || sendMessageMutation.isPending} 
          size="sm" 
          className="px-2 lg:px-3"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">
            {sendMessageMutation.isPending ? "Enviando..." : "Enviar mensagem"}
          </span>
        </Button>
      </div>
    </section>
  );
}