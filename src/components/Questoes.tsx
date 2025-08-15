import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, Square, ChevronLeft, ChevronRight, FileText, BookOpen, CheckCircle, XCircle, MessageSquare, Send, Star, Timer } from 'lucide-react';
import { useTimerPersistence } from '@/hooks/useTimerPersistence';
import { useGlobalTimers } from '@/hooks/useGlobalTimers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseLessons } from '@/hooks/useSupabaseLessons';
import { useSupabaseLessonQuestions } from '@/hooks/useSupabaseLessonQuestions';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useQuestionRatings } from '@/hooks/useQuestionRatings';
import { QuestionCommentsModal } from '@/components/QuestionCommentsModal';
import { useAutoLessonSelection } from '@/hooks/useAutoLessonSelection';
interface QuestionData {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  lesson_name: string;
  lesson_id: string;
  category_name: string;
  category_id: string;
  attempts: QuestionAttempt[];
}
interface QuestionAttempt {
  id: string;
  question_id: string;
  user_id: string;
  selected_answer: number;
  is_correct: boolean;
  completed_at: string;
}
interface LessonWithQuestions {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  questions: QuestionData[];
}
const Questoes = () => {
  const {
    categories,
    lessons,
    loading: loadingLessons
  } = useSupabaseLessons();
  const {
    questions: lessonQuestions,
    attempts,
    loading: loadingQuestions,
    registrarTentativa
  } = useSupabaseLessonQuestions();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("todas");
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [lessonsWithQuestions, setLessonsWithQuestions] = useState<LessonWithQuestions[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [confirmedAnswers, setConfirmedAnswers] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [newRating, setNewRating] = useState<Record<string, number>>({});
  const [questionComments, setQuestionComments] = useState<Record<string, any[]>>({});
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedQuestionForComments, setSelectedQuestionForComments] = useState<string>('');
  
  // Global timer management
  const { addActiveTimer, removeActiveTimer } = useGlobalTimers();
  
  // Obter questões da aula selecionada
  const selectedLessonQuestions = useMemo(() => {
    if (!selectedLesson) return [];
    const lesson = lessonsWithQuestions.find(l => l.id === selectedLesson);
    return lesson?.questions || [];
  }, [selectedLesson, lessonsWithQuestions]);

  // Timer persistence for selected lesson
  const { time: stopwatchTime, isRunning: isStopwatchRunning, startTimer, pauseTimer, completeTimer } = useTimerPersistence({
    key: `questoes-${selectedLesson || 'none'}`,
    studyType: 'questao',
    resourceId: selectedLesson || '',
    resourceTitle: selectedLessonQuestions.length > 0 ? selectedLessonQuestions[0].lesson_name : 'Questões',
  });
  
  const {
    addRating,
    getRatingsForQuestion,
    loading: loadingRatings
  } = useQuestionRatings();

  // Processar aulas com questões
  useEffect(() => {
    if (categories.length === 0 || lessons.length === 0 || lessonQuestions.length === 0) return;
    const processedLessons: LessonWithQuestions[] = lessons.map(lesson => {
      const category = categories.find(cat => cat.id === lesson.category_id);
      const questionsForLesson = lessonQuestions.filter(q => q.lesson_id === lesson.id);
      const questionData: QuestionData[] = questionsForLesson.map(question => {
        const questionAttempts = attempts.filter(a => a.question_id === question.id);
        return {
          id: question.id,
          question: question.question,
          options: question.options,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          lesson_name: lesson.name,
          lesson_id: lesson.id,
          category_name: category?.name || 'Sem categoria',
          category_id: lesson.category_id,
          attempts: questionAttempts
        };
      });
      return {
        id: lesson.id,
        name: lesson.name,
        category_id: lesson.category_id,
        category_name: category?.name || 'Sem categoria',
        questions: questionData
      };
    }).filter(lesson => lesson.questions.length > 0);
    setLessonsWithQuestions(processedLessons);
  }, [categories, lessons, lessonQuestions, attempts]);


  // Filtrar aulas por categoria
  const filteredLessons = useMemo(() => {
    const filtered = selectedCategoryFilter === "todas" 
      ? lessonsWithQuestions 
      : lessonsWithQuestions.filter(lesson => lesson.category_id === selectedCategoryFilter);
    
    // Sort lessons by leading number in ascending order
    return filtered.sort((a, b) => {
      const numA = parseInt(a.name.match(/^\d+/)?.[0] || '999999');
      const numB = parseInt(b.name.match(/^\d+/)?.[0] || '999999');
      
      if (numA !== numB) {
        return numA - numB;
      }
      
      // Fallback to alphabetical if no numbers or same numbers
      return a.name.localeCompare(b.name);
    });
  }, [lessonsWithQuestions, selectedCategoryFilter]);

  // Auto lesson selection
  const {
    autoSelectedLesson,
    updateLastSelectedLesson,
    getLessonProgress,
    isLessonComplete
  } = useAutoLessonSelection(lessonsWithQuestions, filteredLessons);

  // Auto-select lesson when auto selection changes
  useEffect(() => {
    if (autoSelectedLesson && !selectedLesson) {
      setSelectedLesson(autoSelectedLesson);
    }
  }, [autoSelectedLesson, selectedLesson]);

  const handleLessonSelect = (lessonId: string) => {
    setSelectedLesson(lessonId);
    updateLastSelectedLesson(lessonId);
    // Reset answers when changing lesson
    setSelectedAnswers({});
    setConfirmedAnswers({});
    setShowComments({});
    setNewComment({});
    setNewRating({});
  };
  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };
  const handleConfirmAnswer = async (questionId: string) => {
    const selectedAnswer = selectedAnswers[questionId];
    if (selectedAnswer === undefined) return;
    const question = selectedLessonQuestions.find(q => q.id === questionId);
    if (!question) return;
    const isCorrect = selectedAnswer === question.correct_answer;

    // Registrar tentativa no banco de dados
    await registrarTentativa(questionId, selectedAnswer, isCorrect);
    setConfirmedAnswers(prev => ({
      ...prev,
      [questionId]: true
    }));
  };
  const openCommentsModal = async (questionId: string) => {
    setSelectedQuestionForComments(questionId);
    setCommentsModalOpen(true);

    // Carregar comentários para este questionário
    const comments = await getRatingsForQuestion(questionId);
    setQuestionComments(prev => ({
      ...prev,
      [questionId]: comments
    }));
  };
  const toggleComments = async (questionId: string) => {
    const isOpen = !showComments[questionId];
    setShowComments(prev => ({
      ...prev,
      [questionId]: isOpen
    }));
    if (isOpen && !questionComments[questionId]) {
      // Load comments for this question
      const comments = await getRatingsForQuestion(questionId);
      setQuestionComments(prev => ({
        ...prev,
        [questionId]: comments
      }));
    }
  };
  const handleAddComment = async (questionId: string) => {
    const comment = newComment[questionId];
    const rating = newRating[questionId];
    if (!comment && !rating) return;
    const success = await addRating(questionId, rating || 3, comment);
    if (success) {
      // Reload comments
      const comments = await getRatingsForQuestion(questionId);
      setQuestionComments(prev => ({
        ...prev,
        [questionId]: comments
      }));

      // Clear form
      setNewComment(prev => ({
        ...prev,
        [questionId]: ''
      }));
      setNewRating(prev => ({
        ...prev,
        [questionId]: 0
      }));
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const getTotalQuestions = () => {
    return filteredLessons.reduce((total, lesson) => total + lesson.questions.length, 0);
  };
  const getAnsweredQuestions = () => {
    return filteredLessons.reduce((total, lesson) => total + lesson.questions.filter(q => q.attempts.length > 0).length, 0);
  };
  const getCorrectQuestions = () => {
    return filteredLessons.reduce((total, lesson) => total + lesson.questions.filter(q => q.attempts.some(a => a.is_correct)).length, 0);
  };

  // Timer functions
  const startStopwatch = () => {
    startTimer();
    if (selectedLesson) {
      addActiveTimer({
        key: `questoes-${selectedLesson}`,
        resourceTitle: selectedLessonQuestions.length > 0 ? selectedLessonQuestions[0].lesson_name : 'Questões',
        studyType: 'questao',
        startTimestamp: Date.now(),
      });
    }
  };

  const pauseStopwatch = () => {
    pauseTimer();
    if (selectedLesson) {
      removeActiveTimer(`questoes-${selectedLesson}`);
    }
  };

  const stopStopwatch = async () => {
    if (selectedLesson) {
      removeActiveTimer(`questoes-${selectedLesson}`);
    }
    await completeTimer();
  };

  const formatStopwatchTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const loading = loadingLessons || loadingQuestions;
  return <div className="flex bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Main Content */}
      <div className="flex-1">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Questões</h1>
              <p className="text-gray-600 mt-1">
                {selectedLesson ? `Questões da aula: ${lessonsWithQuestions.find(l => l.id === selectedLesson)?.name}` : 'Questões criadas nas aulas'}
              </p>
            </div>
            
            {/* Stopwatch */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white rounded-lg px-4 py-2 shadow-sm border">
                <Timer className="w-5 h-5 text-blue-600" />
                <span className="font-mono text-lg font-medium text-gray-900">
                  {formatStopwatchTime(stopwatchTime)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {!isStopwatchRunning ? (
                  <Button
                    onClick={startStopwatch}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Iniciar</span>
                  </Button>
                ) : (
                  <Button
                    onClick={pauseStopwatch}
                    size="sm"
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pausar</span>
                  </Button>
                )}
                
                {stopwatchTime > 0 && (
                  <Button
                    onClick={stopStopwatch}
                    size="sm"
                    variant="destructive"
                    className="flex items-center space-x-2"
                  >
                    <Square className="w-4 h-4" />
                    <span>Parar</span>
                  </Button>
                )}
              </div>
            </div>
          </div>


          {/* Content */}
          {loading ? <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div> : selectedLesson ?
        // Exibir questões da aula selecionada
        <div className="space-y-4">
              {selectedLessonQuestions.length === 0 ? <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma questão encontrada</h3>
                    <p className="text-gray-600">
                      Esta aula não possui questões criadas ainda.
                    </p>
                  </CardContent>
                </Card> : selectedLessonQuestions.map((question, index) => {
            const hasAttempts = question.attempts.length > 0;
            const hasCorrectAttempt = question.attempts.some(a => a.is_correct);
            const selectedAnswer = selectedAnswers[question.id];
            const isAnswerConfirmed = confirmedAnswers[question.id];
            const isCorrect = selectedAnswer === question.correct_answer;
            return <Card key={question.id}>
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-lg">Questão {index + 1}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              {isAnswerConfirmed ? isCorrect ? <Badge variant="outline" className="text-green-600 border-green-200">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Resposta correta!
                                  </Badge> : <Badge variant="outline" className="text-red-600 border-red-200">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Resposta incorreta
                                  </Badge> : hasCorrectAttempt ? <Badge variant="outline" className="text-green-600 border-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Respondida corretamente
                                </Badge> : hasAttempts ? <Badge variant="outline" className="text-red-600 border-red-200">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Respondida incorretamente
                                </Badge> : <Badge variant="outline" className="text-gray-600">
                                  Não respondida
                                </Badge>}
                              {hasAttempts && <Badge variant="secondary" className="text-xs">
                                  {question.attempts.length} tentativa{question.attempts.length > 1 ? 's' : ''}
                                </Badge>}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p className="text-gray-900 font-medium">{question.question}</p>
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => {
                      const isSelected = selectedAnswer === optionIndex;
                      const isCorrectOption = optionIndex === question.correct_answer;
                      const showResult = isAnswerConfirmed;
                      let optionClassName = "flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-gray-50";
                      if (showResult) {
                        if (isCorrectOption) {
                          optionClassName += " bg-green-50 border-green-200 text-green-800";
                        } else if (isSelected && !isCorrectOption) {
                          optionClassName += " bg-red-50 border-red-200 text-red-800";
                        } else {
                          optionClassName += " bg-gray-50 border-gray-200 cursor-not-allowed";
                        }
                      } else if (isSelected) {
                        optionClassName += " bg-blue-50 border-blue-300 text-blue-800";
                      } else {
                        optionClassName += " border-gray-200";
                      }
                      return <div key={optionIndex} className={optionClassName} onClick={() => !isAnswerConfirmed && handleAnswerSelect(question.id, optionIndex)}>
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium ${showResult ? isCorrectOption ? "bg-green-100 text-green-700" : isSelected && !isCorrectOption ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600" : isSelected ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                                    {String.fromCharCode(65 + optionIndex)}
                                  </span>
                                  <span className="flex-1">{option}</span>
                                  {showResult && isCorrectOption && <CheckCircle className="w-5 h-5 text-green-600" />}
                                  {showResult && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-red-600" />}
                                </div>;
                    })}
                          </div>
                          
                          {/* Confirm Answer Button */}
                          {selectedAnswer !== undefined && !isAnswerConfirmed && <div className="flex justify-center pt-4">
                              <Button onClick={() => handleConfirmAnswer(question.id)} className="px-8">
                                Confirmar Resposta ({String.fromCharCode(65 + selectedAnswer)})
                              </Button>
                            </div>}
                          
                          {/* Result and Explanation */}
                          {isAnswerConfirmed && <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                {isCorrect ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                                <span className="font-medium">
                                  {isCorrect ? "Parabéns! Você acertou!" : "Resposta incorreta"}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">
                                <strong>Resposta correta:</strong> {String.fromCharCode(65 + question.correct_answer)}
                              </p>
                              {question.explanation && <div className="mt-2">
                                  <p className="text-sm text-gray-700">
                                    <strong>Explicação:</strong> {question.explanation}
                                  </p>
                                </div>}
                            </div>}
                          
                          {/* Comments Section */}
                          <div className="mt-4 border-t pt-4">
                            <Button variant="ghost" size="sm" className="w-full justify-between" onClick={() => openCommentsModal(question.id)}>
                              <div className="flex items-center space-x-2">
                                <MessageSquare className="w-4 h-4" />
                                <span>
                                  {questionComments[question.id]?.length ? `Ver comentários (${questionComments[question.id].length})` : 'Adicionar comentário'}
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>;
          })}
            </div> :
        // Exibir mensagem para selecionar uma aula
        <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma aula</h3>
                <p className="text-gray-600">
                  Escolha uma aula na barra lateral direita para visualizar suas questões.
                </p>
              </CardContent>
            </Card>}
        </div>
      </div>

      {/* Right Sidebar - Filters and Lessons */}
      <div className={`bg-white border-l border-gray-200 transition-all duration-300 sticky top-0 h-screen flex flex-col ${sidebarCollapsed ? 'w-16' : 'w-80'}`}>
        {/* Toggle Button */}
        

        {!sidebarCollapsed && <>
            {/* Category Filter */}
            <div className="p-4 border-b flex-shrink-0">
              <h3 className="font-semibold text-gray-900 mb-3">Filtrar por Categoria</h3>
              <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as categorias</SelectItem>
                  {categories.map(category => <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Lessons List */}
            <div className="flex-1 overflow-hidden">
              <div className="p-4 pb-2">
                <h3 className="font-semibold text-gray-900 mb-3">Aulas</h3>
              </div>
              <div className="px-4 pb-4 h-full overflow-y-auto" style={{
            maxHeight: 'calc(100vh - 200px)'
          }}>
                <div className="space-y-2">
                  {filteredLessons.length === 0 ? <div className="text-center py-8">
                      <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Nenhuma aula com questões encontrada
                      </p>
                    </div> : filteredLessons.slice(0, 50).map(lesson => <button key={lesson.id} onClick={() => handleLessonSelect(lesson.id)} className={`border p-3 rounded-lg text-left transition-colors w-full ${selectedLesson === lesson.id ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <div className="font-medium text-sm">{lesson.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {lesson.questions.length} questões • {lesson.category_name}
                        </div>
                      </button>)}
                </div>
              </div>
            </div>
          </>}
      </div>

      {/* Comments Modal */}
      <QuestionCommentsModal open={commentsModalOpen} onOpenChange={setCommentsModalOpen} questionId={selectedQuestionForComments} questionTitle={selectedQuestionForComments ? selectedLessonQuestions.find(q => q.id === selectedQuestionForComments)?.question || '' : ''} />
    </div>;
};
export default Questoes;