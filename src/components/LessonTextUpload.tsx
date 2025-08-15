
import { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabaseLessonDocuments } from '@/hooks/useSupabaseLessonDocuments';

interface LessonTextUploadProps {
  lessonId: string;
  lessonTitle: string;
  onBack: () => void;
  onUploadComplete: () => void;
}

const LessonTextUpload = ({ lessonId, lessonTitle, onBack, onUploadComplete }: LessonTextUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');

  const { uploadDocument, loading } = useSupabaseLessonDocuments();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'text/plain' || file.name.endsWith('.txt') || file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.(txt|pdf)$/i, ''));
      }
    } else {
      alert('Por favor, selecione apenas arquivos TXT ou PDF');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Selecione um arquivo');
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
          <h1 className="text-2xl font-bold text-gray-900">Adicionar Arquivo</h1>
          <p className="text-gray-600">{lessonTitle}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <Label htmlFor="file">Arquivo (PDF ou TXT)</Label>
            <div className="mt-2">
              <input
                id="file"
                type="file"
                accept=".txt,.pdf,application/pdf,text/plain"
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
                      <FileText className="w-8 h-8 text-green-600" />
                      <span className="text-sm">{selectedFile.name}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <div className="text-sm text-gray-600">
                        Clique para selecionar um arquivo PDF ou TXT
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
              {loading ? 'Enviando...' : 'Enviar Arquivo'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonTextUpload;
