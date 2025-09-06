import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner = ({ size = 'md', text, className = '' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-app-accent`} />
      {text && (
        <span className="text-sm text-app-text-muted">{text}</span>
      )}
    </div>
  );
};

export const LessonDetailSkeleton = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-20 bg-app-muted" />
      <Skeleton className="h-6 w-48 bg-app-muted" />
      <div className="flex-1" />
      <Skeleton className="h-4 w-32 bg-app-muted" />
    </div>
    
    {/* Tabs skeleton */}
    <div className="border border-app-border rounded-xl">
      <div className="flex border-b border-app-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-24 m-1 bg-app-muted" />
        ))}
      </div>
      <div className="p-4 space-y-4">
        <Skeleton className="h-32 w-full bg-app-muted" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-app-muted" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

interface FileUploadLoaderProps {
  progress: number;
  fileName?: string;
}

export const FileUploadLoader = ({ progress, fileName }: FileUploadLoaderProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex items-center gap-3 p-3 border border-app-border rounded-xl bg-app-bg"
  >
    <div className="w-8 h-8 rounded-full border-2 border-app-accent animate-spin border-t-transparent" />
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium text-app-text mb-1 truncate">
        {fileName ? `Enviando ${fileName}...` : 'Enviando arquivo...'}
      </div>
      <div className="w-full bg-app-muted rounded-full h-2">
        <motion.div
          className="bg-app-accent h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
    <span className="text-sm text-app-text-muted font-medium">{progress}%</span>
  </motion.div>
);

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard = ({ className = '' }: SkeletonCardProps) => (
  <div className={`border border-app-border rounded-xl p-4 bg-app-bg space-y-3 ${className}`}>
    <div className="flex items-center gap-3">
      <Skeleton className="w-8 h-8 bg-app-muted" />
      <Skeleton className="h-4 w-32 bg-app-muted" />
      <div className="flex-1" />
      <Skeleton className="w-12 h-6 bg-app-muted" />
    </div>
    <Skeleton className="h-3 w-full bg-app-muted" />
    <Skeleton className="h-3 w-3/4 bg-app-muted" />
  </div>
);

interface FlashcardSkeletonProps {
  count?: number;
}

export const FlashcardSkeleton = ({ count = 1 }: FlashcardSkeletonProps) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="border border-app-border rounded-xl p-6 bg-app-bg">
        <div className="space-y-4">
          <Skeleton className="h-6 w-3/4 bg-app-muted" />
          <Skeleton className="h-4 w-full bg-app-muted" />
          <Skeleton className="h-4 w-2/3 bg-app-muted" />
          <div className="flex justify-between pt-4">
            <Skeleton className="h-8 w-16 bg-app-muted" />
            <Skeleton className="h-8 w-16 bg-app-muted" />
            <Skeleton className="h-8 w-16 bg-app-muted" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

interface PulseLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PulseLoader = ({ size = 'md', className = '' }: PulseLoaderProps) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${sizeClasses[size]} bg-app-accent rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};

export const EmptyStateLoader = () => (
  <div className="flex flex-col items-center justify-center py-12 px-6">
    <div className="w-16 h-16 mb-4 relative">
      <motion.div
        className="absolute inset-0 border-4 border-app-muted rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-2 border-4 border-app-accent border-t-transparent rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
    </div>
    <p className="text-app-text-muted text-center">Carregando conteúdo...</p>
  </div>
);