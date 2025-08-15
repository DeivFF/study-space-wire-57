import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { useContentImport, ImportProgress } from '@/hooks/useContentImport';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ImportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedContentId: string;
  items: any[];
  onImportComplete: () => void;
}

export const ImportProgressModal = ({ 
  isOpen, 
  onClose, 
  sharedContentId, 
  items, 
  onImportComplete 
}: ImportProgressModalProps) => {
  const { importSharedContent, importProgress, isImporting } = useContentImport();
  const [hasStarted, setHasStarted] = useState(false);

  const handleStartImport = async () => {
    setHasStarted(true);
    const success = await importSharedContent(sharedContentId, items);
    if (success) {
      onImportComplete();
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      onClose();
      setHasStarted(false);
    }
  };

  const getProgressPercentage = () => {
    if (!importProgress) return 0;
    return (importProgress.currentStepNumber / importProgress.totalSteps) * 100;
  };

  const getStatusIcon = () => {
    if (!importProgress) return null;
    
    if (importProgress.error) {
      return <AlertCircle className="h-6 w-6 text-red-500" />;
    } else if (importProgress.isComplete) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    } else {
      return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => isImporting && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Importando Conteúdo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!hasStarted ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Você está prestes a importar o seguinte conteúdo:
              </p>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{item.item_data.name || item.item_data.title}</span>
                        <span className="text-muted-foreground capitalize">{item.item_type}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Importante:</strong> O conteúdo será copiado de forma independente para sua conta. 
                  Isso pode levar alguns minutos dependendo do tamanho dos arquivos.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleStartImport} className="flex-1">
                  Iniciar Importação
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {importProgress && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progresso da Importação</span>
                      <span>{Math.round(getProgressPercentage())}%</span>
                    </div>
                    <Progress value={getProgressPercentage()} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">{importProgress.currentStep}</p>
                    <p className="text-xs text-muted-foreground">
                      Passo {importProgress.currentStepNumber} de {importProgress.totalSteps}
                    </p>
                  </div>

                  {importProgress.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">
                        <strong>Erro:</strong> {importProgress.error}
                      </p>
                    </div>
                  )}

                  {importProgress.isComplete && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        ✅ Importação concluída com sucesso! O conteúdo está agora disponível em sua conta.
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end">
                <Button 
                  onClick={handleClose} 
                  disabled={isImporting}
                  variant={importProgress?.isComplete ? "default" : "outline"}
                >
                  {importProgress?.isComplete ? "Concluir" : "Fechar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};