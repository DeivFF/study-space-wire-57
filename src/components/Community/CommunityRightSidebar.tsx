import {
  TrendingUp, Hash, Sparkles, Plus, Users, Activity, BookOpen, 
  Flag, HelpCircle, Calendar, FileText, MessageCircle, Book, 
  Send, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { useState } from 'react';

interface CommunityRightSidebarProps {
  showCommunityDetails?: boolean;
}

const trendingCommunities = [
  {
    name: 'Concursos Educação',
    avatar: 'CE',
    metric: '+1.2k novos membros'
  },
  {
    name: 'Medicina Discursiva',
    avatar: 'MD',
    metric: '+845 novos membros'
  },
  {
    name: 'Polícia Federal',
    avatar: 'PF',
    metric: '+722 novos membros'
  }
];

const popularTags = [
  { tag: 'ENEM', count: '12.5k' },
  { tag: 'FGV', count: '8.7k' },
  { tag: 'OAB', count: '7.2k' },
  { tag: 'Administração', count: '5.9k' }
];

const recommendations = [
  {
    name: 'Contabilidade',
    avatar: 'CE',
    reason: 'Baseado nas suas aulas'
  },
  {
    name: 'Estatística FCC',
    avatar: 'EF',
    reason: 'Baseado nas suas questões'
  }
];

// Helper Components
const Avatar = ({ initials, className = "" }: { initials: string, className?: string }) => (
  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-app-accent to-app-accent-2 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 ${className}`}>
    {initials}
  </div>
);

const Meta = ({ children }: { children: React.ReactNode }) => (
  <div className="text-xs text-app-text-muted">{children}</div>
);

export function CommunityRightSidebar({ showCommunityDetails = false }: CommunityRightSidebarProps) {
  const [showReportDialog, setShowReportDialog] = useState(false);
  

  if (showCommunityDetails) {
    return (
      <aside className="w-full max-w-[360px] bg-app-panel border border-app-border rounded-2xl shadow-lg p-3 flex flex-col gap-3 sticky top-4 h-fit" aria-label="Sidebar da comunidade">
        {/* Sobre a comunidade */}
        <section className="bg-app-muted border border-app-border rounded-xl p-3" aria-labelledby="h-about">
        <div className="flex items-center justify-between">
          <h2 id="h-about" className="text-base font-semibold text-app-text">Sobre a comunidade</h2>
        </div>
          <div className="flex gap-2 items-center flex-wrap my-2" aria-label="Métricas">
            <div className="flex gap-1.5 items-center px-2 py-1 border border-app-border rounded-full bg-app-panel text-xs">
              <Users className="w-4 h-4" />
              <strong className="font-semibold">1.248</strong>
              <span className="text-app-text-muted">membros</span>
            </div>
            <div className="flex gap-1.5 items-center text-xs">
              <Activity className="w-4 h-4" />
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-app-panel border border-app-border font-semibold text-[11px]">
                Ativa
                <span className="text-app-text-muted font-normal">(7d)</span>
              </span>
            </div>
          </div>
          <p className="text-app-text-muted text-sm mt-2">
            Espaço para dúvidas, materiais e guias focados em <strong className="font-bold">Direito Constitucional</strong> para concursos.
          </p>
        </section>

        {/* Regras */}
        <section className="bg-app-muted border border-app-border rounded-xl p-3" aria-labelledby="h-rules">
          <h3 id="h-rules" className="text-sm font-semibold text-app-text mb-1.5">Regras da comunidade</h3>
          <ul className="list-disc pl-5 text-sm text-app-text-muted space-y-1.5">
            <li>Seja respeitoso. Nada de ataques pessoais.</li>
            <li>Use tags corretas e descreva o contexto da dúvida.</li>
            <li>Materiais com direitos autorais: compartilhar apenas trechos permitidos.</li>
            <li>Denuncie conteúdo impróprio. Moderadores podem remover e silenciar.</li>
          </ul>
          <div className="flex items-center gap-2 mt-2">
            <details className="group">
              <summary className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-app-border rounded-full bg-app-panel text-[12px] cursor-pointer hover:bg-app-border list-none">
                <BookOpen className="w-3.5 h-3.5" />
                Ler completo
              </summary>
              <div className="text-app-text-muted text-xs p-2 rounded-md mt-2 bg-app-panel border border-app-border">
                Estas regras visam manter um ambiente colaborativo e seguro. Ao participar, você concorda em segui-las.
              </div>
            </details>
            <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs h-auto px-2.5 py-1.5 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5" />
                  Denunciar
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-app-panel border-app-border text-app-text p-0 max-w-[min(560px,96vw)] rounded-2xl" aria-label="Denunciar conteúdo">
                <DialogHeader className="flex flex-row items-center p-3 border-b border-app-border">
                  <Flag className="w-4 h-4 mr-2" />
                  <DialogTitle className="flex-grow text-app-text">Denunciar conteúdo</DialogTitle>
                  <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <X className="w-4 h-4" />
                    </Button>
                  </DialogClose>
                </DialogHeader>
                <div className="flex flex-col gap-4 p-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm text-app-text-muted">Motivo</span>
                    <select className="w-full p-2.5 border border-app-border rounded-lg bg-app-muted text-app-text text-sm">
                      <option>Spam</option><option>Ofensa</option><option>Ilegal</option><option>Plágio</option><option>Fora do tema</option><option>Dado sensível</option><option>Outro</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm text-app-text-muted">Comentário (opcional)</span>
                    <textarea
                      rows={4}
                      placeholder="Descreva rapidamente"
                      className="w-full p-2.5 border border-app-border rounded-lg bg-app-muted text-app-text text-sm resize-none"
                    />
                  </label>
                </div>
                <div className="flex justify-end gap-2 p-3">
                  <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                    Cancelar
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-app-accent to-app-accent-2 text-white"
                    onClick={() => {
                      setShowReportDialog(false);
                      alert('Denúncia enviada. Obrigado por ajudar a manter a comunidade segura!');
                    }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Moderadores */}
        <section className="bg-app-muted border border-app-border rounded-xl p-3" aria-labelledby="h-mods">
          <h3 id="h-mods" className="text-sm font-semibold text-app-text mb-1.5">Moderadores</h3>
          <div className="space-y-1">
            <a href="#" className="flex gap-2.5 items-center p-2 hover:bg-app-border rounded-lg">
              <Avatar initials="AN" />
              <div className="flex flex-col">
                <strong className="font-medium text-sm text-app-text">Ana</strong>
                <Meta>Desde 2024</Meta>
              </div>
            </a>
            <a href="#" className="flex gap-2.5 items-center p-2 hover:bg-app-border rounded-lg">
              <Avatar initials="BR" />
              <div className="flex flex-col">
                <strong className="font-medium text-sm text-app-text">Bruno</strong>
                <Meta>Desde 2023</Meta>
              </div>
            </a>
          </div>
        </section>

        {/* Membros em destaque */}
        <section className="bg-app-muted border border-app-border rounded-xl p-3" aria-labelledby="h-featured">
          <h3 id="h-featured" className="text-sm font-semibold text-app-text mb-1.5">Membros em destaque</h3>
          <div className="space-y-2">
            <div className="flex gap-2.5 items-center p-2.5 border border-app-border rounded-xl bg-app-panel">
              <Avatar initials="LC" />
              <div className="flex-grow">
                <strong className="font-medium text-sm text-app-text">Letícia</strong>
                <Meta>Nível 3 • 120 pts</Meta>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-app-muted rounded-full text-[11px]">
                <Book className="w-3.5 h-3.5" /> Guias
              </span>
            </div>
            <div className="flex gap-2.5 items-center p-2.5 border border-app-border rounded-xl bg-app-panel">
              <Avatar initials="RG" />
              <div className="flex-grow">
                <strong className="font-medium text-sm text-app-text">Rogério</strong>
                <Meta>Nível 2 • 85 pts</Meta>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-app-muted rounded-full text-[11px]">
                <MessageCircle className="w-3.5 h-3.5" /> Respostas
              </span>
            </div>
          </div>
        </section>

        {/* Links úteis */}
        <section className="bg-app-muted border border-app-border rounded-xl p-3" aria-labelledby="h-links">
          <h3 id="h-links" className="text-sm font-semibold text-app-text mb-1.5">Links úteis</h3>
          <div className="space-y-0.5">
            <a href="#" className="flex gap-2.5 items-center p-2 hover:bg-app-border rounded-lg text-sm text-app-text" aria-label="Guia de postagem">
              <FileText className="w-4 h-4 text-app-text-muted" />
              <div className="flex-grow">Guia de postagem</div>
            </a>
            <a href="#" className="flex gap-2.5 items-center p-2 hover:bg-app-border rounded-lg text-sm text-app-text" aria-label="FAQ de moderação">
              <HelpCircle className="w-4 h-4 text-app-text-muted" />
              <div className="flex-grow">FAQ de moderação</div>
            </a>
            <a href="#" className="flex gap-2.5 items-center p-2 hover:bg-app-border rounded-lg text-sm text-app-text" aria-label="Eventos e salas de estudo">
              <Calendar className="w-4 h-4 text-app-text-muted" />
              <div className="flex-grow">Eventos e salas de estudo</div>
            </a>
          </div>
        </section>
      </aside>
    );
  }

  return (
    <aside className="w-full max-w-[360px] bg-app-panel border border-app-border rounded-2xl p-4 space-y-6 sticky top-4 h-fit">
      {/* Trending Communities */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-app-accent" />
          <h3 className="font-semibold text-app-text">Comunidades em alta</h3>
        </div>
        <div className="space-y-2">
          {trendingCommunities.map((community, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-app-muted cursor-pointer">
              <Avatar initials={community.avatar} className="rounded-full" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-app-text text-sm">{community.name}</div>
                <div className="text-xs text-app-text-muted">{community.metric}</div>
              </div>
              <Button variant="outline" size="icon" className="p-1 h-6 w-6 rounded-full">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Tags */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Hash className="w-4 h-4 text-app-accent" />
          <h3 className="font-semibold text-app-text">Tags populares</h3>
        </div>
        <div className="space-y-1">
          {popularTags.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-app-muted cursor-pointer">
              <div className="flex items-center gap-2">
                <Hash className="w-3 h-3 text-app-text-muted" />
                <span className="text-sm text-app-text">#{item.tag}</span>
              </div>
              <span className="text-xs text-app-text-muted">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-app-accent" />
          <h3 className="font-semibold text-app-text">Para você</h3>
        </div>
        <div className="space-y-2">
          {recommendations.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-app-muted cursor-pointer">
              <Avatar initials={item.avatar} className="rounded-full" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-app-text text-sm">{item.name}</div>
                <div className="text-xs text-app-text-muted">{item.reason}</div>
              </div>
              <Button variant="outline" size="icon" className="p-1 h-6 w-6 rounded-full">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}