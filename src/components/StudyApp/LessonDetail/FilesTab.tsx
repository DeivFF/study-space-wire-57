import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Paperclip, Eye, Download, FileText, Headphones, 
  Image as ImageIcon, Trash2, Star, Check, X, Filter, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useFiles } from '@/hooks/useFiles';
import { FileUploadLoader, LoadingSpinner } from '@/components/ui/advanced-loading';
import { toast } from '@/components/ui/enhanced-toast';
import { cn } from '@/lib/utils';

interface FilesTabProps {
  lessonId: string;
}

const fileTypeIcons = {
  pdf: FileText,
  audio: Headphones,
  image: ImageIcon,
};

const fileTypeLabels = {
  pdf: 'PDF',
  audio: 'Áudio',
  image: 'Imagem',
};

export const FilesTab = ({ lessonId }: FilesTabProps) => {
  const [filter, setFilter] = useState<'all' | 'pdf' | 'audio' | 'image'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const {
    files,
    isLoading,
    uploadFiles,
    deleteFile,
    markAsPrimary,
    markAsStudied,
    downloadFile,
    isUploading,
    uploadProgress,
  } = useFiles(lessonId);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadFiles(acceptedFiles);
    }
  }, [uploadFiles]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'audio/*': ['.mp3', '.m4a', '.wav', '.ogg'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024, // 50MB
    noClick: true, // Disable click on dropzone area
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(rejection => {
        const errors = rejection.errors.map(e => e.message).join(', ');
        toast.error(`Arquivo rejeitado: ${rejection.file.name}`, {
          description: errors,
        });
      });
    },
  });

  const filteredFiles = files.filter(file => {
    const matchesFilter = filter === 'all' || file.type === filter;
    const matchesSearch = searchTerm === '' || 
      file.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDelete = (fileId: string, fileName: string) => {
    setDeleteConfirm({ id: fileId, name: fileName });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteFile(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full bg-app-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        data-testid="file-upload-area"
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive 
            ? "border-app-accent bg-app-accent/10 scale-105" 
            : "border-app-border bg-app-bg hover:border-app-accent/50 hover:bg-app-accent/5",
          isUploading && "pointer-events-none opacity-50"
        )}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        
        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <LoadingSpinner size="lg" text="Enviando arquivos..." />
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <FileUploadLoader 
                  key={fileName} 
                  progress={progress} 
                  fileName={fileName.split('-')[0]} 
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <Upload className={cn(
                "w-12 h-12 transition-colors",
                isDragActive ? "text-app-accent" : "text-app-text-muted"
              )} />
              <div className="space-y-2">
                <div className={cn(
                  "text-lg font-medium transition-colors",
                  isDragActive ? "text-app-accent" : "text-app-text"
                )}>
                  {isDragActive 
                    ? "Solte os arquivos aqui..." 
                    : "Arraste e solte arquivos aqui"}
                </div>
                <div className="text-app-text-muted">
                  ou
                </div>
              </div>
              <Button 
                variant="outline" 
                disabled={isUploading}
                onClick={open}
                className="text-app-text border-app-border hover:bg-app-muted"
              >
                <Paperclip className="w-4 h-4 mr-2" />
                Selecionar arquivos
              </Button>
              <div className="text-xs text-app-text-muted">
                Suporte: PDF, MP3, M4A, WAV, PNG, JPG (máx. 50MB)
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-app-text">
            Arquivos anexados
          </h3>
          <Badge variant="outline" className="text-app-text-muted">
            {filteredFiles.length} {filteredFiles.length === 1 ? 'item' : 'itens'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-muted" />
            <Input
              placeholder="Buscar arquivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-48 bg-app-bg border-app-border text-app-text"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="text-app-text border-app-border hover:bg-app-muted"
              >
                <Filter className="w-4 h-4 mr-2" />
                {filter === 'all' ? 'Todos' : fileTypeLabels[filter]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-app-bg border-app-border">
              <DropdownMenuItem 
                onClick={() => setFilter('all')}
                className="text-app-text hover:bg-app-muted"
              >
                Todos os tipos
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFilter('pdf')}
                className="text-app-text hover:bg-app-muted"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDFs
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFilter('audio')}
                className="text-app-text hover:bg-app-muted"
              >
                <Headphones className="w-4 h-4 mr-2" />
                Áudios
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFilter('image')}
                className="text-app-text hover:bg-app-muted"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Imagens
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Files List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredFiles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 text-app-text-muted"
            >
              {files.length === 0 
                ? 'Nenhum arquivo anexado ainda'
                : 'Nenhum arquivo encontrado com os filtros aplicados'}
            </motion.div>
          ) : (
            filteredFiles.map((file, index) => {
              const Icon = fileTypeIcons[file.type as keyof typeof fileTypeIcons] || FileText;
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 border border-app-border rounded-xl bg-app-bg hover:bg-app-bg-soft transition-colors"
                >
                  <Icon className="w-8 h-8 text-app-text flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-app-text truncate">
                        {file.name}
                      </h4>
                      {file.primary && (
                        <Badge className="bg-app-accent/20 text-app-accent border-app-accent/30 text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Principal
                        </Badge>
                      )}
                      {file.studied && (
                        <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Estudado
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-app-text-muted">
                      <span>{file.size}</span>
                      {file.duration && <span>{file.duration}</span>}
                      <span>Enviado em {new Date(file.uploadDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(file.id)}
                      className="text-app-text-muted hover:text-app-text hover:bg-app-muted"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(file.id)}
                      className="text-app-text-muted hover:text-app-text hover:bg-app-muted"
                    >
                      <Download className="w-4 h-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-app-text-muted hover:text-app-text hover:bg-app-muted"
                        >
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-app-bg border-app-border">
                        {!file.primary && (
                          <DropdownMenuItem
                            onClick={() => markAsPrimary(file.id)}
                            className="text-app-text hover:bg-app-muted"
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Marcar como principal
                          </DropdownMenuItem>
                        )}
                        
                         <DropdownMenuItem
                           onClick={() => markAsStudied({ fileId: file.id, studied: !file.studied })}
                           className="text-app-text hover:bg-app-muted"
                         >
                          {file.studied ? (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              Desmarcar como estudado
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Marcar como estudado
                            </>
                          )}
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={() => handleDelete(file.id, file.name)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remover arquivo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-app-bg border-app-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-app-text">
              Remover arquivo
            </AlertDialogTitle>
            <AlertDialogDescription className="text-app-text-muted">
              Tem certeza que deseja remover o arquivo "{deleteConfirm?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-app-text border-app-border hover:bg-app-muted">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};