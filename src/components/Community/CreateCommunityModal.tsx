import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, X, UploadCloud, Globe } from 'lucide-react';
import { useState } from 'react';

interface CreateCommunityModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCommunityModal({ open, onClose, onSuccess }: CreateCommunityModalProps) {
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = () => {
    onSuccess();
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Criar nova comunidade
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex border-b border-app-border mb-4">
          {[1, 2, 3].map((num) => (
            <button
              key={num}
              className={`flex-1 px-4 py-2 text-sm border-b-2 transition-colors ${
                step === num
                  ? 'border-app-accent text-app-accent font-medium'
                  : 'border-transparent text-app-text-muted'
              }`}
              onClick={() => setStep(num)}
            >
              {num === 1 && 'Básico'}
              {num === 2 && 'Configurações'}
              {num === 3 && 'Revisão'}
            </button>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da comunidade *</Label>
              <Input id="name" placeholder="Ex: Administração Pública" />
              <p className="text-xs text-app-text-muted">
                Escolha um nome claro e descritivo (máx. 50 caracteres)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (identificador único)</Label>
              <div className="flex">
                <span className="px-3 py-2 bg-app-muted border border-r-0 border-app-border rounded-l-lg text-sm text-app-text-muted">
                  studynet.com/comunidades/
                </span>
                <Input id="slug" value="admin-publica" className="rounded-l-none" />
                <Button variant="outline" className="rounded-l-none">Editar</Button>
              </div>
              <p className="text-xs text-app-text-muted">
                Este será o endereço único da sua comunidade
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea 
                id="description" 
                placeholder="Descreva o propósito da comunidade, tópicos de discussão, etc."
                className="min-h-[100px]"
              />
              <p className="text-xs text-app-text-muted">Mín. 100 caracteres</p>
            </div>

            <div className="space-y-2">
              <Label>Imagem da comunidade</Label>
              <div className="border-2 border-dashed border-app-border rounded-lg p-6 text-center">
                <UploadCloud className="w-8 h-8 mx-auto mb-2 text-app-text-muted" />
                <div className="text-sm text-app-text-muted">
                  Arraste e solte uma imagem aqui ou{' '}
                  <Button variant="link" className="p-0 h-auto">clique para selecionar</Button>
                </div>
                <p className="text-xs text-app-text-muted mt-1">
                  Recomendado: 256x256px, PNG ou JPG, máx. 2MB
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Settings */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-medium">Visibilidade</Label>
              <RadioGroup defaultValue="public">
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="public" id="public" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="public" className="font-medium">Pública</Label>
                    <p className="text-sm text-app-text-muted">
                      Qualquer pessoa pode encontrar e participar
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="private-listed" id="private-listed" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="private-listed" className="font-medium">Privada listada</Label>
                    <p className="text-sm text-app-text-muted">
                      Qualquer pessoa pode encontrar, mas precisa solicitar entrada
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="private-hidden" id="private-hidden" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="private-hidden" className="font-medium">Privada oculta</Label>
                    <p className="text-sm text-app-text-muted">
                      Apenas membros com link podem encontrar e solicitar entrada
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Política de entrada</Label>
              <RadioGroup defaultValue="open">
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="open" id="open" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="open" className="font-medium">Aberta</Label>
                    <p className="text-sm text-app-text-muted">
                      Qualquer pessoa pode entrar imediatamente
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="approval" id="approval" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="approval" className="font-medium">Solicitação</Label>
                    <p className="text-sm text-app-text-muted">
                      Administradores devem aprovar solicitações
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="invite" id="invite" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="invite" className="font-medium">Convite</Label>
                    <p className="text-sm text-app-text-muted">
                      Apenas membros podem convidar outras pessoas
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Idioma principal</Label>
              <Select defaultValue="pt-br">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                  <SelectItem value="en">Inglês</SelectItem>
                  <SelectItem value="es">Espanhol</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tags principais (máx. 5)</Label>
              <div className="border border-app-border rounded-lg p-2 bg-app-muted">
                <div className="flex flex-wrap gap-1">
                  <span className="text-sm bg-app-accent/10 text-app-accent px-2 py-1 rounded-full border border-app-accent/20">
                    Administração
                    <button className="ml-1 hover:text-app-danger">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                  <span className="text-sm bg-app-accent/10 text-app-accent px-2 py-1 rounded-full border border-app-accent/20">
                    Concursos
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
              <p className="text-xs text-app-text-muted">
                As tags ajudam pessoas a encontrar sua comunidade
              </p>
            </div>

            <div className="space-y-2">
              <Label>Regras da comunidade</Label>
              <Textarea 
                placeholder="Escreva as regras de convivência e diretrizes para postagens..."
                className="min-h-[120px]"
              />
              <p className="text-xs text-app-text-muted">Use Markdown para formatação</p>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Preview Card */}
            <div className="bg-app-bg-soft border border-app-border rounded-2xl p-4 space-y-3">
              <div className="flex gap-3 items-start">
                <div className="w-15 h-15 rounded-full bg-gradient-to-br from-app-accent to-app-accent-2 text-white font-bold text-xl flex items-center justify-center">
                  AP
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-app-text">Administração Pública</h3>
                  <p className="text-sm text-app-text-muted">studynet.com/comunidades/admin-publica</p>
                </div>
              </div>
              
              <p className="text-sm text-app-text-muted">
                Comunidade para discussão de concursos públicos na área de administração pública, compartilhamento de materiais e experiências.
              </p>
              
              <div className="flex gap-1 flex-wrap">
                <span className="text-xs bg-app-muted px-2 py-1 rounded-full text-app-text border border-app-border">#Administração</span>
                <span className="text-xs bg-app-muted px-2 py-1 rounded-full text-app-text border border-app-border">#Concursos</span>
                <span className="text-xs bg-app-muted px-2 py-1 rounded-full text-app-text border border-app-border">#FGV</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-app-text-muted">
                <Globe className="w-4 h-4" />
                Pública • Entrada aberta
              </div>
            </div>

            {/* Rules Preview */}
            <div className="space-y-2">
              <h4 className="font-medium text-app-text">Regras da comunidade</h4>
              <div className="bg-app-muted rounded-lg p-3 text-sm text-app-text">
                1. Seja respeitoso com todos os membros<br />
                2. Mantenha as discussões relevantes para o tema<br />
                3. Não faça spam ou autopromoção excessiva<br />
                4. Cite fontes quando compartilhar informações<br />
                5. Respeite os direitos autorais
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t border-app-border">
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                Voltar
              </Button>
            )}
            {step === 1 && (
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            )}
          </div>
          
          <div>
            {step < 3 ? (
              <Button onClick={handleNext} className="bg-gradient-to-r from-app-accent to-app-accent-2">
                Próximo
              </Button>
            ) : (
              <Button onClick={handleFinish} className="bg-gradient-to-r from-app-accent to-app-accent-2">
                Criar comunidade
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}