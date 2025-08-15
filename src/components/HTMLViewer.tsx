import { useState, useEffect } from 'react';
import { X, ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface HTMLViewerProps {
  htmlUrl: string;
  fileName: string;
  onClose: () => void;
}

const HTMLViewer = ({ htmlUrl, fileName, onClose }: HTMLViewerProps) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHtmlContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(htmlUrl);
        if (!response.ok) {
          throw new Error('Não foi possível carregar o arquivo HTML');
        }
        
        const content = await response.text();
        setHtmlContent(content);
      } catch (err) {
        console.error('Erro ao carregar HTML:', err);
        setError('Erro ao carregar o arquivo HTML');
        toast({
          title: "Erro",
          description: "Não foi possível carregar o arquivo HTML",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHtmlContent();
  }, [htmlUrl, toast]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando arquivo HTML...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <FileText className="w-5 h-5 mr-2" />
              Erro ao carregar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={onClose} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <div>
              <h1 className="font-semibold text-foreground">{fileName}</h1>
              <p className="text-sm text-muted-foreground">Documento HTML</p>
            </div>
          </div>
        </div>
        
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* HTML Content */}
      <div className="flex-1 p-4">
        <div className="h-full border rounded-lg overflow-hidden bg-white">
          <iframe
            srcDoc={htmlContent}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title={`HTML Viewer - ${fileName}`}
            style={{ 
              minHeight: '100%',
              backgroundColor: 'white'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default HTMLViewer;