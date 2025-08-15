
import { useState } from 'react';
import { Upload, X, FileAudio, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabaseLessonFiles } from '@/hooks/useSupabaseLessonFiles';

interface LessonFileUploadProps {
  lessonId: string;
  lessonTitle: string;
  fileType: 'audio' | 'html';
  onBack: () => void;
  onUploadComplete: () => void;
}

const LessonFileUpload = ({ lessonId, lessonTitle, fileType, onBack, onUploadComplete }: LessonFileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { loading, uploadAudioFile, uploadHtmlFile } = useSupabaseLessonFiles();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Selecione um arquivo primeiro');
      return;
    }

    try {
      let result;
      if (fileType === 'audio') {
        result = await uploadAudioFile(lessonId, selectedFile);
      } else {
        result = await uploadHtmlFile(lessonId, selectedFile);
      }

      if (result) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Erro no upload:', error);
    }
  };

  const acceptedTypes = fileType === 'audio' ? 'audio/*' : '.html';
  const title = fileType === 'audio' ? 'Adicionar Áudio' : 'Adicionar Arquivo HTML';
  const Icon = fileType === 'audio' ? FileAudio : FileText;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button onClick={onBack} variant="outline">
          <X className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600">{lessonTitle}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-center w-full">
            <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Icon className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Clique para selecionar</span> ou arraste o arquivo
                </p>
                <p className="text-xs text-gray-500">
                  {fileType === 'audio' ? 'Arquivos de áudio (MP3, WAV, etc.)' : 'Arquivos HTML'}
                </p>
              </div>
              <Input
                id="file-upload"
                type="file"
                accept={acceptedTypes}
                onChange={handleFileSelect}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>

          {selectedFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">{selectedFile.name}</p>
                  <p className="text-sm text-blue-600">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          )}

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

export default LessonFileUpload;
