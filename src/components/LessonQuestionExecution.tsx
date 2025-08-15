
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, CheckCircle, XCircle, Clock, RotateCcw, Trophy, BookOpen, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSupabaseLessonQuestions } from '@/hooks/useSupabaseLessonQuestions';
import { useExerciseProgress } from '@/hooks/useExerciseProgress';
import { useSupabaseLessonPerformance } from '@/hooks/useSupabaseLessonPerformance';
import { useToast } from '@/hooks/use-toast';
import QuestionRatingModal from './QuestionRatingModal';

interface LessonQuestionExecutionProps {
  lessonId: string;
  lessonTitle: string;
  onBack: () => void;
}

const LessonQuestionExecution = ({ lessonId, lessonTitle, onBack }: LessonQuestionExecutionProps) => {
  const { questions, carregarQuestoes, registrarTentativa } = useSupabaseLessonQuestions();
  const { progress, isLoading: progressLoading, updateCurrentQuestion, addResult, finishExercise, resetProgress } = useExerciseProgress(lessonId);
  const { addOrUpdatePerformance } = useSupabaseLessonPerformance();
  const { toast } = useToast();
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [lessonQuestions, setLessonQuestions] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  
  const isMountedRef = useRef(true);
  const currentLessonIdRef = useRef<string | null>(null);

  // Load questions only when lessonId changes
  useEffect(() => {
    if (lessonId && lessonId !== currentLessonIdRef.current) {
      currentLessonIdRef.current = lessonId;
      carregarQuestoes(lessonId);
    }
  }, [lessonId, carregarQuestoes]);

  // Process questions and restore progress
  useEffect(() => {
    if (questions.length > 0 && lessonId && !progressLoading) {
      const filtered = questions.filter(q => q.lesson_id === lessonId);
      setLessonQuestions(filtered);
      
      // Se há progresso salvo, restaurar estado
      if (progress.currentQuestionIndex > 0 || progress.results.length > 0) {
        // Manter o progresso existente
        console.log('Progresso restaurado:', {
          currentQuestion: progress.currentQuestionIndex + 1,
          totalResults: progress.results.length,
          isFinished: progress.isFinished
        });
      } else {
        // Resetar estado local apenas se não há progresso
        setSelectedAnswer(null);
        setShowResult(false);
        setStartTime(new Date());
        setIsProcessing(false);
        setShowRatingModal(false);
      }
    }
  }, [questions, lessonId, progress, progressLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const currentQuestion = lessonQuestions[progress.currentQuestionIndex];

  const handleAnswerSubmit = useCallback(async () => {
    if (selectedAnswer === null || !currentQuestion || isProcessing) return;

    setIsProcessing(true);

    try {
      const correct = selectedAnswer === currentQuestion.correct_answer;
      
      if (isMountedRef.current) {
        setIsCorrect(correct);
        setShowResult(true);
      }

      // Registrar tentativa
      await registrarTentativa(currentQuestion.id, selectedAnswer, correct);

      // Adicionar resultado ao progresso
      addResult({
        questionId: currentQuestion.id,
        isCorrect: correct,
        selectedAnswer,
        attempts: 1
      });

      if (correct) {
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

    } catch (error) {
      console.error('Erro ao submeter resposta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar sua resposta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  }, [selectedAnswer, currentQuestion, registrarTentativa, addResult, toast, isProcessing]);

  const handleNextQuestion = useCallback(async () => {
    if (isProcessing) return;

    const nextIndex = progress.currentQuestionIndex + 1;
    
    if (nextIndex < lessonQuestions.length) {
      updateCurrentQuestion(nextIndex);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
    } else {
      // Fim do exercício - registrar desempenho automaticamente
      console.log('Finalizando exercício, registrando desempenho...', {
        results: progress.results,
        lessonId,
        lessonTitle
      });
      
      await finishExercise();
      
      // Calcular estatísticas do exercício atual
      const currentResults = progress.results || [];
      const correctAnswers = currentResults.filter(r => r.isCorrect).length;
      const incorrectAnswers = currentResults.filter(r => !r.isCorrect).length;
      
      console.log('Estatísticas calculadas:', {
        correctAnswers,
        incorrectAnswers,
        totalResults: currentResults.length
      });
      
      if (currentResults.length > 0) {
        // Registrar desempenho automaticamente
        const performanceResult = await addOrUpdatePerformance(
          lessonId,
          correctAnswers,
          incorrectAnswers,
          undefined, // incorrect_questions (pode ser expandido futuramente)
          `Exercício concluído automaticamente em ${new Date().toLocaleString('pt-BR')}`
        );
        
        console.log('Resultado do registro de desempenho:', performanceResult);
      }
    }
  }, [progress.currentQuestionIndex, progress.results, lessonQuestions.length, updateCurrentQuestion, finishExercise, isProcessing, addOrUpdatePerformance, lessonId, lessonTitle]);

  const handleResetExercise = useCallback(async () => {
    if (isProcessing) return;

    await resetProgress();
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    setIsProcessing(false);
    setShowRatingModal(false);
    setStartTime(new Date());
  }, [resetProgress, isProcessing]);

  const calculateStats = () => {
    const results = progress.results || [];
    const correctAnswers = results.filter(r => r.isCorrect).length;
    const totalQuestions = results.length;
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    let performance = 'Baixo';
    let performanceColor = 'text-red-600';
    
    if (percentage >= 80) {
      performance = 'Excelente';
      performanceColor = 'text-green-600';
    } else if (percentage >= 70) {
      performance = 'Bom';
      performanceColor = 'text-blue-600';
    } else if (percentage >= 60) {
      performance = 'Regular';
      performanceColor = 'text-yellow-600';
    }

    return {
      correctAnswers,
      totalQuestions,
      percentage,
      performance,
      performanceColor,
      grade: `${correctAnswers}/${totalQuestions}`
    };
  };

  const handleRateQuestion = () => {
    setShowRatingModal(true);
  };

  if (progressLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (lessonQuestions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exercícios</h1>
            <p className="text-gray-600">{lessonTitle}</p>
          </div>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum exercício encontrado</p>
              <p className="text-sm">Crie exercícios para esta aula primeiro</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (progress.isFinished) {
    const stats = calculateStats();
    
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exercício Concluído</h1>
            <p className="text-gray-600">{lessonTitle}</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Card de Resultado Principal */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Trophy className="w-16 h-16 text-yellow-500" />
              </div>
              <CardTitle className="text-3xl font-bold text-blue-800">
                Nota: {stats.grade}
              </CardTitle>
              <p className="text-xl text-blue-600">{stats.percentage}% de aproveitamento</p>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <Progress value={stats.percentage} className="h-4" />
                <div className={`text-lg font-semibold ${stats.performanceColor}`}>
                  Desempenho: {stats.performance}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas Detalhadas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="text-center py-6">
                <div className="text-3xl font-bold text-green-600">{stats.correctAnswers}</div>
                <div className="text-sm text-green-700">Questões Corretas</div>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="text-center py-6">
                <div className="text-3xl font-bold text-red-600">
                  {stats.totalQuestions - stats.correctAnswers}
                </div>
                <div className="text-sm text-red-700">Questões Incorretas</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="text-center py-6">
                <div className="text-3xl font-bold text-blue-600">{stats.totalQuestions}</div>
                <div className="text-sm text-blue-700">Total de Questões</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center space-x-4">
            <Button onClick={handleResetExercise} variant="outline" disabled={isProcessing}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Refazer Exercício
            </Button>
            <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700">
              Voltar à Aula
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={onBack} variant="outline">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exercícios</h1>
              <p className="text-gray-600">{lessonTitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Questão {progress.currentQuestionIndex + 1} de {lessonQuestions.length}</span>
            <span>Acertos: {progress.results.filter(r => r.isCorrect).length}/{progress.results.length}</span>
            <Button onClick={handleResetExercise} size="sm" variant="outline" disabled={isProcessing}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reiniciar
            </Button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="min-h-[500px]">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  {currentQuestion?.question}
                </CardTitle>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {Math.floor((new Date().getTime() - startTime.getTime()) / 1000)}s
                </div>
              </div>
              <Progress value={(progress.currentQuestionIndex + 1) / lessonQuestions.length * 100} className="h-2" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {currentQuestion?.options.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => !showResult && !isProcessing && setSelectedAnswer(index)}
                    disabled={showResult || isProcessing}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      showResult || isProcessing
                        ? index === currentQuestion.correct_answer
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : index === selectedAnswer && selectedAnswer !== currentQuestion.correct_answer
                          ? 'border-red-500 bg-red-50 text-red-800'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                        : selectedAnswer === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } ${isProcessing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">
                        {String.fromCharCode(65 + index)})
                      </span>
                      <span>{option}</span>
                      {showResult && index === currentQuestion.correct_answer && (
                        <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                      )}
                      {showResult && index === selectedAnswer && selectedAnswer !== currentQuestion.correct_answer && (
                        <XCircle className="w-5 h-5 text-red-600 ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {showResult && currentQuestion?.explanation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Explicação:</h4>
                  <p className="text-blue-700">{currentQuestion.explanation}</p>
                </div>
              )}

              <div className="flex justify-center space-x-3">
                {!showResult ? (
                  <Button
                    onClick={handleAnswerSubmit}
                    disabled={selectedAnswer === null || isProcessing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing ? 'Processando...' : 'Confirmar Resposta'}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleRateQuestion}
                      variant="outline"
                      disabled={isProcessing}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Avaliar Dificuldade
                    </Button>
                    <Button
                      onClick={handleNextQuestion}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {progress.currentQuestionIndex < lessonQuestions.length - 1 ? 'Próxima Questão' : 'Ver Resultado'}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center mt-4">
            <div className="flex space-x-1">
              {lessonQuestions.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === progress.currentQuestionIndex
                      ? 'bg-blue-600'
                      : index < progress.currentQuestionIndex
                      ? progress.results[index]?.isCorrect
                        ? 'bg-green-600'
                        : 'bg-red-600'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <QuestionRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        questionId={currentQuestion?.id || ''}
        questionText={currentQuestion?.question || ''}
      />
    </>
  );
};

export default LessonQuestionExecution;
