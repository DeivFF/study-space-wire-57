
import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseAnnotations } from '@/hooks/useSupabaseAnnotations';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

interface QuestionWizardProps {
  questions: Question[];
  documentTitle: string;
  onBack: () => void;
}

interface QuestionResult {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  attempts: number;
}

const QuestionWizard = ({ questions, documentTitle, onBack }: QuestionWizardProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const { registrarTentativa } = useSupabaseAnnotations();

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  useEffect(() => {
    // Resetar estado quando mudar de questão
    setSelectedAnswer(null);
    setShowResult(false);
  }, [currentQuestionIndex]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showResult) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    // Registrar tentativa
    await registrarTentativa(currentQuestion.id, selectedAnswer, isCorrect);

    // Atualizar resultados
    const existingResultIndex = results.findIndex(r => r.questionId === currentQuestion.id);
    if (existingResultIndex >= 0) {
      setResults(prev => prev.map((result, index) => 
        index === existingResultIndex 
          ? { ...result, selectedAnswer, isCorrect, attempts: result.attempts + 1 }
          : result
      ));
    } else {
      setResults(prev => [...prev, {
        questionId: currentQuestion.id,
        selectedAnswer,
        isCorrect,
        attempts: 1
      }]);
    }

    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleRetryQuestion = () => {
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setResults([]);
    setIsFinished(false);
  };

  const getOptionClassName = (optionIndex: number) => {
    let baseClass = 'p-4 border rounded-lg cursor-pointer transition-colors flex items-center space-x-3 ';
    
    if (!showResult) {
      if (selectedAnswer === optionIndex) {
        baseClass += 'border-blue-500 bg-blue-50';
      } else {
        baseClass += 'hover:bg-gray-50';
      }
    } else {
      if (optionIndex === currentQuestion.correct_answer) {
        baseClass += 'border-green-500 bg-green-50';
      } else if (selectedAnswer === optionIndex && optionIndex !== currentQuestion.correct_answer) {
        baseClass += 'border-red-500 bg-red-50';
      } else {
        baseClass += 'opacity-50';
      }
    }
    
    return baseClass;
  };

  const getCircleClassName = (optionIndex: number) => {
    let baseClass = 'w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ';
    
    if (!showResult) {
      if (selectedAnswer === optionIndex) {
        baseClass += 'border-blue-500 bg-blue-500 text-white';
      } else {
        baseClass += 'border-gray-300';
      }
    } else {
      if (optionIndex === currentQuestion.correct_answer) {
        baseClass += 'border-green-500 bg-green-500 text-white';
      } else if (selectedAnswer === optionIndex && optionIndex !== currentQuestion.correct_answer) {
        baseClass += 'border-red-500 bg-red-500 text-white';
      } else {
        baseClass += 'border-gray-300';
      }
    }
    
    return baseClass;
  };

  if (isFinished) {
    const correctAnswers = results.filter(r => r.isCorrect).length;
    const totalQuestions = questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exercício Concluído</h1>
            <p className="text-gray-600">{documentTitle}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Resultado Final</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-4xl font-bold text-blue-600">
              {percentage}%
            </div>
            <div className="text-lg">
              {correctAnswers} de {totalQuestions} questões corretas
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
                <div className="text-sm text-green-700">Corretas</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{totalQuestions - correctAnswers}</div>
                <div className="text-sm text-red-700">Incorretas</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalQuestions}</div>
                <div className="text-sm text-blue-700">Total</div>
              </div>
            </div>

            <div className="flex justify-center space-x-4 mt-8">
              <Button onClick={handleRestart} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Refazer Exercício
              </Button>
              <Button onClick={onBack}>
                Voltar ao Documento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Exercícios</h1>
          <p className="text-gray-600">{documentTitle}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Questão {currentQuestionIndex + 1} de {questions.length}
            </CardTitle>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% concluído
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-lg font-medium leading-relaxed">
              {currentQuestion.question}
            </p>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={getOptionClassName(index)}
              >
                <div className={getCircleClassName(index)}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="flex-1">{option}</span>
                {showResult && index === currentQuestion.correct_answer && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {showResult && selectedAnswer === index && index !== currentQuestion.correct_answer && (
                  <X className="w-5 h-5 text-red-600" />
                )}
              </div>
            ))}
          </div>

          {showResult && (
            <Alert className={selectedAnswer === currentQuestion.correct_answer ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className={selectedAnswer === currentQuestion.correct_answer ? 'text-green-800' : 'text-red-800'}>
                <div className="space-y-2">
                  <p className="font-medium">
                    {selectedAnswer === currentQuestion.correct_answer ? '✅ Resposta correta!' : '❌ Resposta incorreta'}
                  </p>
                  {currentQuestion.explanation && (
                    <p className="text-sm">
                      <strong>Explicação:</strong> {currentQuestion.explanation}
                    </p>
                  )}
                  {selectedAnswer !== currentQuestion.correct_answer && (
                    <p className="text-sm">
                      A resposta correta é a alternativa <strong>{String.fromCharCode(65 + currentQuestion.correct_answer)}</strong>.
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              onClick={handlePreviousQuestion}
              variant="outline"
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <div className="flex space-x-2">
              {!showResult ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                >
                  Confirmar Resposta
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleRetryQuestion}
                    variant="outline"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Button>
                  <Button onClick={handleNextQuestion}>
                    {currentQuestionIndex < questions.length - 1 ? (
                      <>
                        Próxima
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      'Finalizar'
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionWizard;
