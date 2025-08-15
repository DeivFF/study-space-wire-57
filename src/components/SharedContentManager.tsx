import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContentSharing } from '@/hooks/useContentSharing';
import { ImportProgressModal } from './ImportProgressModal';
import { Share2, Inbox, Send, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SharedContentManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SharedContentManager = ({ isOpen, onClose }: SharedContentManagerProps) => {
  const { 
    sharedContent, 
    receivedRequests, 
    sentRequests, 
    loading,
    respondToShareRequest,
    getSharedContentItems
  } = useContentSharing();
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRequest, setImportRequest] = useState<any>(null);

  const handlePreviewRequest = async (request: any) => {
    setSelectedRequest(request);
    setLoadingPreview(true);
    
    try {
      const items = await getSharedContentItems(request.shared_content_id);
      setPreviewItems(items);
    } catch (error) {
      console.error('Error loading preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, accept: boolean) => {
    if (accept) {
      // Show import modal for accepted requests
      const request = receivedRequests.find(r => r.id === requestId);
      if (request) {
        setImportRequest(request);
        setShowImportModal(true);
      }
    } else {
      // Direct rejection
      const req = receivedRequests.find(r => r.id === requestId);
      if (req) {
        const success = await respondToShareRequest(req, false);
        if (success) {
          setSelectedRequest(null);
          setPreviewItems([]);
        }
      }
    }
  };

  const handleImportComplete = async () => {
    if (importRequest) {
      // Mark request as accepted after successful import
      await respondToShareRequest(importRequest, true);
      setShowImportModal(false);
      setImportRequest(null);
      setSelectedRequest(null);
      setPreviewItems([]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Aceito';
      case 'rejected':
        return 'Rejeitado';
      default:
        return 'Pendente';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Gerenciar Compartilhamentos
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="received" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Recebidos ({receivedRequests.filter(r => r.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviados ({sentRequests.length})
            </TabsTrigger>
            <TabsTrigger value="my-content" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Meu Conteúdo ({sharedContent.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-4 space-y-4 max-h-96 overflow-y-auto">
            {receivedRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma solicitação recebida</p>
              </div>
            ) : (
              receivedRequests.map(request => (
                <Card key={request.id} className="cursor-pointer hover:bg-muted/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {request.shared_content?.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          De: Usuário
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <Badge variant={request.status === 'pending' ? 'default' : 'secondary'}>
                          {getStatusText(request.status)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {request.shared_content?.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {request.shared_content.description}
                      </p>
                    )}
                    {request.message && (
                      <div className="bg-muted p-2 rounded text-sm mb-3">
                        <strong>Mensagem:</strong> {request.message}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewRequest(request)}
                        >
                          Visualizar
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRespondToRequest(request.id, false)}
                            >
                              Rejeitar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRespondToRequest(request.id, true)}
                            >
                              Aceitar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-4 space-y-4 max-h-96 overflow-y-auto">
            {sentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma solicitação enviada</p>
              </div>
            ) : (
              sentRequests.map(request => (
                <Card key={request.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{request.shared_content?.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Para: Usuário
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <Badge variant={request.status === 'pending' ? 'default' : 'secondary'}>
                          {getStatusText(request.status)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="my-content" className="mt-4 space-y-4 max-h-96 overflow-y-auto">
            {sharedContent.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Você ainda não criou nenhum conteúdo compartilhado</p>
              </div>
            ) : (
              sharedContent.map(content => (
                <Card key={content.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{content.title}</h4>
                        {content.description && (
                          <p className="text-sm text-muted-foreground">{content.description}</p>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Criado em {format(new Date(content.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      <Badge variant={content.is_active ? 'default' : 'secondary'}>
                        {content.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Preview Modal */}
        {selectedRequest && (
          <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Preview: {selectedRequest.shared_content?.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {loadingPreview ? (
                  <div className="text-center py-4">Carregando preview...</div>
                ) : (
                  previewItems.map(item => (
                    <Card key={item.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{item.item_type}</Badge>
                          <span className="font-medium">{item.item_data.name || item.item_data.title}</span>
                        </div>
                        {item.item_data.description && (
                          <p className="text-sm text-muted-foreground">{item.item_data.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedRequest(null)} className="flex-1">
                  Fechar
                </Button>
                {selectedRequest.status === 'pending' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleRespondToRequest(selectedRequest.id, false)}
                      className="flex-1"
                    >
                      Rejeitar
                    </Button>
                    <Button
                      onClick={() => handleRespondToRequest(selectedRequest.id, true)}
                      className="flex-1"
                    >
                      Aceitar e Importar
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Import Progress Modal */}
        {importRequest && (
          <ImportProgressModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            sharedContentId={importRequest.shared_content_id}
            items={previewItems}
            onImportComplete={handleImportComplete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};