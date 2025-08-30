import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, X, UploadCloud, Bold, Italic, Quote, Code, Link, Eye, Bookmark } from 'lucide-react';

interface CreateThreadModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateThreadModal({ open, onClose }: CreateThreadModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Novo tópico
          </DialogTitle>
        </DialogHeader>

        {/* Community Info */}
        <div className="space-y-2 mb-4">
          <span className="text-sm text-app-text-muted">Comunidade:</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-app-accent to-app-accent-2 text-white font-semibold text-sm flex items-center justify-center">
              AP
            </div>
            <span className="font-medium text-app-text">Administração Pública</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Thread Type and Source */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de tópico</Label>
              <Select defaultValue="discussion">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discussion">Discussão</SelectItem>
                  <SelectItem value="question">Pergunta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Origem (opcional)</Label>
              <Select defaultValue="none">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="lesson">Aula</SelectItem>
                  <SelectItem value="question">Questão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input 
              id="title" 
              placeholder="Ex: Dúvida sobre administração direta e indireta" 
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo *</Label>
            
            {/* Rich Text Editor */}
            <div className="border border-app-border rounded-lg overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-1 p-2 border-b border-app-border bg-app-muted">
                <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                  <Bold className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                  <Italic className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                  <Quote className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                  <Code className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                  <Link className="w-4 h-4" />
                </Button>
                <div className="flex-1" />
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  Pré-visualizar
                </Button>
              </div>
              
              {/* Editor */}
              <Textarea 
                id="content"
                placeholder="Escreva aqui sua pergunta ou ponto de discussão..."
                className="min-h-[200px] border-0 resize-none focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (máx. 5)</Label>
            <div className="border border-app-border rounded-lg p-2 bg-app-muted">
              <div className="flex flex-wrap gap-1">
                <span className="text-sm bg-app-accent/10 text-app-accent px-2 py-1 rounded-full border border-app-accent/20">
                  administração
                  <button className="ml-1 hover:text-app-danger">
                    <X className="w-3 h-3" />
                  </button>
                </span>
                <span className="text-sm bg-app-accent/10 text-app-accent px-2 py-1 rounded-full border border-app-accent/20">
                  direito-administrativo
                  <button className="ml-1 hover:text-app-danger">
                    <X className="w-3 h-3" />
                  </button>
                </span>
                <Input 
                  placeholder="Adicionar tag..." 
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 flex-1 min-w-[100px] h-auto p-1"
                />
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>Anexos (opcional)</Label>
            <div className="border-2 border-dashed border-app-border rounded-lg p-6 text-center">
              <UploadCloud className="w-8 h-8 mx-auto mb-2 text-app-text-muted" />
              <div className="text-sm text-app-text-muted">
                Arraste e solte arquivos aqui ou{' '}
                <Button variant="link" className="p-0 h-auto">clique para selecionar</Button>
              </div>
              <p className="text-xs text-app-text-muted mt-1">
                Máx. 3 arquivos, 5MB cada
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-app-border">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline">
              <Bookmark className="w-4 h-4 mr-2" />
              Salvar rascunho
            </Button>
            <Button className="bg-gradient-to-r from-app-accent to-app-accent-2">
              Publicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}