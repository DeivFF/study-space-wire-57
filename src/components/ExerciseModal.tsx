
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Star, Shuffle, History, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseLessons } from '@/hooks/useSupabaseLessons';
import { useSupabaseLessonQuestions } from '@/hooks/useSupabaseLessonQuestions';
import { useAuth } from '@/hooks/useAuth';
import QuestionRatingModal from './QuestionRatingModal';

interface Exercise {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  completed: boolean;
  lesson_id?: string;
  source?: 'standalone' | 'lesson';
}

interface ExerciseModalProps {
  exercise: Exercise;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (exerciseId: string, correct: boolean) => void;
  onNextRandom?: (categoryId?: string) => void;
}

interface QuestionAttempt {
  id: string;
  selected_answer: number;
  is_correct: boolean;
  completed_at: string;
}

const ExerciseModal = React.memo(({
  exercise,
  isOpen,
  onClose,
  onComplete,
  onNextRandom,
}: ExerciseModalProps) => {
  const { user } = useAuth();
  const { lessons } = useSupabaseLessons();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [questionHistory, setQuestionHistory] = useState<QuestionAttempt[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Use ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Track current exercise ID to prevent state pollution between exercises
  const currentExerciseId = useRef<string | null>(null);

  // Get lesson info for this exercise
  const lessonInfo = useMemo(() => {
    if (exercise?.lesson_id) {
      return lessons.find(lesson => lesson.id === exercise.lesson_id);
    }
    return null;
  }, [exercise?.lesson_id, lessons]);

  // Get unique categories for random filter
  const categories = useMemo(() => {
    const uniqueCategories = new Set();
    lessons.forEach(lesson => {
      if (lesson.category_id) {
        uniqueCategories.add(lesson.category_id);
      }
    });
    return Array.from(uniqueCategories) as string[];
  }, [lessons]);

  // Load question history
  const loadQuestionHistory = useCallback(async () => {
    if (!user || !exercise?.id || exercise.source !== 'lesson') return;

    try {
      const { data, error } = await supabase
        .from('question_attempts')
        .select('*')
        .eq('question_id', exercise.id)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      
      setQuestionHistory(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  }, [user, exercise?.id, exercise?.source]);

  // Reset state only when exercise ID changes or modal opens/closes
  useEffect(() => {
    if (isOpen && exercise && exercise.id !== currentExerciseId.current) {
      currentExerciseId.current = exercise.id;
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
      setIsProcessing(false);
      setShowRatingModal(false);
      setShowHistory(false);
      loadQuestionHistory();
    }
  }, [isOpen, exercise, loadQuestionHistory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selectedAnswer === null || isProcessing || !exercise) return;
    
    setIsProcessing(true);
    
    try {
      const correct = selectedAnswer === exercise.correctAnswer;
      
      if (isMountedRef.current) {
        setIsCorrect(correct);
        setShowResult(true);
      }
      
      // Call onComplete after state is set
      await onComplete(exercise.id, correct);
      
      // Reload history after completing
      if (exercise.source === 'lesson') {
        setTimeout(() => loadQuestionHistory(), 500);
      }
    } catch (error) {
      console.error('Erro ao processar resposta:', error);
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  }, [selectedAnswer, exercise, onComplete, isProcessing, loadQuestionHistory]);

  const handleClose = useCallback(() => {
    if (isProcessing) return; // Prevent closing during processing
    
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    setIsProcessing(false);
    setShowRatingModal(false);
    setShowHistory(false);
    currentExerciseId.current = null;
    onClose();
  }, [onClose, isProcessing]);

  const handleOptionSelect = useCallback((index: number) => {
    if (!showResult && !isProcessing) {
      setSelectedAnswer(index);
    }
  }, [showResult, isProcessing]);

  const handleRateQuestion = useCallback(() => {
    setShowRatingModal(true);
  }, []);

  const handleRandomQuestion = useCallback(() => {
    if (onNextRandom) {
      onNextRandom(selectedCategory || undefined);
    }
  }, [onNextRandom, selectedCategory]);

  // Get last attempt result
  const lastAttempt = questionHistory[0];
  const totalAttempts = questionHistory.length;

  // Memoizar a renderização das opções
  const optionsElements = useMemo(() => {
    if (!exercise?.options) return [];

    return exercise.options.map((option, index) => {
      const isSelected = selectedAnswer === index;
      const isCorrectOption = showResult && index === exercise.correctAnswer;
      const isIncorrectSelected = showResult && isSelected && index !== exercise.correctAnswer;
      
      let cardClassName = 'cursor-pointer transition-colors ';
      if (isProcessing) {
        cardClassName += 'opacity-50 cursor-not-allowed ';
      } else if (isSelected && !showResult) {
        cardClassName += 'border-blue-500 bg-blue-50';
      } else if (!isSelected && !showResult) {
        cardClassName += 'hover:bg-gray-50';
      }
      
      if (isCorrectOption) {
        cardClassName += 'border-green-500 bg-green-50';
      } else if (isIncorrectSelected) {
        cardClassName += 'border-red-500 bg-red-50';
      }

      let circleClassName = 'w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ';
      if (isSelected && !showResult) {
        circleClassName += 'border-blue-500 bg-blue-500 text-white';
      } else if (!isSelected && !showResult) {
        circleClassName += 'border-gray-300';
      }
      
      if (isCorrectOption) {
        circleClassName += 'border-green-500 bg-green-500 text-white';
      }

      return (
        <Card
          key={index}
          className={cardClassName}
          onClick={() => handleOptionSelect(index)}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={circleClassName}>
                {String.fromCharCode(65 + index)}
              </div>
              <span className="flex-1">{option}</span>
              {isCorrectOption && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              {isIncorrectSelected && (
                <X className="w-5 h-5 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>
      );
    });
  }, [exercise?.options, exercise?.correctAnswer, selectedAnswer, showResult, isProcessing, handleOptionSelect]);

  // Memoizar o resultado
  const resultAlert = useMemo(() => {
    if (!showResult) return null;

    return (
      <Alert className={isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <AlertCircle className={`h-4 w-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`} />
        <AlertDescription className={isCorrect ? 'text-green-800' : 'text-red-800'}>
          <div className="space-y-2">
            <p className="font-medium">
              {isCorrect ? '✅ Resposta correta!' : '❌ Resposta incorreta'}
            </p>
            {exercise.explanation && (
              <p className="text-sm">
                <strong>Explicação:</strong> {exercise.explanation}
              </p>
            )}
            {!isCorrect && (
              <p className="text-sm">
                A resposta correta é a alternativa <strong>{String.fromCharCode(65 + exercise.correctAnswer)}</strong>.
              </p>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }, [showResult, isCorrect, exercise?.explanation, exercise?.correctAnswer]);

  // Updated actionButtons memoization to include rating functionality
  const actionButtons = useMemo(() => {
    if (!showResult) {
      return (
        <>
          <Button onClick={handleClose} variant="outline" disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedAnswer === null || isProcessing}
          >
            {isProcessing ? 'Processando...' : 'Confirmar Resposta'}
          </Button>
        </>
      );
    }
    
    return (
      <>
        <Button onClick={handleRateQuestion} variant="outline" disabled={isProcessing}>
          <Star className="w-4 h-4 mr-2" />
          Avaliar Dificuldade
        </Button>
        <Button onClick={handleClose} disabled={isProcessing}>
          Fechar
        </Button>
      </>
    );
  }, [showResult, selectedAnswer, isProcessing, handleClose, handleSubmit, handleRateQuestion]);
  if (!isOpen || !exercise) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && handleClose()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Exercício</span>
              <div className="flex items-center space-x-2">
                {exercise.completed && (
                  <span className="text-green-600 text-sm font-medium flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Concluído
                  </span>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Question Info Card */}
            {(lessonInfo || exercise.source === 'lesson') && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {lessonInfo ? lessonInfo.name : 'Questão de Aula'}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {exercise.source === 'lesson' ? 'Aula' : 'Própria'}
                        </Badge>
                      </div>
                      
                      {exercise.source === 'lesson' && (
                        <div className="flex items-center space-x-4 text-sm text-blue-700">
                          {lastAttempt && (
                            <div className="flex items-center space-x-1">
                              {lastAttempt.is_correct ? (
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              ) : (
                                <X className="w-3 h-3 text-red-600" />
                              )}
                              <span>
                                Último: {lastAttempt.is_correct ? 'Acertou' : 'Errou'}
                              </span>
                            </div>
                          )}
                          
                          {totalAttempts > 0 && (
                            <span>Total de tentativas: {totalAttempts}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {exercise.source === 'lesson' && questionHistory.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHistory(!showHistory)}
                      >
                        <History className="w-4 h-4 mr-1" />
                        Histórico
                        {showHistory ? (
                          <ChevronUp className="w-4 h-4 ml-1" />
                        ) : (
                          <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {/* History Expansion */}
                  {showHistory && questionHistory.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {questionHistory.map((attempt, index) => (
                          <div key={attempt.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              {attempt.is_correct ? (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              ) : (
                                <X className="w-3 h-3 text-red-500" />
                              )}
                              <span className={attempt.is_correct ? 'text-green-700' : 'text-red-700'}>
                                Alternativa {String.fromCharCode(65 + attempt.selected_answer)}
                              </span>
                            </div>
                            <span className="text-gray-600">
                              {new Date(attempt.completed_at).toLocaleDateString()} às{' '}
                              {new Date(attempt.completed_at).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Random Question Controls */}
            {onNextRandom && (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Próxima Questão Aleatória</h4>
                      <div className="flex items-center space-x-2">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filtrar por categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todas as categorias</SelectItem>
                            {categories.map(categoryId => {
                              const categoryLessons = lessons.filter(l => l.category_id === categoryId);
                              const categoryName = categoryLessons[0]?.name || `Categoria ${categoryId.slice(0, 8)}`;
                              return (
                                <SelectItem key={categoryId} value={categoryId}>
                                  {categoryName}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button onClick={handleRandomQuestion} variant="outline">
                      <Shuffle className="w-4 h-4 mr-2" />
                      Questão Aleatória
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pergunta */}
            <Card>
              <CardContent className="p-4">
                <p className="text-lg font-medium leading-relaxed">
                  {exercise.question}
                </p>
              </CardContent>
            </Card>

            {/* Alternativas */}
            <div className="space-y-3">
              {optionsElements}
            </div>

            {/* Resultado */}
            {resultAlert}

            {/* Botões */}
            <div className="flex justify-end space-x-2">
              {actionButtons}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <QuestionRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        questionId={exercise.id}
        questionText={exercise.question}
      />
    </>
  );
});

ExerciseModal.displayName = 'ExerciseModal';

export default ExerciseModal;
