
import { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabaseLessonDocuments } from '@/hooks/useSupabaseLessonDocuments';

interface LessonDocumentUploadProps {
  lessonId: string;
  lessonTitle: string;
  onBack: () => void;
  onUploadComplete: () => void;
}

const LessonDocumentUpload = ({ lessonId, lessonTitle, onBack, onUploadComplete }: LessonDocumentUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');

  const { uploadDocument, loading } = useSupabaseLessonDocuments();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace('.pdf', ''));
      }
    } else {
      alert('Por favor, selecione apenas arquivos PDF');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      alert('Selecione um arquivo PDF e digite um título');
      return;
    }

    try {
      const result = await uploadDocument(lessonId, selectedFile);
      if (result) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button onClick={onBack} variant="outline">
          <X className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Adicionar Material</h1>
          <p className="text-gray-600">{lessonTitle}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <Label htmlFor="title">Título do Material</Label>
            <Input
              id="title"
              placeholder="Digite o título do material"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="file">Arquivo PDF</Label>
            <div className="mt-2">
              <input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                disabled={loading}
                className="hidden"
              />
              <Button
                onClick={() => document.getElementById('file')?.click()}
                variant="outline"
                disabled={loading}
                className="w-full h-32 border-dashed border-2 border-gray-300 hover:border-gray-400"
              >
                <div className="text-center">
                  {selectedFile ? (
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <span className="text-sm">{selectedFile.name}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <div className="text-sm text-gray-600">
                        Clique para selecionar um arquivo PDF
                      </div>
                    </div>
                  )}
                </div>
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button onClick={onBack} variant="outline" disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={loading || !selectedFile}>
              {loading ? 'Enviando...' : 'Enviar Material'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonDocumentUpload;
