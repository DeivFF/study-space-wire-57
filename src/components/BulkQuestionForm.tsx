
import { useState } from 'react';
import { Plus, X, Save, Copy, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseLessonQuestions } from '@/hooks/useSupabaseLessonQuestions';

interface BulkQuestionFormProps {
  lessonId: string;
  lessonTitle: string;
  onBack: () => void;
  onQuestionsCreated: () => void;
}

interface QuestionData {
  enunciado: string;
  alternativas: Array<{
    letra: string;
    texto: string;
  }>;
  resposta_correta: string;
  explicacao: string;
}

const BulkQuestionForm = ({ lessonId, lessonTitle, onBack, onQuestionsCreated }: BulkQuestionFormProps) => {
  const { criarQuestao, loading } = useSupabaseLessonQuestions();
  const { toast } = useToast();
  const [questionsText, setQuestionsText] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const exampleFormat = `Gere as questões a seguir no formato JSON conforme abaixo:

{
  "enunciado": "Qual é a capital do Brasil?",
  "alternativas": [
    {"letra": "a", "texto": "São Paulo"},
    {"letra": "b", "texto": "Rio de Janeiro"},
    {"letra": "c", "texto": "Brasília"},
    {"letra": "d", "texto": "Salvador"},
    {"letra": "e", "texto": "Belo Horizonte"}
  ],
  "resposta_correta": "c",
  "explicacao": "Brasília é a capital federal do Brasil desde 1960."
}

Para múltiplas questões, use um array: [questão1, questão2, ...]`;

  const handleCopyFormat = async () => {
    try {
      await navigator.clipboard.writeText(exampleFormat);
      toast({
        title: "Copiado!",
        description: "Formato da questão copiado para a área de transferência."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o formato.",
        variant: "destructive"
      });
    }
  };

  const parseQuestions = (text: string): QuestionData[] => {
    const questions: QuestionData[] = [];
    const errors: string[] = [];
    
    if (!text.trim()) {
      errors.push('Texto vazio. Por favor, insira o JSON das questões.');
      setParseErrors(errors);
      return questions;
    }
    
    try {
      // Tentar fazer parse do JSON
      const jsonData = JSON.parse(text);
      
      // Se é um array de questões
      if (Array.isArray(jsonData)) {
        jsonData.forEach((question, index) => {
          try {
            validateQuestion(question, index);
            questions.push(question);
          } catch (error) {
            errors.push(`Questão ${index + 1}: ${error}`);
          }
        });
      } 
      // Se é uma única questão
      else if (typeof jsonData === 'object' && jsonData !== null) {
        try {
          validateQuestion(jsonData, 0);
          questions.push(jsonData);
        } catch (error) {
          errors.push(`Questão: ${error}`);
        }
      } else {
        errors.push('Formato inválido. Deve ser um objeto JSON ou array de objetos.');
      }
    } catch (parseError) {
      errors.push('JSON inválido. Verifique a sintaxe.');
    }
    
    setParseErrors(errors);
    return questions;
  };

  const validateQuestion = (question: any, index: number) => {
    if (!question || typeof question !== 'object') {
      throw new Error('Questão deve ser um objeto válido');
    }

    if (!question.enunciado || typeof question.enunciado !== 'string') {
      throw new Error('Campo "enunciado" é obrigatório e deve ser string');
    }
    
    if (!Array.isArray(question.alternativas) || question.alternativas.length < 2) {
      throw new Error('Campo "alternativas" deve ser um array com pelo menos 2 itens');
    }
    
    question.alternativas.forEach((alt: any, altIndex: number) => {
      if (!alt || typeof alt !== 'object') {
        throw new Error(`Alternativa ${altIndex + 1} deve ser um objeto`);
      }
      if (!alt.letra || !alt.texto) {
        throw new Error(`Alternativa ${altIndex + 1} deve ter "letra" e "texto"`);
      }
    });
    
    if (!question.resposta_correta || typeof question.resposta_correta !== 'string') {
      throw new Error('Campo "resposta_correta" é obrigatório');
    }
    
    // Verificar se a resposta correta existe nas alternativas
    const respostaExiste = question.alternativas.some((alt: any) => alt.letra === question.resposta_correta);
    if (!respostaExiste) {
      throw new Error('A resposta correta deve corresponder a uma das letras das alternativas');
    }
  };

  const handleSubmit = async () => {
    if (!questionsText.trim()) {
      setParseErrors(['Por favor, insira o JSON das questões']);
      return;
    }

    const questions = parseQuestions(questionsText);
    
    if (parseErrors.length > 0) {
      return; // Não prosseguir se há erros
    }
    
    if (questions.length === 0) {
      setParseErrors(['Nenhuma questão válida encontrada']);
      return;
    }

    let successCount = 0;
    
    for (const question of questions) {
      try {
        // Converter alternativas para array de strings
        const options = question.alternativas.map(alt => `${alt.letra}) ${alt.texto}`);
        
        // Encontrar índice da resposta correta
        const correctIndex = question.alternativas.findIndex(alt => alt.letra === question.resposta_correta);
        
        const success = await criarQuestao(
          lessonId,
          question.enunciado,
          options,
          correctIndex,
          question.explicacao
        );
        
        if (success) successCount++;
      } catch (error) {
        console.error('Erro ao criar questão:', error);
        setParseErrors(prev => [...prev, `Erro ao salvar questão: ${error}`]);
      }
    }

    if (successCount > 0) {
      onQuestionsCreated();
    }
  };

  // Função para detectar questões sem renderizar
  const getQuestionCount = (text: string): number => {
    if (!text.trim()) return 0;
    
    try {
      const jsonData = JSON.parse(text);
      if (Array.isArray(jsonData)) {
        return jsonData.length;
      } else if (typeof jsonData === 'object' && jsonData !== null) {
        return 1;
      }
    } catch {
      // Ignorar erros de parse para contagem
    }
    
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Adicionar Múltiplos Exercícios</h2>
            <p className="text-green-100">{lessonTitle}</p>
          </div>
          <Button onClick={onBack} variant="outline" className="text-green-600 border-white hover:bg-white">
            <X className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="questions-text">Questões em formato JSON</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-1 hover:bg-muted/50 hover:text-foreground transition-colors">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-md">
                    <div className="space-y-2">
                      <p className="font-medium">Formato da questão:</p>
                      <div className="bg-muted p-2 rounded text-xs font-mono whitespace-pre-wrap">
                        {exampleFormat}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCopyFormat}
                        className="w-full"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar formato
                      </Button>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Objeto JSON ou array de objetos. Clique no ícone de ajuda para ver o formato completo.
            </p>
            <Textarea
              id="questions-text"
              value={questionsText}
              onChange={(e) => {
                setQuestionsText(e.target.value);
                // Limpar erros quando o usuário começar a digitar
                if (parseErrors.length > 0) {
                  setParseErrors([]);
                }
              }}
              placeholder={`Exemplo de uma questão:
{
  "enunciado": "Qual é a capital do Brasil?",
  "alternativas": [
    {"letra": "a", "texto": "São Paulo"},
    {"letra": "b", "texto": "Rio de Janeiro"},
    {"letra": "c", "texto": "Brasília"},
    {"letra": "d", "texto": "Salvador"},
    {"letra": "e", "texto": "Belo Horizonte"}
  ],
  "resposta_correta": "c",
  "explicacao": "Brasília é a capital federal do Brasil desde 1960."
}

Para múltiplas questões, use um array: [questão1, questão2, ...]`}
              rows={20}
              className="font-mono text-sm"
            />
          </div>

          {/* Contador de questões */}
          {questionsText.trim() && parseErrors.length === 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Questões detectadas: {getQuestionCount(questionsText)}
              </p>
            </div>
          )}

          {/* Exibir erros de parsing */}
          {parseErrors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-medium text-red-800 mb-2">Erros encontrados:</h4>
              <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                {parseErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Botão de submit */}
          <div className="flex gap-4">
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !questionsText.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : 'Processar Questões'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkQuestionForm;
