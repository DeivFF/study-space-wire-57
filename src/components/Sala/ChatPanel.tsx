import { MessageSquare, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn?: boolean;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage?: (message: string) => void;
}

export function ChatPanel({ messages, onSendMessage }: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = () => {
    if (newMessage.trim() && onSendMessage) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
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

  return (
    <section className="bg-card border border-border rounded-2xl shadow-lg flex flex-col min-h-[400px] lg:min-h-[calc(100vh-56px-28px)] max-h-[70vh] lg:max-h-none overflow-hidden">
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
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] sm:max-w-[70%] p-2 lg:p-3 rounded-2xl border text-sm lg:text-base ${
                  message.isOwn
                    ? "self-end ml-auto bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-transparent"
                    : "bg-muted border-border"
                }`}
              >
                {!message.isOwn && (
                  <div className="font-semibold mb-1 text-xs lg:text-sm">{message.sender}</div>
                )}
                <div className="break-words">{message.content}</div>
                <div
                  className={`text-xs mt-1 lg:mt-2 ${
                    message.isOwn
                      ? "text-primary-foreground/85"
                      : "text-muted-foreground"
                  }`}
                >
                  {message.isOwn ? `você • ${message.timestamp}` : message.timestamp}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Message Composer */}
      <div className="border-t border-border p-2 lg:p-3 flex items-center gap-2 bg-card flex-shrink-0">
        <Input
          placeholder="Escreva uma mensagem…"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 text-sm lg:text-base"
        />
        <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="sm" className="px-2 lg:px-3">
          <Send className="h-4 w-4" />
          <span className="sr-only">Enviar mensagem</span>
        </Button>
      </div>
    </section>
  );
}