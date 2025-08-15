
import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseLessonQuestions } from '@/hooks/useSupabaseLessonQuestions';
import { useExerciseProgress } from '@/hooks/useExerciseProgress';
import ExerciseModal from '@/components/ExerciseModal';

interface LessonQuestionWizardProps {
  lessonId: string;
  lessonTitle: string;
  onBack: () => void;
}

const LessonQuestionWizard = ({ lessonId, lessonTitle, onBack }: LessonQuestionWizardProps) => {
  const { questions, registrarTentativa, carregarQuestoes, loading } = useSupabaseLessonQuestions();
  const { progress, isLoading: progressLoading, updateCurrentQuestion, addResult, finishExercise, resetProgress } = useExerciseProgress(lessonId);
  
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  useEffect(() => {
    carregarQuestoes(lessonId);
  }, [lessonId, carregarQuestoes]);

  useEffect(() => {
    // Show modal when component loads and there are questions
    if (questions.length > 0 && !progressLoading) {
      setShowExerciseModal(true);
    }
  }, [questions.length, progressLoading]);

  const handleAnswerSubmit = async (exerciseId: string, correct: boolean) => {
    const currentQuestion = questions[progress.currentQuestionIndex];
    if (!currentQuestion) return;

    // Find the selected answer based on correct/incorrect
    // This is a simplified approach - in a real scenario, you'd pass the selected answer
    const selectedAnswer = correct ? currentQuestion.correct_answer : (currentQuestion.correct_answer + 1) % currentQuestion.options.length;
    
    // Register attempt
    await registrarTentativa(currentQuestion.id, selectedAnswer, correct);

    // Add result to progress
    addResult({
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect: correct,
      attempts: 1
    });
  };

  const handleNextQuestion = () => {
    const nextIndex = progress.currentQuestionIndex + 1;
    
    if (nextIndex < questions.length) {
      updateCurrentQuestion(nextIndex);
    } else {
      finishExercise();
      setShowExerciseModal(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (progress.currentQuestionIndex > 0) {
      updateCurrentQuestion(progress.currentQuestionIndex - 1);
    }
  };

  const handleRestart = async () => {
    await resetProgress();
    setShowExerciseModal(true);
  };

  const handleRandomQuestion = (categoryId?: string) => {
    // Filter questions by category if provided
    let availableQuestions = questions;
    if (categoryId) {
      // For lesson questions, we don't have direct category filtering
      // This would need to be implemented based on your lesson categorization
      availableQuestions = questions;
    }
    
    if (availableQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      updateCurrentQuestion(randomIndex);
    }
  };

  const currentQuestion = questions[progress.currentQuestionIndex];

  // Convert current question to Exercise format
  const currentExercise = currentQuestion ? {
    id: currentQuestion.id,
    question: currentQuestion.question,
    options: currentQuestion.options,
    correctAnswer: currentQuestion.correct_answer,
    explanation: currentQuestion.explanation,
    completed: false,
    lesson_id: currentQuestion.lesson_id,
    source: 'lesson' as const
  } : null;

  if (loading || progressLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exercícios</h1>
            <p className="text-gray-600">{lessonTitle}</p>
          </div>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <CheckCircle className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum exercício encontrado</h3>
              <p>Esta aula ainda não possui exercícios. Crie alguns exercícios primeiro.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (progress.isFinished) {
    const correctAnswers = progress.results.filter(r => r.isCorrect).length;
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
            <p className="text-gray-600">{lessonTitle}</p>
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
                Voltar à Aula
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
          <p className="text-gray-600">{lessonTitle}</p>
        </div>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Questão {progress.currentQuestionIndex + 1} de {questions.length}
            </CardTitle>
            <span className="text-sm text-gray-500">
              {Math.round(((progress.currentQuestionIndex + 1) / questions.length) * 100)}% concluído
            </span>
          </div>
          <Progress value={((progress.currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />
        </CardHeader>
      </Card>

      {/* Exercise Modal */}
      {currentExercise && (
        <ExerciseModal
          exercise={currentExercise}
          isOpen={showExerciseModal}
          onClose={() => {
            setShowExerciseModal(false);
            onBack();
          }}
          onComplete={handleAnswerSubmit}
          onNextRandom={handleRandomQuestion}
        />
      )}

      {/* Navigation Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <Button
              onClick={handlePreviousQuestion}
              variant="outline"
              disabled={progress.currentQuestionIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <div className="flex space-x-2">
              <Button onClick={handleNextQuestion}>
                {progress.currentQuestionIndex < questions.length - 1 ? (
                  <>
                    Próxima
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  'Finalizar'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LessonQuestionWizard;
