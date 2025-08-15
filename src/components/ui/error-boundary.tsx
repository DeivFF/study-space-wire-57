import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger, isDevelopment } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.forceError('Uncaught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <CardTitle className="text-xl">Ops! Algo deu errado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center">
                Ocorreu um erro inesperado. Você pode tentar recarregar a página ou reportar o problema.
              </p>
              
              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="outline" className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="flex-1"
                >
                  Recarregar Página
                </Button>
              </div>

              {this.state.error && isDevelopment && (
                <details className="mt-4 p-2 bg-muted rounded text-xs">
                  <summary className="cursor-pointer font-medium">
                    Detalhes do erro (desenvolvimento)
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}