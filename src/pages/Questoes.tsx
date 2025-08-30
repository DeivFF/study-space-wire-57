
import { useState, useEffect, useCallback, useRef } from 'react';
import { QuestionFilters } from '@/components/Questions/QuestionFilters';
import { useQuestions, Question as APIQuestion, QuestionFilters as APIQuestionFilters } from '@/hooks/useQuestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SidebarProvider } from '@/components/ui/sidebar';
import { LeftSidebar } from '@/components/LeftSidebar';
import { 
  Moon,
  Sun,
  HelpCircle, 
  CheckCircle2, 
  MessageCircle, 
  BarChart3, 
  Clock,
  Play,
  Square,
  History,
  RotateCcw,
  X
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

const QUESTIONS = [
  {
    id: 'Q3548759',
    banca: 'INSTITUTO AOCP',
    ano: 2025,
    area: 'AFO',
    tema: 'Princípios Orçamentários',
    enunciado: 'Assinale a alternativa que apresenta a ideia principal contida no princípio orçamentário da exclusividade.',
    alternativas: {
      A: 'Valores brutos na LOA (sem deduções).',
      B: 'Todas as receitas e despesas na LOA, sem omissão.',
      C: 'Planejamento baseado em elementos de fácil compreensão.',
      D: 'A LOA não conterá matéria estranha à fixação de despesas e previsão de receitas.',
      E: 'Descentralização da execução das ações.'
    },
    correta: 'D'
  },
  {
    id: 'Q100200',
    banca: 'FGV',
    ano: 2024,
    area: 'Const.',
    tema: 'Controle de constitucionalidade',
    enunciado: 'No controle concentrado, a decisão com eficácia erga omnes e efeito vinculante é proferida em qual ação?',
    alternativas: {
      A: 'MS coletivo',
      B: 'ADPF',
      C: 'RExt',
      D: 'Habeas Data',
      E: 'Súmula vinculante'
    },
    correta: 'B'
  },
  {
    id: 'Q887711',
    banca: 'CESPE/CEBRASPE',
    ano: 2023,
    area: 'Adm.',
    tema: 'Atos administrativos',
    enunciado: 'Anule ou revogue: a Administração pode anular seus próprios atos quando eivados de vícios?',
    alternativas: {
      A: 'Não, apenas o Judiciário pode anular.',
      B: 'Sim, com controle judicial prévio.',
      C: 'Sim, por autotutela, conforme Súmula 473/STF.',
      D: 'Somente por lei específica.',
      E: 'Apenas por sindicância.'
    },
    correta: 'C'
  }
];


// Hook para tema
const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return { theme, toggleTheme };
};

