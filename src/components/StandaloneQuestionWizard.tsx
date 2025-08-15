import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseQuestoes } from '@/hooks/useSupabaseQuestoes';
import { useSupabaseLessons } from '@/hooks/useSupabaseLessons';
import { useSupabaseLessonQuestions } from '@/hooks/useSupabaseLessonQuestions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import QuestionHistoryCard from './QuestionHistoryCard';
import RandomQuestionSelector from './RandomQuestionSelector';

interface Questao {
  id: string;
  enunciado: string;
  alternativas: string[];
  resposta_correta: number;
  explicacao: string;
  materia: string;
  assunto: string;
  banca: string;
  ano: number;
  dificuldade: 'facil' | 'medio' | 'dificil';
}

interface StandaloneQuestionWizardProps {
  questions: Questao[];
  onBack: () => void;
}

interface QuestionResult {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  attempts: number;
}

interface QuestionAttempt {
  id: string;
  selected_answer: number;
  is_correct: boolean;
  completed_at: string;
}

const StandaloneQuestionWizard = ({ questions, onBack }: StandaloneQuestionWizardProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [questionAttempts, setQuestionAttempts] = useState<QuestionAttempt[]>([]);
  const [lessonInfo, setLessonInfo] = useState<{ name: string; categoryName: string } | null>(null);

  const { atualizarQuestao } = useSupabaseQuestoes();
  const { lessons } = useSupabaseLessons();
  const { questions: lessonQuestions } = useSupabaseLessonQuestions();
  const { user } = useAuth();
  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const loadQuestionAttempts = useCallback(async () => {
    if (!user || !currentQuestion) return;

    try {
      // Try to load from lesson questions attempts first
      const { data: lessonAttempts, error: lessonError } = await supabase
        .from('question_attempts')
        .select('*')
        .eq('question_id', currentQuestion.id)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (!lessonError && lessonAttempts) {
        setQuestionAttempts(lessonAttempts);
        return;
      }

      // If not found, try standalone question attempts
      const { data: standaloneAttempts, error: standaloneError } = await supabase
        .from('questao_tentativas')
        .select('*')
        .eq('questao_id', currentQuestion.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!standaloneError && standaloneAttempts) {
        // Convert to question_attempts format
        const convertedAttempts = standaloneAttempts.map(attempt => ({
          id: attempt.id,
          selected_answer: attempt.resposta_selecionada,
          is_correct: attempt.acertou,
          completed_at: attempt.created_at
        }));
        setQuestionAttempts(convertedAttempts);
      }
    } catch (error) {
      console.error('Error loading question attempts:', error);
    }
  }, [user, currentQuestion]);

  const loadLessonInfo = useCallback(async () => {
    if (!currentQuestion) return;

    // Try to find this question in lesson questions
    const lessonQuestion = lessonQuestions.find(q => q.id === currentQuestion.id);
    if (lessonQuestion) {
      const lesson = lessons.find(l => l.id === lessonQuestion.lesson_id);
      if (lesson) {
        setLessonInfo({
          name: lesson.name,
          categoryName: lesson.category_id // You might want to resolve category name here
        });
        return;
      }
    }

    setLessonInfo(null);
  }, [currentQuestion, lessonQuestions, lessons]);

  // Load question attempts and lesson info
  useEffect(() => {
    if (currentQuestion && user) {
      loadQuestionAttempts();
      loadLessonInfo();
    }
  }, [currentQuestion, user, loadQuestionAttempts, loadLessonInfo]);

  const getCategories = () => {
    const uniqueCategories = new Set();
    lessons.forEach(lesson => {
      if (lesson.category_id) {
        uniqueCategories.add({
          id: lesson.category_id,
          name: lesson.name // You might want to resolve actual category names
        });
      }
    });
    return Array.from(uniqueCategories) as Array<{ id: string; name: string }>;
  };

  const handleRandomQuestion = (categoryId?: string) => {
    let availableQuestions = questions;
    
    if (categoryId) {
      // Filter questions by category through lesson association
      const categoryLessonIds = lessons
        .filter(lesson => lesson.category_id === categoryId)
        .map(lesson => lesson.id);
      
      const categoryQuestionIds = lessonQuestions
        .filter(q => categoryLessonIds.includes(q.lesson_id))
        .map(q => q.id);
      
      availableQuestions = questions.filter(q => categoryQuestionIds.includes(q.id));
    }
    
    if (availableQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const selectedQuestion = availableQuestions[randomIndex];
      const newIndex = questions.findIndex(q => q.id === selectedQuestion.id);
      if (newIndex !== -1) {
        setCurrentQuestionIndex(newIndex);
      }
    }
  };

  useEffect(() => {
    // Resetar estado quando mudar de questão
    setSelectedAnswer(null);
    setShowResult(false);
  }, [currentQuestionIndex]);

  const registrarTentativa = async (questaoId: string, respostaSelecionada: number, acertou: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('questao_tentativas')
        .insert([{
          user_id: user.id,
          questao_id: questaoId,
          resposta_selecionada: respostaSelecionada,
          acertou,
          tempo_gasto: 30 // placeholder - você pode implementar timer real depois
        }]);

      if (error) {
        console.error('Erro ao registrar tentativa:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro ao registrar tentativa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar sua tentativa",
        variant: "destructive"
      });
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showResult) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.resposta_correta;
    
    // Registrar tentativa na tabela questao_tentativas (que agora dispara o trigger para estatisticas_estudo)
    await registrarTentativa(currentQuestion.id, selectedAnswer, isCorrect);

    // Atualizar questão no banco
    await atualizarQuestao(currentQuestion.id, {
      respondida: true,
      acertou: isCorrect,
      tempo_resposta: 30 // placeholder
    });

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

    // Reload attempts after submitting
    setTimeout(() => loadQuestionAttempts(), 500);

    // Mostrar toast de feedback
    if (isCorrect) {
      toast({
        title: "Correto! ✅",
        description: "Parabéns, você acertou!"
      });
    } else {
      toast({
        title: "Incorreto ❌",
        description: "Continue praticando!"
      });
    }
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
      if (optionIndex === currentQuestion.resposta_correta) {
        baseClass += 'border-green-500 bg-green-50';
      } else if (selectedAnswer === optionIndex && optionIndex !== currentQuestion.resposta_correta) {
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
      if (optionIndex === currentQuestion.resposta_correta) {
        baseClass += 'border-green-500 bg-green-500 text-white';
      } else if (selectedAnswer === optionIndex && optionIndex !== currentQuestion.resposta_correta) {
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
            <p className="text-gray-600">Resultado do exercício</p>
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
                Voltar às Questões
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lastAttempt = questionAttempts[0];
  const lastAttemptResult = lastAttempt ? (lastAttempt.is_correct ? 'correct' : 'incorrect') : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exercícios</h1>
          <p className="text-gray-600">{currentQuestion.materia} - {currentQuestion.assunto}</p>
        </div>
      </div>

      {/* Question Info Card */}
      <QuestionHistoryCard
        questionId={currentQuestion.id}
        lessonName={lessonInfo?.name}
        categoryName={lessonInfo?.categoryName}
        lastAttemptResult={lastAttemptResult}
        totalAttempts={questionAttempts.length}
        attempts={questionAttempts}
      />

      {/* Random Question Selector */}
      <RandomQuestionSelector
        categories={getCategories()}
        onRandomQuestion={handleRandomQuestion}
      />

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
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <span>{currentQuestion.banca} - {currentQuestion.ano}</span>
            <span className={`px-2 py-1 rounded text-xs ${
              currentQuestion.dificuldade === 'facil' ? 'bg-green-100 text-green-800' :
              currentQuestion.dificuldade === 'medio' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentQuestion.dificuldade === 'facil' ? 'Fácil' :
               currentQuestion.dificuldade === 'medio' ? 'Médio' : 'Difícil'}
            </span>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-lg font-medium leading-relaxed">
              {currentQuestion.enunciado}
            </p>
          </div>

          <div className="space-y-3">
            {currentQuestion.alternativas.map((alternativa, index) => (
              <div
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={getOptionClassName(index)}
              >
                <div className={getCircleClassName(index)}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="flex-1">{alternativa}</span>
                {showResult && index === currentQuestion.resposta_correta && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {showResult && selectedAnswer === index && index !== currentQuestion.resposta_correta && (
                  <X className="w-5 h-5 text-red-600" />
                )}
              </div>
            ))}
          </div>

          {showResult && (
            <Alert className={selectedAnswer === currentQuestion.resposta_correta ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className={selectedAnswer === currentQuestion.resposta_correta ? 'text-green-800' : 'text-red-800'}>
                <div className="space-y-2">
                  <p className="font-medium">
                    {selectedAnswer === currentQuestion.resposta_correta ? '✅ Resposta correta!' : '❌ Resposta incorreta'}
                  </p>
                  {currentQuestion.explicacao && (
                    <p className="text-sm">
                      <strong>Explicação:</strong> {currentQuestion.explicacao}
                    </p>
                  )}
                  {selectedAnswer !== currentQuestion.resposta_correta && (
                    <p className="text-sm">
                      A resposta correta é a alternativa <strong>{String.fromCharCode(65 + currentQuestion.resposta_correta)}</strong>.
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

export default StandaloneQuestionWizard;
