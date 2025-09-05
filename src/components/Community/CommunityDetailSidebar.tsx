import {
  Users, Activity, BookOpen, Flag, Send, FileText, HelpCircle, Calendar, Book, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';

// Helper Components from the original file, slightly adapted for the new design
const Avatar = ({ initials }: { initials: string }) => (
  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-app-accent to-app-accent-2 text-white font-bold flex items-center justify-center flex-shrink-0">
    {initials}
  </div>
);

const Meta = ({ children }: { children: React.ReactNode }) => (
  <div className="text-xs text-app-text-muted">{children}</div>
);

export function CommunityDetailSidebar() {
  const [showReportDialog, setShowReportDialog] = useState(false);
  

  return (
    <aside
      className="w-full bg-app-panel border border-app-border rounded-2xl p-3 flex flex-col gap-3 sticky top-4 h-fit"
      aria-label="Sidebar da comunidade"
    >
      {/* Sobre a comunidade */}
      <section className="bg-app-muted border border-app-border rounded-xl p-3" aria-labelledby="h-about">
        <div className="flex items-center justify-between">
          <h2 id="h-about" className="text-base font-semibold">Sobre a comunidade</h2>
        </div>
        <div className="flex gap-2 items-center flex-wrap my-3" aria-label="Métricas">
          <div className="flex gap-1.5 items-center px-2 py-1 border border-app-border rounded-full bg-app-panel text-xs">
            <Users className="w-4 h-4" /> <strong>1.248</strong> <span className="text-app-text-muted">membros</span>
          </div>
          <div className="flex gap-1.5 items-center text-xs">
            <Activity className="w-4 h-4" />
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-app-panel border border-app-border font-semibold text-[11px]">
              Ativa <span className="text-app-text-muted font-normal">(7d)</span>
            </span>
          </div>
        </div>
        <p className="text-app-text-muted text-sm">
          Espaço para dúvidas, materiais e guias focados em <strong>Direito Constitucional</strong> para concursos.
        </p>
      </section>

      {/* Regras */}
      <section className="bg-app-muted border border-app-border rounded-xl p-3" aria-labelledby="h-rules">
        <h3 id="h-rules" className="text-sm font-semibold mb-1.5">Regras da comunidade</h3>
        <ul className="list-disc pl-5 text-sm text-app-text-muted space-y-1.5">
          <li>Seja respeitoso. Nada de ataques pessoais.</li>
          <li>Use tags corretas e descreva o contexto da dúvida.</li>
          <li>Materiais com direitos autorais: compartilhar apenas trechos permitidos.</li>
          <li>Denuncie conteúdo impróprio. Moderadores podem remover e silenciar.</li>
        </ul>
        <div className="flex items-center gap-2 mt-2">
          <details>
            <summary className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-app-border rounded-full bg-app-panel text-[12px] hover:bg-app-border">
              <BookOpen className="w-3.5 h-3.5" /> Ler completo
            </summary>
            <div className="text-app-text-muted text-xs p-2 rounded-lg mt-2 bg-app-panel border border-app-border">
              Estas regras visam manter um ambiente colaborativo e seguro. Ao participar, você concorda em segui-las.
            </div>
          </details>
          <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-auto px-2.5 py-1.5 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" /> Denunciar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-app-panel border-app-border" aria-label="Denunciar conteúdo">
              <DialogHeader className="border-b border-app-border pb-3">
                <DialogTitle className="flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  <span className="flex-grow">Denunciar conteúdo</span>
                </DialogTitle>
              </DialogHeader>
              <div className="py-3 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5"><span className="text-sm text-app-text-muted">Motivo</span>
                  <select className="p-2.5 border border-app-border rounded-lg bg-app-muted text-app-text text-sm">
                    <option>Spam</option><option>Ofensa</option><option>Ilegal</option><option>Plágio</option><option>Fora do tema</option><option>Dado sensível</option><option>Outro</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5"><span className="text-sm text-app-text-muted">Comentário (opcional)</span>
                  <textarea rows={4} placeholder="Descreva rapidamente" className="p-2.5 border border-app-border rounded-lg bg-app-muted text-app-text text-sm resize-none"></textarea>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowReportDialog(false)}>Cancelar</Button>
                <Button className="bg-gradient-to-r from-app-accent to-app-accent-2 text-white" onClick={() => {
                  setShowReportDialog(false);
                  alert('Denúncia enviada. Obrigado por ajudar a manter a comunidade segura!');
                }}>
                  <Send className="w-4 h-4 mr-2" /> Enviar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Moderadores */}
      <section className="bg-app-muted border border-app-border rounded-xl p-3" aria-labelledby="h-mods">
        <h3 id="h-mods" className="text-sm font-semibold mb-1.5">Moderadores</h3>
        <div className="space-y-1">
          <a href="#" className="flex gap-2.5 items-center p-2 rounded-lg hover:bg-app-border">
            <Avatar initials="AN" />
            <div>
              <strong className="font-medium text-sm">Ana</strong>
              <Meta>Desde 2024</Meta>
            </div>
          </a>
          <a href="#" className="flex gap-2.5 items-center p-2 rounded-lg hover:bg-app-border">
            <Avatar initials="BR" />
            <div>
              <strong className="font-medium text-sm">Bruno</strong>
              <Meta>Desde 2023</Meta>
            </div>
          </a>
        </div>
      </section>

      {/* Membros em destaque */}
      <section className="bg-app-muted border border-app-border rounded-xl p-3" aria-labelledby="h-featured">
        <h3 id="h-featured" className="text-sm font-semibold mb-1.5">Membros em destaque</h3>
        <div className="space-y-2">
          <div className="flex gap-2.5 items-center p-2.5 border border-app-border rounded-xl bg-app-panel">
            <Avatar initials="LC" />
            <div className="flex-grow">
              <strong className="font-medium text-sm">Letícia</strong>
              <Meta>Nível 3 • 120 pts</Meta>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-app-muted rounded-full text-[11px]">
              <Book className="w-3.5 h-3.5" /> Guias
            </span>
          </div>
          <div className="flex gap-2.5 items-center p-2.5 border border-app-border rounded-xl bg-app-panel">
            <Avatar initials="RG" />
            <div className="flex-grow">
              <strong className="font-medium text-sm">Rogério</strong>
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
        <h3 id="h-links" className="text-sm font-semibold mb-1.5">Links úteis</h3>
        <div className="space-y-0.5">
          <a
            href="#"
            className="flex gap-2.5 items-center p-2 rounded-lg hover:bg-app-border text-sm"
            aria-label="Guia de postagem"
          >
            <FileText className="w-4 h-4 text-app-text-muted" />
            <div className="flex-grow">Guia de postagem</div>
          </a>
          <a
            href="#"
            className="flex gap-2.5 items-center p-2 rounded-lg hover:bg-app-border text-sm"
            aria-label="FAQ de moderação"
          >
            <HelpCircle className="w-4 h-4 text-app-text-muted" />
            <div className="flex-grow">FAQ de moderação</div>
          </a>
          <a
            href="#"
            className="flex gap-2.5 items-center p-2 rounded-lg hover:bg-app-border text-sm"
            aria-label="Eventos e salas de estudo"
          >
            <Calendar className="w-4 h-4 text-app-text-muted" />
            <div className="flex-grow">Eventos e salas de estudo</div>
          </a>
        </div>
      </section>
    </aside>
  );
}
