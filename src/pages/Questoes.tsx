import { useState, useEffect, useCallback } from 'react';
import { QuestionFilters } from '@/components/Questions/QuestionFilters';
import { SessionSummaryModal } from '@/components/Questions/SessionSummaryModal';
import { FloatingStopButton } from '@/components/Questions/FloatingStopButton';
import { useQuestions, Question as APIQuestion, QuestionFilters as APIQuestionFilters } from '@/hooks/useQuestions';
import { useQuestionSession } from '@/hooks/useQuestionSession';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  CheckCircle2, 
  MessageCircle, 
  Clock,
  Play,
  Square,
  History,
  X,
  XCircle,
  Send,
  Filter
} from 'lucide-react';

interface Option {
  key: string;
  text: string;
}

interface Question {
  id: string;
  title: string;
  category: string;
  question: string;
  options: Option[];
  correctAnswer: string;
  explanation?: string;
  source: string;
  year: string;
  institution: string;
  subject: string;
  topic: string;
  code: string;
}

const QUESTIONS: Question[] = [
  {
    id: 'Q3548759',
    title: 'Princípios Orçamentários',
    category: 'AFO',
    question: 'Assinale a alternativa que apresenta a ideia principal contida no princípio orçamentário da exclusividade.',
    options: [
      { key: 'A', text: 'Valores brutos na LOA (sem deduções).' },
      { key: 'B', text: 'Todas as receitas e despesas na LOA, sem omissão.' },
      { key: 'C', text: 'Planejamento baseado em elementos de fácil compreensão.' },
      { key: 'D', text: 'A LOA não conterá matéria estranha à fixação de despesas e previsão de receitas.' },
      { key: 'E', text: 'Descentralização da execução das ações.' }
    ],
    correctAnswer: 'D',
    source: 'INSTITUTO AOCP',
    year: '2025',
    institution: 'INSTITUTO AOCP',
    subject: 'AFO',
    topic: 'Princípios Orçamentários',
    code: 'Q3548759'
  },
  {
    id: 'Q100200',
    title: 'Controle de constitucionalidade',
    category: 'Const.',
    question: 'No controle concentrado, a decisão com eficácia erga omnes e efeito vinculante é proferida em qual ação?',
    options: [
      { key: 'A', text: 'MS coletivo' },
      { key: 'B', text: 'ADPF' },
      { key: 'C', text: 'RExt' },
      { key: 'D', text: 'Habeas Data' },
      { key: 'E', text: 'Súmula vinculante' }
    ],
    correctAnswer: 'B',
    source: 'FGV',
    year: '2024',
    institution: 'FGV',
    subject: 'Const.',
    topic: 'Controle de constitucionalidade',
    code: 'Q100200'
  },
  {
    id: 'Q887711',
    title: 'Atos administrativos',
    category: 'Adm.',
    question: 'Anule ou revogue: a Administração pode anular seus próprios atos quando eivados de vícios?',
    options: [
      { key: 'A', text: 'Não, apenas o Judiciário pode anular.' },
      { key: 'B', text: 'Sim, com controle judicial prévio.' },
      { key: 'C', text: 'Sim, por autotutela, conforme Súmula 473/STF.' },
      { key: 'D', text: 'Somente por lei específica.' },
      { key: 'E', text: 'Apenas por sindicância.' }
    ],
    correctAnswer: 'C',
    source: 'CESPE/CEBRASPE',
    year: '2023',
    institution: 'CESPE/CEBRASPE',
    subject: 'Adm.',
    topic: 'Atos administrativos',
    code: 'Q887711'
  }
];

