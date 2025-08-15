import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Brain, BookOpen, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AITeacherChatProps {
  content: string;
  title: string;
  onBack: () => void;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ContentAnalysis {
  summary: string;
  keyTopics: string[];
  difficulty: string;
  studyTime: string;
  prerequisites: string[];
  nextSteps: string[];
}

const AITeacherChat = ({ content, title, onBack }: AITeacherChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (content && !analysis) {
      analyzeContent();
    }
  }, [content]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const analyzeContent = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('intelligent-review', {
        body: {
          action: 'analyze',
          content: content
        }
      });

      if (error) throw error;

      setAnalysis(data);
      
      // Add initial welcome message
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: `Olá! Sou sua professora de IA e acabei de analisar o conteúdo "${title}". 

📚 **Resumo**: ${data.summary}

🎯 **Tópicos principais**: ${data.keyTopics.join(', ')}

⚡ **Dificuldade**: ${data.difficulty}
⏱️ **Tempo estimado de estudo**: ${data.studyTime}

Estou aqui para te ajudar a entender este conteúdo! Pode me fazer qualquer pergunta sobre os tópicos, pedir explicações ou solicitar exercícios práticos. Como posso te auxiliar?`,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
      
    } catch (error) {
      console.error('Erro ao analisar conteúdo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível analisar o conteúdo",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('intelligent-review', {
        body: {
          action: 'chat',
          content: content,
          userMessage: inputMessage,
          analysis: analysis
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (analyzing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Brain className="w-12 h-12 mx-auto animate-pulse text-primary" />
          <p className="text-lg font-medium">Analisando conteúdo...</p>
          <p className="text-muted-foreground">A IA está preparando para te ajudar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Análise por IA - {title}</h2>
        </div>
      </div>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <span>Análise do Conteúdo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                Dificuldade: {analysis.difficulty}
              </Badge>
              <Badge variant="outline">
                Tempo: {analysis.studyTime}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Tópicos principais:</p>
              <p className="text-sm">{analysis.keyTopics.join(', ')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="h-[500px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span>Chat com a Professora IA</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {!message.isUser && <Bot className="w-4 h-4 mt-1 flex-shrink-0" />}
                      {message.isUser && <User className="w-4 h-4 mt-1 flex-shrink-0" />}
                      <div className="space-y-1">
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        <p className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4 animate-pulse" />
                      <p className="text-sm">Digitando...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta ou dúvida..."
                disabled={loading}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage} 
                disabled={loading || !inputMessage.trim()}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pressione Enter para enviar. A IA está aqui para te ajudar com o conteúdo!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AITeacherChat;