export default function Questoes() {
  const { theme, toggleTheme } = useTheme();
  const { 
    questions: apiQuestions, 
    loading, 
    error, 
    fetchQuestions, 
    submitAnswer: apiSubmitAnswer, 
    toggleFavorite,
    pagination 
  } = useQuestions();
  
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(-1);
  const [globalMs, setGlobalMs] = useState(0);
  const [questionTimers, setQuestionTimers] = useState(() => 
    QUESTIONS.map(() => ({ ms: 0, isRunning: false }))
  );
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, string>>(new Map());
  const [results, setResults] = useState(() => 
    QUESTIONS.map(() => ({ answered: false, correct: false }))
  );
  const [showSummary, setShowSummary] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<APIQuestionFilters | null>(null);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  const globalTimerRef = useRef<NodeJS.Timeout>();
  const questionTimerRefs = useRef<NodeJS.Timeout[]>([]);

  // Use API questions if available, otherwise fallback to mock data
  const questionsToShow = apiQuestions.length > 0 ? apiQuestions.map(q => ({
    id: q.id,
    banca: q.institution || 'Sistema',
    ano: q.year,
    area: q.subject_area || 'Geral',
    tema: q.title,
    enunciado: q.content,
    alternativas: q.options?.reduce((acc, opt) => {
      acc[opt.option_letter] = opt.content;
      return acc;
    }, {} as Record<string, string>) || {},
    correta: q.options?.find(opt => opt.is_correct)?.option_letter || ''
  })) : QUESTIONS;


  // Helpers
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = String(Math.floor(s / 60)).padStart(2, '0');
    const r = String(s % 60).padStart(2, '0');
    return `${m}:${r}`;
  };

  // Cronômetro global
  useEffect(() => {
    if (sessionStarted) {
      globalTimerRef.current = setInterval(() => {
        setGlobalMs(prev => prev + 1000);
      }, 1000);
    } else {
      clearInterval(globalTimerRef.current);
    }

    return () => clearInterval(globalTimerRef.current);
  }, [sessionStarted]);

  // Cronômetros das questões
  useEffect(() => {
    const timers = questionTimerRefs.current;
    questionTimers.forEach((timer, idx) => {
      if (timer.isRunning) {
        timers[idx] = setInterval(() => {
          setQuestionTimers(prev => prev.map((t, i) => 
            i === idx ? { ...t, ms: t.ms + 1000 } : t
          ));
        }, 1000);
      } else {
        clearInterval(timers[idx]);
      }
    });

    return () => timers.forEach(clearInterval);
  }, [questionTimers]);

  const startSession = () => {
    setSessionStarted(true);
    const firstUnanswered = nextUnanswered(0);
    if (firstUnanswered !== -1) {
      startQuestion(firstUnanswered);
    }
  };

  const stopSession = () => {
    setSessionStarted(false);
    setQuestionTimers(prev => prev.map(t => ({ ...t, isRunning: false })));
    setCurrentQuestionIdx(-1);
    setShowSummary(true);
  };

  const startQuestion = (idx: number) => {
    if (currentQuestionIdx !== -1) {
      setQuestionTimers(prev => prev.map((t, i) => 
        i === currentQuestionIdx ? { ...t, isRunning: false } : t
      ));
    }
    
    setCurrentQuestionIdx(idx);
    setQuestionTimers(prev => prev.map((t, i) => 
      i === idx ? { ...t, isRunning: true } : t
    ));
  };

  const selectAnswer = (questionIdx: number, alternative: string) => {
    if (results[questionIdx]?.answered) return;
    setSelectedAnswers(prev => new Map(prev).set(questionIdx, alternative));
  };

  const submitAnswer = async (questionIdx: number) => {
    const question = questionsToShow[questionIdx];
    const selectedAnswer = selectedAnswers.get(questionIdx);
    
    if (!selectedAnswer) {
      alert('Selecione uma alternativa.');
      return;
    }

    const isCorrect = selectedAnswer === question.correta;

    // Submit to API if it's an API question
    if (apiQuestions.some(q => q.id === question.id)) {
      try {
        await apiSubmitAnswer(question.id, isCorrect);
      } catch (error) {
        console.error('Error submitting answer to API:', error);
      }
    }

    // Parar cronômetro da questão
    setQuestionTimers(prev => prev.map((t, i) => 
      i === questionIdx ? { ...t, isRunning: false } : t
    ));

    // Marcar como respondida
    setResults(prev => prev.map((r, i) => 
      i === questionIdx 
        ? { answered: true, correct: isCorrect }
        : r
    ));

    // Reset current question index
    setCurrentQuestionIdx(-1);

    // Check if all questions are answered
    const updatedResults = results.map((r, i) => 
      i === questionIdx 
        ? { answered: true, correct: isCorrect }
        : r
    );
    
    if (updatedResults.every(r => r.answered)) {
      // All questions answered, stop session and show summary
      setTimeout(() => {
        setSessionStarted(false);
        setShowSummary(true);
      }, 500);
    }
  };

  const nextUnanswered = (from: number): number => {
    for (let i = from; i < questionsToShow.length; i++) {
      if (!results[i].answered) return i;
    }
    for (let i = 0; i < from; i++) {
      if (!results[i].answered) return i;
    }
    return -1;
  };

  const renderPrimaryButton = (idx: number): JSX.Element => {
    const isAnswered = results[idx]?.answered;
    const isCurrentActive = currentQuestionIdx === idx;
    const isNextUnanswered = !sessionStarted || (sessionStarted && currentQuestionIdx === -1 && idx === nextUnanswered(0));
    const canStart = !sessionStarted || (sessionStarted && currentQuestionIdx === -1 && !isAnswered);
    
    if (isCurrentActive) {
      return (
        <Button
          onClick={() => {
            setQuestionTimers(prev => prev.map((t, i) => 
              i === idx ? { ...t, isRunning: false } : t
            ));
            setCurrentQuestionIdx(-1);
          }}
          variant="destructive"
        >
          <Square className="h-4 w-4 mr-2" />
          Parar
        </Button>
      );
    } else if (isAnswered) {
      return (
        <Button
          variant="default"
          disabled={true}
        >
          <Play className="h-4 w-4 mr-2" />
          Iniciar
        </Button>
      );
    } else if (canStart && isNextUnanswered) {
      return (
        <Button
          onClick={() => {
            if (!sessionStarted) {
              setSessionStarted(true);
            }
            startQuestion(idx);
          }}
          variant="default"
        >
          <Play className="h-4 w-4 mr-2" />
          Iniciar
        </Button>
      );
    } else {
      return (
        <Button
          variant="default"
          disabled={true}
        >
          <Square className="h-4 w-4 mr-2" />
          Parar
        </Button>
      );
    }
  };

  const resetSession = () => {
    setSessionStarted(false);
    setCurrentQuestionIdx(-1);
    setGlobalMs(0);
    setQuestionTimers(questionsToShow.map(() => ({ ms: 0, isRunning: false })));
    setSelectedAnswers(new Map());
    setResults(questionsToShow.map(() => ({ answered: false, correct: false })));
    setShowSummary(false);
  };

  // Handler para aplicação de filtros
  const handleFiltersApply = async (filters: APIQuestionFilters) => {
    setIsApplyingFilters(true);
    try {
      setCurrentFilters(filters);
      await fetchQuestions(filters);
      // Reset session data when filters change
      setSessionStarted(false);
      setCurrentQuestionIdx(-1);
      setGlobalMs(0);
      setSelectedAnswers(new Map());
      setResults([]);
    } finally {
      setTimeout(() => setIsApplyingFilters(false), 300);
    }
  };
  
  // Update timers and results when questions change
  useEffect(() => {
    if (questionsToShow.length > 0) {
      setQuestionTimers(questionsToShow.map(() => ({ ms: 0, isRunning: false })));
      setResults(questionsToShow.map(() => ({ answered: false, correct: false })));
    }
  }, [questionsToShow.length]);

  const answeredQuestions = results.filter(r => r.answered);
  const correctAnswers = answeredQuestions.filter(r => r.correct).length;
  const questionTimes = questionTimers.map(t => t.ms).filter(ms => ms > 0);
  const avgTime = questionTimes.length ? Math.round(questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length) : 0;

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

  // Se o histórico está sendo exibido, renderizar apenas ele
  if (showHistory) {
    return (
      <SidebarProvider>
        <div className="min-h-screen bg-app-bg flex w-full">
          <LeftSidebar />
          <div className="flex-1 bg-background p-4">
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
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-app-bg flex w-full">
        <LeftSidebar />
        <div className="flex-1 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-2" />
              Histórico
            </Button>
            <Button onClick={startSession} disabled={sessionStarted}>
              <Play className="h-4 w-4 mr-2" />
              Iniciar sessão
            </Button>
            <Button variant="outline" onClick={stopSession} disabled={!sessionStarted}>
              <Square className="h-4 w-4 mr-2" />
              Parar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto p-4 mt-4">
        <div className={`grid gap-4 ${showComments ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Questions Section */}
          <section className={showComments ? 'lg:col-span-2' : 'col-span-1'}>
            {/* Filtros */}
            <div className="mb-6">
              <QuestionFilters onFiltersApply={handleFiltersApply} />
            </div>

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
                questionsToShow.map((question, idx) => (
                  <Card key={question.id} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold">Questão {idx + 1} — {question.tema}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {question.banca} • {question.ano}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">{question.area}</Badge>
                            <Badge variant="secondary" className="text-xs">{question.id}</Badge>
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-mono ${
                          questionTimers[idx]?.isRunning ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' : 'bg-muted'
                        }`}>
                          <Clock className="h-4 w-4" />
                          <span className="font-semibold">{formatTime(questionTimers[idx]?.ms || 0)}</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-lg mb-4">{question.enunciado}</p>
                      
                      {/* Alternativas */}
                      <div className="space-y-3 mb-4">
                        {Object.entries(question.alternativas).map(([key, text]: [string, string]) => {
                          const isSelected = selectedAnswers.get(idx) === key;
                          const isAnswered = results[idx]?.answered;
                          const isCorrect = key === question.correta;
                          const isWrong = isAnswered && selectedAnswers.get(idx) === key && !isCorrect;
                          
                          return (
                            <label
                              key={key}
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
                              onClick={() => selectAnswer(idx, key)}
                            >
                              <input
                                type="radio"
                                name={`question-${idx}`}
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
                                {key}
                              </div>
                              <span className="flex-1">{text}</span>
                            </label>
                          );
                        })}
                      </div>
                      
                      {/* Botões */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-2">
                          {renderPrimaryButton(idx)}
                          <Button 
                            onClick={() => submitAnswer(idx)} 
                            variant="secondary"
                            disabled={currentQuestionIdx !== idx || !selectedAnswers.get(idx) || results[idx]?.answered}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Responder
                          </Button>
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

      {/* Summary Modal */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Resumo da sessão
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Tempo total</div>
                <div className="text-xl font-semibold">{formatTime(globalMs)}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Questões respondidas</div>
                <div className="text-xl font-semibold">{answeredQuestions.length}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Aproveitamento</div>
                <div className="text-xl font-semibold">
                  {answeredQuestions.length ? `${Math.round((correctAnswers / answeredQuestions.length) * 100)}%` : '—'}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Média por questão</div>
                <div className="text-xl font-semibold">{questionTimes.length ? formatTime(avgTime) : '—'}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Mais rápida</div>
                <div className="text-xl font-semibold">
                  {questionTimes.length ? formatTime(Math.min(...questionTimes)) : '—'}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Mais lenta</div>
                <div className="text-xl font-semibold">
                  {questionTimes.length ? formatTime(Math.max(...questionTimes)) : '—'}
                </div>
              </div>
            </div>

            {/* Detalhes por questão */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-sm text-muted-foreground p-2">#</th>
                    <th className="text-left text-sm text-muted-foreground p-2">Questão</th>
                    <th className="text-left text-sm text-muted-foreground p-2">Tempo</th>
                    <th className="text-left text-sm text-muted-foreground p-2">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {questionsToShow.map((question, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="text-sm text-muted-foreground p-2">{idx + 1}</td>
                      <td className="text-sm p-2">
                        {question.tema} <span className="text-muted-foreground">({question.id})</span>
                      </td>
                      <td className="text-sm p-2">
                        {questionTimers[idx]?.ms ? formatTime(questionTimers[idx].ms) : '—'}
                      </td>
                      <td className="text-sm p-2">
                        {results[idx]?.answered ? (
                          results[idx].correct ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                              ✔ correta
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                              ✖ errada
                            </Badge>
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Botões */}
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={resetSession}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Nova sessão
              </Button>
              <Button onClick={() => setShowSummary(false)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Concluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </SidebarProvider>
  );
}
