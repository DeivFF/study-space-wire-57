import { ArrowLeft, Users, UserCheck, Globe, FileText, Search, MessageCircle, Heart, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface CommunityDetailProps {
  onBack: () => void;
  onCreateThread: () => void;
}

const threads = [
  {
    id: 1,
    title: 'Dúvida sobre administração direta e indireta - CESPE questão',
    content: 'Olá pessoal, estou com dúvida nesta questão do CESPE sobre os conceitos de administração direta e indireta. Alguém pode ajudar?',
    tags: ['#administração', '#concurso'],
    replies: 12,
    likes: 34,
    views: 240,
    timeAgo: 'há 3 horas',
    author: 'Carlos Silva',
    isResolved: false
  },
  {
    id: 2,
    title: 'Material de apoio para licitações - Lei 14.133/2021',
    content: 'Compartilhando meu resumo sobre a nova lei de licitações. Inclui comparativo com a lei anterior e principais mudanças.',
    tags: ['#licitação'],
    replies: 8,
    likes: 45,
    views: 187,
    timeAgo: 'há 1 dia',
    author: 'Maria Santos',
    isResolved: true
  },
  {
    id: 3,
    title: 'Simulado FGV - Administração Geral comentado',
    content: 'Acabei de fazer o simulado da FGV e gostaria de discutir algumas questões, principalmente a de número 23 sobre controle administrativo.',
    tags: ['#fgv', '#prova'],
    replies: 0,
    likes: 2,
    views: 43,
    timeAgo: 'há 4 horas',
    author: 'João Pereira',
    isResolved: false
  }
];

export function CommunityDetail({ onBack, onCreateThread }: CommunityDetailProps) {
  return (
    <div className="space-y-4">
      {/* Community Hero */}
      <div className="bg-app-panel border border-app-border rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-app-accent to-app-accent-2 text-white font-bold text-2xl flex items-center justify-center">
            AP
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-app-text">Administração Pública</h1>
            <p className="text-app-text-muted mt-1">
              Comunidade para discussão de concursos públicos na área de administração pública, compartilhamento de materiais e experiências.
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="text-xs bg-app-muted px-2 py-1 rounded-full text-app-text border border-app-border">#FGV</span>
              <span className="text-xs bg-app-muted px-2 py-1 rounded-full text-app-text border border-app-border">#Administração</span>
              <span className="text-xs bg-app-muted px-2 py-1 rounded-full text-app-text border border-app-border">#Concursos</span>
            </div>
          </div>
          <Button className="bg-app-success text-white">
            <UserCheck className="w-4 h-4 mr-2" />
            Membro
          </Button>
        </div>

        <div className="flex gap-6 text-sm text-app-text-muted mb-4">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            12.8k membros
          </span>
          <span className="flex items-center gap-1">
            <UserCheck className="w-4 h-4" />
            345 online
          </span>
          <span className="flex items-center gap-1">
            <Globe className="w-4 h-4" />
            Pública
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <button className="text-app-accent hover:underline">Regras</button>
          </span>
        </div>

        <div className="flex border-b border-app-border">
          <button className="px-4 py-2 border-b-2 border-app-accent text-app-accent font-medium">Em alta</button>
          <button className="px-4 py-2 text-app-text-muted hover:text-app-text">Recentes</button>
          <button className="px-4 py-2 text-app-text-muted hover:text-app-text">Sem resposta</button>
          <button className="px-4 py-2 text-app-text-muted hover:text-app-text">Top da semana</button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-app-text-muted" />
          <Input 
            placeholder="Buscar na comunidade..." 
            className="pl-10 bg-app-muted border-app-border"
          />
        </div>
        
        <Select defaultValue="all-tags">
          <SelectTrigger className="w-[140px] bg-app-panel border-app-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-tags">Todas as tags</SelectItem>
            <SelectItem value="fgv">FGV</SelectItem>
            <SelectItem value="admin">Administração</SelectItem>
          </SelectContent>
        </Select>
        
        <Select defaultValue="all">
          <SelectTrigger className="w-[120px] bg-app-panel border-app-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="resolved">Resolvidas</SelectItem>
            <SelectItem value="open">Abertas</SelectItem>
          </SelectContent>
        </Select>
        
        <Button onClick={onCreateThread} className="bg-gradient-to-r from-app-accent to-app-accent-2">
          <Edit className="w-4 h-4 mr-2" />
          Novo tópico
        </Button>
      </div>

      {/* Threads List */}
      <div className="space-y-3">
        {threads.map((thread) => (
          <div key={thread.id} className="bg-app-panel border border-app-border rounded-2xl p-4">
            <div className="flex gap-2 mb-2 flex-wrap">
              {thread.tags.map((tag, index) => (
                <span key={index} className="text-xs bg-app-muted px-2 py-1 rounded-full text-app-text border border-app-border">
                  {tag}
                </span>
              ))}
              {thread.isResolved && (
                <Badge className="bg-app-success/20 text-app-success border-app-success/40">
                  ✓ Resolvida
                </Badge>
              )}
            </div>
            
            <h3 className="font-semibold text-app-text mb-2">{thread.title}</h3>
            <p className="text-app-text-muted text-sm mb-3 line-clamp-2">{thread.content}</p>
            
            <div className="flex gap-4 text-xs text-app-text-muted">
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {thread.replies} respostas
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {thread.likes} curtidas
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {thread.views} visualizações
              </span>
              <span>{thread.timeAgo} • por <strong>{thread.author}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}