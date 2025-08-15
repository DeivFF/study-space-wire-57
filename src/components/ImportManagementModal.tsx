import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useImportedContentManager } from '@/hooks/useImportedContentManager';
import { Trash2, Download, Calendar, BarChart3, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ImportManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportManagementModal = ({ isOpen, onClose }: ImportManagementModalProps) => {
  const { 
    importedContent, 
    loading, 
    loadImportedContent, 
    deleteImportedContent, 
    getImportStats 
  } = useImportedContentManager();
  
  const [deletingItem, setDeletingItem] = useState<string | null>(null);

  const stats = getImportStats();

  const handleDeleteImported = async (trackingId: string, newItemId: string, itemType: string, title: string) => {
    if (!window.confirm(`Tem certeza que deseja remover "${title}" da sua conta? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setDeletingItem(trackingId);
    const success = await deleteImportedContent(trackingId, newItemId, itemType);
    setDeletingItem(null);
    
    if (success) {
      // Optionally refresh or update UI
    }
  };

  // Initialize data when modal opens
  React.useEffect(() => {
    if (isOpen) {
      loadImportedContent();
    }
  }, [isOpen, loadImportedContent]);

  // Group imported content by original shared content
  const groupedContent = importedContent.reduce((acc, item) => {
    const sharedContentId = item.original_shared_content_id;
    if (!acc[sharedContentId]) {
      acc[sharedContentId] = {
        sharedContent: item.shared_content,
        items: []
      };
    }
    acc[sharedContentId].items.push(item);
    return acc;
  }, {} as Record<string, { sharedContent: any; items: any[] }>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Gerenciar Conteúdo Importado
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="content" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Conteúdo Importado ({stats.totalImports})
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Estatísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalImports}</div>
                    <p className="text-sm text-muted-foreground">Total de Importações</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.categoriesImported}</div>
                    <p className="text-sm text-muted-foreground">Categorias</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.lessonsImported}</div>
                    <p className="text-sm text-muted-foreground">Aulas</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.recentImports}</div>
                    <p className="text-sm text-muted-foreground">Esta Semana</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumo das Importações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>• Você importou conteúdo de <strong>{Object.keys(groupedContent).length}</strong> pacotes diferentes</p>
                  <p>• O conteúdo importado é totalmente independente do original</p>
                  <p>• Você pode remover qualquer conteúdo importado sem afetar o criador original</p>
                  <p>• Todas as suas modificações são mantidas separadamente</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-4 space-y-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Carregando conteúdo importado...</p>
              </div>
            ) : Object.keys(groupedContent).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Você ainda não importou nenhum conteúdo</p>
                <p className="text-sm">Conteúdo aceito de amigos aparecerá aqui</p>
              </div>
            ) : (
              Object.entries(groupedContent).map(([sharedContentId, group]) => (
                <Card key={sharedContentId}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {group.sharedContent?.title || 'Conteúdo Compartilhado'}
                        </CardTitle>
                        {group.sharedContent?.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {group.sharedContent.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {group.items.length} {group.items.length === 1 ? 'item' : 'itens'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="capitalize">
                              {item.imported_item_type}
                            </Badge>
                            <div>
                              <p className="text-sm font-medium">Item Importado</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(item.imported_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteImported(
                              item.id, 
                              item.new_item_id, 
                              item.imported_item_type,
                              group.sharedContent?.title || 'Conteúdo'
                            )}
                            disabled={deletingItem === item.id}
                          >
                            {deletingItem === item.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};