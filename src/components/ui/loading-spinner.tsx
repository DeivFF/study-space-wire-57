import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8', 
  lg: 'h-12 w-12'
};

export const LoadingSpinner = ({ className, size = 'md' }: LoadingSpinnerProps) => {
  return (
    <div className={cn(
      'animate-spin rounded-full border-2 border-gray-300 border-t-primary',
      sizeClasses[size],
      className
    )} />
  );
};

export const LoadingCard = ({ children, className }: { children?: React.ReactNode; className?: string }) => {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="text-center">
        <LoadingSpinner className="mx-auto mb-4" />
        <p className="text-muted-foreground">
          {children || 'Carregando...'}
        </p>
      </div>
    </div>
  );
};

export const LoadingPage = ({ message }: { message?: string }) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">
          {message || 'Carregando aplicação...'}
        </p>
      </div>
    </div>
  );
};