import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Ops! Algo deu errado</AlertTitle>
            <AlertDescription className="mt-2">
              Ocorreu um erro inesperado. Tente recarregar a página ou entre em contato com o suporte se o problema persistir.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 space-y-2">
            <Button onClick={this.handleReset} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Recarregar Página
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 p-4 bg-gray-100 rounded-lg">
              <summary className="cursor-pointer font-medium">Detalhes do erro (desenvolvimento)</summary>
              <pre className="mt-2 text-sm text-red-600 overflow-auto">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;