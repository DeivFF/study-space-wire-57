
import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseAnnotations } from '@/hooks/useSupabaseAnnotations';

interface DocumentForm {
  title: string;
  file: File | null;
}

interface GerenciarDocumentosProps {
  categoryId: string;
  categoryName: string;
  onClose: () => void;
}

const GerenciarDocumentos = ({ categoryId, categoryName, onClose }: GerenciarDocumentosProps) => {
  const [documents, setDocuments] = useState<DocumentForm[]>([
    { title: '', file: null }
  ]);
  const [uploading, setUploading] = useState(false);
  
  const { uploadDocument } = useSupabaseAnnotations();

  const addDocumentForm = () => {
    setDocuments([...documents, { title: '', file: null }]);
  };

  const removeDocumentForm = (index: number) => {
    if (documents.length > 1) {
      setDocuments(documents.filter((_, i) => i !== index));
    }
  };

  const updateDocument = (index: number, field: keyof DocumentForm, value: string | File | null) => {
    setDocuments(prev => prev.map((doc, i) => 
      i === index ? { ...doc, [field]: value } : doc
    ));
  };

  const handleFileSelect = (index: number, file: File | null) => {
    if (file) {
      // Validar tipo de arquivo
      if (file.type !== 'application/pdf') {
        alert('Apenas arquivos PDF são suportados.');
        return;
      }
    }
    updateDocument(index, 'file', file);
  };

  const handleSave = async () => {
    const validDocuments = documents.filter(doc => 
      doc.title.trim() && doc.file
    );
    
    if (validDocuments.length === 0) {
      alert('Adicione pelo menos um documento válido');
      return;
    }

    setUploading(true);
    
    try {
      // Upload cada documento para o Supabase
      for (const doc of validDocuments) {
        await uploadDocument(
          categoryId,
          doc.title,
          doc.file!
        );
      }
      
      // Limpar formulário e voltar
      setDocuments([{ title: '', file: null }]);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar documentos:', error);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button onClick={onClose} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Documentos</h1>
          <p className="text-gray-600">{categoryName}</p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Documentos PDF:</strong> Faça upload de documentos PDF para criar suas anotações e questões vinculadas.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Adicionar Documentos</span>
            <Button onClick={addDocumentForm} size="sm" disabled={uploading}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Campo
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {documents.map((document, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Documento {index + 1}</h3>
                {documents.length > 1 && (
                  <Button
                    onClick={() => removeDocumentForm(index)}
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`title-${index}`}>Título do Documento</Label>
                  <Input
                    id={`title-${index}`}
                    placeholder="Ex: Resumo de Matemática - Capítulo 1"
                    value={document.title}
                    onChange={(e) => updateDocument(index, 'title', e.target.value)}
                    disabled={uploading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`file-${index}`}>Arquivo PDF</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id={`file-${index}`}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => handleFileSelect(index, e.target.files?.[0] || null)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                      disabled={uploading}
                    />
                  </div>
                  {document.file && (
                    <div className="space-y-1">
                      <p className="text-xs text-green-600">
                        ✓ {document.file.name} ({formatFileSize(document.file.size)})
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Apenas arquivos PDF são suportados.
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button onClick={onClose} variant="outline" disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={uploading}>
              {uploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Documentos
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• <strong>Título:</strong> Use nomes descritivos como "Resumo - Capítulo 1"</p>
          <p>• <strong>Arquivo:</strong> Selecione documentos PDF do seu computador</p>
          <p>• <strong>Visualização:</strong> Após o upload, você poderá visualizar e criar questões</p>
          <p>• <strong>Questões:</strong> Vincule exercícios aos documentos para praticar o conteúdo</p>
          <p>• Os documentos serão salvos permanentemente e sincronizados entre dispositivos</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GerenciarDocumentos;
