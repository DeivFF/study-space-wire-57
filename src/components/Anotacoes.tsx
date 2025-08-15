
import { useState } from 'react';
import { FileText, Plus, ChevronDown, ChevronRight, Settings, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import GerenciarDocumentos from './GerenciarDocumentos';
import DocumentViewer from './DocumentViewer';
import { useSupabaseAnnotations } from '@/hooks/useSupabaseAnnotations';

interface DocumentDisplay {
  id: string;
  title: string;
  url: string;
  filePath: string;
}

interface AnnotationCategoryDisplay {
  id: string;
  name: string;
  documents: DocumentDisplay[];
  expanded: boolean;
}

const Anotacoes = () => {
  const [selectedDocument, setSelectedDocument] = useState<DocumentDisplay | null>(null);
  const [showManageDocuments, setShowManageDocuments] = useState(false);
  const [managingCategory, setManagingCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { 
    categories, 
    documents, 
    loading,
    criarCategoria,
    deletarDocumento,
    obterUrlDocumento
  } = useSupabaseAnnotations();

  // Converter dados do Supabase para o formato do componente
  const displayCategories: AnnotationCategoryDisplay[] = categories.map(category => ({
    id: category.id,
    name: category.name,
    documents: documents
      .filter(doc => doc.category_id === category.id)
      .map(doc => ({
        id: doc.id,
        title: doc.title,
        url: obterUrlDocumento(doc.file_path),
        filePath: doc.file_path
      })),
    expanded: expandedCategories[category.id] || false
  }));

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleDocumentSelect = (document: DocumentDisplay) => {
    setSelectedDocument(document);
  };

  const openManageDocuments = (categoryId: string) => {
    setManagingCategory(categoryId);
    setShowManageDocuments(true);
  };

  const handleCreateCategory = async () => {
    if (newCategoryName.trim()) {
      await criarCategoria(newCategoryName.trim());
      setNewCategoryName('');
      setShowCreateCategory(false);
    }
  };

  const handleDeleteDocument = async (documentId: string, filePath: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      await deletarDocumento(documentId, filePath);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando anotações...</div>
      </div>
    );
  }

  if (showManageDocuments && managingCategory) {
    return (
      <GerenciarDocumentos
        categoryId={managingCategory}
        categoryName={categories.find(cat => cat.id === managingCategory)?.name || ''}
        onClose={() => {
          setShowManageDocuments(false);
          setManagingCategory(null);
        }}
      />
    );
  }

  if (selectedDocument) {
    return (
      <DocumentViewer
        document={selectedDocument}
        onBack={() => setSelectedDocument(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Anotações</h1>
        <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Categoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="categoryName">Nome da Categoria</Label>
                <Input
                  id="categoryName"
                  placeholder="Ex: Matemática, Português, etc."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateCategory(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
                  Criar Categoria
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {displayCategories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma categoria criada ainda</p>
                <p className="text-sm">Clique em "Nova Categoria" para começar</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          displayCategories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="flex items-center space-x-2 text-left hover:text-blue-600 transition-colors"
                    >
                      {category.expanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {category.documents.length} documentos
                    </span>
                    <Button
                      onClick={() => openManageDocuments(category.id)}
                      size="sm"
                      variant="outline"
                      className="h-8"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Gerenciar
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {category.expanded && (
                <CardContent className="pt-0">
                  {category.documents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum documento adicionado ainda</p>
                      <p className="text-sm">Clique em "Gerenciar" para adicionar documentos</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {category.documents.map((document) => (
                        <div
                          key={document.id}
                          className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors group"
                        >
                          <div className="flex-shrink-0">
                            <FileText className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {document.title}
                            </h4>
                            <p className="text-sm text-gray-500">PDF</p>
                          </div>
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              onClick={() => handleDocumentSelect(document)}
                              size="sm"
                              variant="outline"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Visualizar
                            </Button>
                            <Button
                              onClick={(e) => handleDeleteDocument(document.id, document.filePath, e)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Anotacoes;