export default function Questoes() {
  const {
    questions: apiQuestions, 
    loading, 
    error, 
    fetchQuestions, 
    submitAnswer: apiSubmitAnswer, 
    toggleFavorite,
    pagination 
  } = useQuestions();
  
  const [showFilters, setShowFilters] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<APIQuestionFilters | null>(null);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [correctAnswers, setCorrectAnswers] = useState<Record<string, string>>({});

  // Use API questions if available, otherwise fallback to mock data
  const filteredQuestions: Question[] = apiQuestions.length > 0 ? apiQuestions.map(q => ({
    id: q.id,
    title: q.title,
    category: q.subject_area || 'Geral',
    question: q.content,
    options: q.options?.map(opt => ({
      key: opt.option_letter,
      text: opt.content
    })) || [],
    correctAnswer: q.options?.find(opt => opt.is_correct)?.option_letter || '',
    explanation: q.options?.find(opt => opt.is_correct)?.explanation,
    source: q.institution || 'Sistema',
    year: q.year?.toString() || '',
    institution: q.institution || 'Sistema',
    subject: q.subject_area || 'Geral',
    topic: q.title,
    code: q.id
  })) : QUESTIONS;

  const {
    sessionActive,
    currentQuestionIndex,
    questionTimers,
    globalTimer,
    answeredQuestions,
    startQuestion,
    submitAnswer,
    stopSession,
    getCurrentQuestionTimer,
    sessionStats
  } = useQuestionSession({ questions: filteredQuestions, mode: 'list' });

  // Helpers
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };


  // Handler para aplicação de filtros
  const handleFiltersApply = async (filters: APIQuestionFilters) => {
    setIsApplyingFilters(true);
    try {
      setCurrentFilters(filters);
      await fetchQuestions(filters);
      // Reset session data when filters change
      setSelectedAnswers({});
      setAnswers({});
      setCorrectAnswers({});
    } finally {
      setTimeout(() => setIsApplyingFilters(false), 300);
    }
  };

  // Handler para responder questão
  const handleSubmitAnswer = useCallback(async (question: Question) => {
    const selectedAnswer = selectedAnswers[question.id];
    if (!selectedAnswer) return;

    const isCorrect = selectedAnswer === question.correctAnswer;

    // Store answers for summary
    setAnswers(prev => ({ ...prev, [question.id]: selectedAnswer }));
    setCorrectAnswers(prev => ({ ...prev, [question.id]: question.correctAnswer }));

    // Submit to API if it's an API question
    if (apiQuestions.some(q => q.id === question.id)) {
      try {
        await apiSubmitAnswer(question.id, isCorrect);
      } catch (error) {
        console.error('Error submitting answer to API:', error);
      }
    }

    // Submit to session hook
    const result = await submitAnswer(question.id, selectedAnswer, isCorrect);
    
    // Check if session ended
    if (!sessionActive && answeredQuestions.size === filteredQuestions.length) {
      setShowSummary(true);
    }
  }, [selectedAnswers, submitAnswer, sessionActive, answeredQuestions.size, filteredQuestions.length, apiQuestions, apiSubmitAnswer]);

  // Handler para selecionar resposta
  const handleSelectAnswer = useCallback((questionId: string, answer: string) => {
    if (answeredQuestions.has(questionId)) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, [answeredQuestions]);

  // Load initial questions
  useEffect(() => {
    const defaultFilters: APIQuestionFilters = {
      category: 'ENEM',
      limit: 20,
      page: 1
    };
    
    const loadInitialData = async () => {
      try {
        await handleFiltersApply(defaultFilters);
      } catch (error) {
        console.error('Failed to load initial questions:', error);
      }
    };
    
    loadInitialData();
  }, []);

  const renderPrimaryButton = useCallback((question: Question, index: number) => {
    const isAnswered = answeredQuestions.has(question.id);
    const isCurrentQuestion = currentQuestionIndex === index;
    const questionTimer = questionTimers[question.id] || 0;
    
    if (isAnswered) {
      return (
        <Button
          disabled
          variant="secondary"
          size="sm"
          className="min-w-[100px]"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Respondida
        </Button>
      );
    }

    if (sessionActive) {
      return (
        <Button
          disabled
          variant="outline"
          size="sm"
          className="min-w-[100px] opacity-50"
        >
          <Clock className="h-4 w-4 mr-2" />
          {isCurrentQuestion ? 'Em andamento' : 'Aguardando'}
        </Button>
      );
    }

    return (
      <Button
        onClick={() => startQuestion(index)}
        variant="outline"
        size="sm"
        className="min-w-[100px]"
      >
        <Play className="h-4 w-4 mr-2" />
        Iniciar
      </Button>
    );
  }, [answeredQuestions, currentQuestionIndex, questionTimers, sessionActive, startQuestion, stopSession]);

  const renderAnswerButton = useCallback((question: Question, index: number) => {
    const isAnswered = answeredQuestions.has(question.id);
    const userAnswer = answers[question.id];
    const isCurrentQuestion = currentQuestionIndex === index;
    
    if (isAnswered) {
      const isCorrect = userAnswer === question.correctAnswer;
      return (
        <Button
          disabled
          variant={isCorrect ? "default" : "destructive"}
          size="sm"
          className="min-w-[100px]"
        >
          {isCorrect ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Correta
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 mr-2" />
              Incorreta
            </>
          )}
        </Button>
      );
    }

    const hasSelectedAnswer = selectedAnswers[question.id];
    const canAnswer = !sessionActive || isCurrentQuestion;
    
    return (
      <Button
        onClick={() => handleSubmitAnswer(question)}
        disabled={!hasSelectedAnswer || !canAnswer}
        variant="default"
        size="sm"
        className="min-w-[100px]"
      >
        <Send className="h-4 w-4 mr-2" />
        Responder
      </Button>
    );
  }, [answeredQuestions, answers, currentQuestionIndex, selectedAnswers, sessionActive, handleSubmitAnswer]);

  // Se o histórico está sendo exibido, renderizar apenas ele
  if (showHistory) {
    return (
      <div className="min-h-screen bg-app-bg p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Histórico</h1>
            <Button onClick={() => setShowHistory(false)}>
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </div>
          <div className="text-center text-muted-foreground">
            Histórico de questões em desenvolvimento...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="flex-1 bg-background">
        {/* Header com botões de controle */}
        <div className="bg-card border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Questões</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>

          {/* Filtros */}
          {showFilters && (
            <div className="mb-4">
              <QuestionFilters onFiltersApply={handleFiltersApply} />
            </div>
          )}
        </div>

        {/* Main Content */}
        <main className="container max-w-4xl mx-auto p-4">
          <div className={`grid gap-4 ${showComments ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {/* Questions Section */}
            <section className={showComments ? 'lg:col-span-2' : 'col-span-1'}>
              {/* Questões */}
              <div className="space-y-4">
                {(loading || isApplyingFilters) ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">
                      {isApplyingFilters ? 'Aplicando filtros...' : 'Carregando questões...'}
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <div className="text-destructive">Erro: {error}</div>
                  </div>
                ) : (
                  filteredQuestions.map((question, idx) => (
                    <Card key={question.id} id={`question-${question.id}`} className="relative" data-testid="question-card">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <h3 className="text-lg font-semibold">Questão {idx + 1} — {question.title}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {question.institution} • {question.year}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">{question.subject}</Badge>
                              <Badge variant="secondary" className="text-xs">{question.code}</Badge>
                            </div>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-mono ${
                            getCurrentQuestionTimer(question.id) ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' : 'bg-muted'
                          }`} data-testid="question-timer">
                            <Clock className="h-4 w-4" />
                            <span className="font-semibold">{formatTime(questionTimers[question.id] || 0)}</span>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <p className="text-lg mb-4">{question.question}</p>
                        
                        {/* Alternativas */}
                        <div className="space-y-3 mb-4">
                          {question.options.map((option) => {
                            const isSelected = selectedAnswers[question.id] === option.key;
                            const isAnswered = answeredQuestions.has(question.id);
                            const isCorrect = option.key === question.correctAnswer;
                            const isWrong = isAnswered && selectedAnswers[question.id] === option.key && !isCorrect;
                            
                            return (
                              <label
                                key={option.key}
                                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                  isAnswered
                                    ? isCorrect
                                      ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                      : isWrong
                                      ? 'border-red-500 bg-red-50 dark:bg-red-950'
                                      : 'border-border bg-muted'
                                    : isSelected
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                    : 'border-border hover:bg-muted'
                                }`}
                                onClick={() => handleSelectAnswer(question.id, option.key)}
                              >
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  className="sr-only"
                                  checked={isSelected}
                                  readOnly
                                />
                                <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-semibold text-sm ${
                                  isAnswered
                                    ? isCorrect
                                      ? 'border-green-500 bg-green-100 dark:bg-green-900'
                                      : isWrong
                                      ? 'border-red-500 bg-red-100 dark:bg-red-900'
                                      : 'border-border bg-background'
                                    : isSelected
                                    ? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
                                    : 'border-border bg-background'
                                }`}>
                                  {option.key}
                                </div>
                                <span className="flex-1">{option.text}</span>
                              </label>
                            );
                          })}
                        </div>
                        
                        {/* Botões */}
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center gap-2">
                            {renderPrimaryButton(question, idx)}
                            {renderAnswerButton(question, idx)}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            title="Comentários"
                            onClick={() => setShowComments(!showComments)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </section>

            {/* Comments Panel */}
            {showComments && (
              <aside className="lg:col-span-1">
                <Card className="h-fit">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        <h2 className="text-lg font-semibold">Comentários de alunos</h2>
                      </div>
                      <Badge variant="secondary" className="text-xs">Demonstração</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                          A
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">Ana Paula</span>
                            <span className="text-xs text-muted-foreground">• há 2 dias</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Exclusividade ≠ universalidade. Atenção na AOCP.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </aside>
            )}
          </div>
        </main>

        {/* Floating Stop Button */}
        <FloatingStopButton 
          sessionActive={sessionActive}
          onStop={() => {
            stopSession();
            setShowSummary(true);
          }}
        />

        {/* Summary Modal */}
        <SessionSummaryModal
          isOpen={showSummary}
          onClose={() => setShowSummary(false)}
          sessionTime={globalTimer}
          questions={filteredQuestions}
          answeredQuestions={Array.from(answeredQuestions)}
          questionTimers={questionTimers}
          answers={answers}
          correctAnswers={correctAnswers}
          onNewSession={() => {
            setSelectedAnswers({});
            setAnswers({});
            setCorrectAnswers({});
            setShowSummary(false);
          }}
        />
      </div>
    </div>
  );
}