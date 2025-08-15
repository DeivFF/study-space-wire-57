
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, BookOpen, Eye, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabaseAnnotations } from '@/hooks/useSupabaseAnnotations';
import QuestionForm from './QuestionForm';
import QuestionWizard from './QuestionWizard';

interface DocumentDisplay {
  id: string;
  title: string;
  url: string;
  filePath: string;
}

interface DocumentViewerProps {
  document: DocumentDisplay;
  onBack: () => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

const DocumentViewer = ({ document, onBack }: DocumentViewerProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showQuestionWizard, setShowQuestionWizard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [documentContent, setDocumentContent] = useState<string>('');

  const { carregarQuestoes } = useSupabaseAnnotations();

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      const questoes = await carregarQuestoes(document.id);
      setQuestions(questoes);
      
      // Simular extração de texto do PDF para demonstração
      // Em produção, isso seria feito via OCR ou extração real de PDF
      setDocumentContent(`Conteúdo do documento: ${document.title}. Este é um exemplo de texto extraído do PDF para demonstrar a funcionalidade de revisão inteligente.`);
      
      setLoading(false);
    };

    loadQuestions();
  }, [document.id, document.title, carregarQuestoes]);

  const handleQuestionCreated = async () => {
    const questoes = await carregarQuestoes(document.id);
    setQuestions(questoes);
    setShowQuestionForm(false);
  };

  if (showQuestionForm) {
    return (
      <QuestionForm
        documentId={document.id}
        documentTitle={document.title}
        onBack={() => setShowQuestionForm(false)}
        onQuestionCreated={handleQuestionCreated}
      />
    );
  }

  if (showQuestionWizard) {
    return (
      <QuestionWizard
        questions={questions}
        documentTitle={document.title}
        onBack={() => setShowQuestionWizard(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
          <p className="text-gray-600">Documento PDF</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visualizador de PDF */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Documento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96 border rounded-lg overflow-hidden">
                <iframe
                  src={document.url}
                  className="w-full h-full"
                  title={document.title}
                />
              </div>
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={() => window.open(document.url, '_blank')}
                  variant="outline"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Abrir em Nova Aba
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel de Questões */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Questões</span>
                <Button
                  onClick={() => setShowQuestionForm(true)}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500 text-center py-4">Carregando questões...</p>
              ) : questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma questão criada</p>
                  <p className="text-sm">Clique em "Nova" para adicionar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">
                      {questions.length} questões disponíveis
                    </span>
                    <div className="flex gap-2">
                      {questions.length > 0 && (
                        <Button
                          onClick={() => setShowQuestionWizard(true)}
                          size="sm"
                          className="bg-success hover:bg-success-dark"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Exercícios
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <h4 className="font-medium text-sm mb-2">
                        Questão {index + 1}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {question.question}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {question.options.length} alternativas
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
