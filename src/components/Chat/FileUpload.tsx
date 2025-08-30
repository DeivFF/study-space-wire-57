import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, File, Image, X, Loader2 } from 'lucide-react';
import { useUploadFile } from '@/hooks/useMessages';

interface FileUploadProps {
  conversationId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  conversationId,
  isOpen,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [content, setContent] = React.useState('');
  const [uploadProgress, setUploadProgress] = React.useState(0);
  
  const uploadFile = useUploadFile(conversationId);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 25 * 1024 * 1024, // 25MB
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'application/zip': ['.zip'],
    },
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadProgress(10);
      await uploadFile.mutateAsync({ 
        file: selectedFile, 
        content: content.trim() || undefined 
      });
      setUploadProgress(100);
      
      // Reset and close
      setSelectedFile(null);
      setContent('');
      setUploadProgress(0);
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setContent('');
    setUploadProgress(0);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (file: File) => {
    return file.type.startsWith('image/');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Enviar Arquivo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedFile ? (
            // File selection area
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um arquivo ou clique para selecionar'}
              </p>
              <p className="text-sm text-muted-foreground">
                Máximo 25MB • Imagens, PDFs, documentos e arquivos ZIP
              </p>
            </div>
          ) : (
            // File preview and options
            <div className="space-y-4">
              {/* File preview */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  {isImage(selectedFile) ? (
                    <Image className="w-5 h-5 text-primary" />
                  ) : (
                    <File className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Image preview */}
              {isImage(selectedFile) && (
                <div className="relative max-w-full">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="rounded-lg max-w-full h-auto max-h-48 object-contain mx-auto"
                  />
                </div>
              )}

              {/* Optional message */}
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem (opcional)</Label>
                <Input
                  id="message"
                  placeholder="Adicione uma mensagem..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">
                  {content.length}/1000 caracteres
                </p>
              </div>

              {/* Upload progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Enviando...</span>
                    <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="flex-1"
                  disabled={uploadFile.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpload}
                  className="flex-1"
                  disabled={uploadFile.isPending}
                >
                  {uploadFile.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Upload error */}
          {uploadFile.error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              Erro ao enviar arquivo: {
                uploadFile.error instanceof Error 
                  ? uploadFile.error.message 
                  : 'Erro desconhecido'
              }
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};