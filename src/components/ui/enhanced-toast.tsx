import { toast as sonnerToast } from 'sonner';
import { CheckCircle, XCircle, AlertTriangle, Info, Upload, Download, Clock, FileText } from 'lucide-react';

interface ToastOptions {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ProgressToastOptions extends ToastOptions {
  progress: number;
  filename?: string;
}

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
      icon: <CheckCircle className="w-5 h-5" />,
    }),
    
  error: (message: string, options?: ToastOptions) =>
    sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action,
      icon: <XCircle className="w-5 h-5" />,
    }),
    
  warning: (message: string, options?: ToastOptions) =>
    sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
      icon: <AlertTriangle className="w-5 h-5" />,
    }),
    
  info: (message: string, options?: ToastOptions) =>
    sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
      icon: <Info className="w-5 h-5" />,
    }),

  loading: (message: string, options?: ToastOptions) =>
    sonnerToast.loading(message, {
      description: options?.description,
      icon: <Clock className="w-5 h-5 animate-spin" />,
    }),

  upload: (options: ProgressToastOptions) => {
    const { progress, filename, title, description } = options;
    return sonnerToast.loading(title || `Enviando ${filename}...`, {
      description: description || `${progress}% concluído`,
      icon: <Upload className="w-5 h-5" />,
    });
  },
    
  download: (filename: string, options?: ToastOptions) =>
    sonnerToast.success('Download iniciado', {
      description: options?.description || filename,
      duration: 3000,
      icon: <Download className="w-5 h-5" />,
    }),

  flashcard: {
    sessionStarted: (count: number) =>
      sonnerToast.success('Sessão de estudo iniciada!', {
        description: `${count} flashcards para revisar`,
        icon: <FileText className="w-5 h-5" />,
      }),

    sessionCompleted: (stats: { correct: number; total: number; accuracy: number }) =>
      sonnerToast.success('Sessão concluída! 🎉', {
        description: `${stats.correct}/${stats.total} corretos (${stats.accuracy.toFixed(0)}% de acerto)`,
        duration: 5000,
        icon: <CheckCircle className="w-5 h-5" />,
      }),

    cardReviewed: (quality: number) => {
      const messages = {
        0: { text: 'Vamos continuar praticando!', icon: '😅' },
        1: { text: 'Quase lá!', icon: '🤔' },
        2: { text: 'Precisa revisar mais', icon: '😐' },
        3: { text: 'Bom trabalho!', icon: '😊' },
        4: { text: 'Muito bom!', icon: '😄' },
        5: { text: 'Perfeito!', icon: '🎯' }
      };

      const message = messages[quality as keyof typeof messages];
      sonnerToast.success(`${message.icon} ${message.text}`, {
        duration: 2000,
      });
    },
  },

  exercise: {
    correct: () =>
      sonnerToast.success('Resposta correta! ✅', {
        duration: 3000,
        icon: <CheckCircle className="w-5 h-5" />,
      }),

    incorrect: (explanation?: string) =>
      sonnerToast.error('Resposta incorreta ❌', {
        description: explanation || 'Revise o conteúdo e tente novamente',
        duration: 4000,
        icon: <XCircle className="w-5 h-5" />,
      }),

    submitted: () =>
      sonnerToast.success('Resposta enviada!', {
        description: 'Exercício concluído com sucesso',
        duration: 3000,
        icon: <FileText className="w-5 h-5" />,
      }),
  },

  file: {
    uploaded: (count: number) => {
      const message = count === 1 ? 'Arquivo enviado' : `${count} arquivos enviados`;
      sonnerToast.success(message, {
        description: 'Upload concluído com sucesso',
        duration: 3000,
        icon: <Upload className="w-5 h-5" />,
      });
    },

    deleted: (filename: string) =>
      sonnerToast.success('Arquivo removido', {
        description: filename,
        duration: 3000,
        icon: <XCircle className="w-5 h-5" />,
      }),

    markedPrimary: (filename: string) =>
      sonnerToast.success('Arquivo marcado como principal', {
        description: filename,
        duration: 3000,
        icon: <FileText className="w-5 h-5" />,
      }),

    uploadError: (error: string) =>
      sonnerToast.error('Erro no upload', {
        description: error,
        duration: 5000,
        icon: <XCircle className="w-5 h-5" />,
      }),
  },

  note: {
    created: () =>
      sonnerToast.success('Anotação criada', {
        duration: 3000,
        icon: <FileText className="w-5 h-5" />,
      }),

    updated: () =>
      sonnerToast.success('Anotação salva', {
        duration: 2000,
        icon: <CheckCircle className="w-5 h-5" />,
      }),

    deleted: () =>
      sonnerToast.success('Anotação removida', {
        duration: 3000,
        icon: <XCircle className="w-5 h-5" />,
      }),

    autoSaved: () =>
      sonnerToast.success('Rascunho salvo automaticamente', {
        duration: 2000,
        icon: <CheckCircle className="w-5 h-5" />,
      }),
  },

  // Custom toast for complex actions
  custom: (content: React.ReactNode, options?: { duration?: number }) =>
    sonnerToast.custom((t) => (
      <div className="flex items-center gap-3 p-3 bg-app-bg border border-app-border rounded-lg shadow-lg">
        {content}
      </div>
    ), {
      duration: options?.duration || 4000,
    }),

  // Batch operations
  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) =>
    sonnerToast.promise(promise, {
      loading,
      success,
      error,
    }),

  // Dismiss all toasts
  dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
};