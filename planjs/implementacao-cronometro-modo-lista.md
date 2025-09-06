# Plano de Implementação: Sistema de Cronômetro para Modo Lista

## 🎯 Objetivo
Implementar funcionalidade de cronômetro no modo lista das questões, seguindo o padrão da pasta `@Questões\`, com sistema de sessão contínua, auto-avanço entre questões e modal de resumo completo.

---

## 📋 **Agente Tech Lead** - Análise e Arquitetura

### Estado Atual vs Desejado

#### ✅ Estado Atual (src/pages/Questoes.tsx)
- **Cronômetro**: Apenas no modo wizard
- **Timer States**: `currentQuestionTime`, `questionTimes`, `isTimerActive`
- **Modal**: Timer básico sem estatísticas completas
- **Fluxo**: Manual, sem auto-avanço

#### 🎯 Estado Desejado (Questões/src/App.tsx)
- **Cronômetro**: Funcional em ambos os modos (lista + wizard)
- **Sistema de Sessão**: Iniciar sessão → timer automático → responder → próxima questão automaticamente
- **Modal de Resumo**: Estatísticas completas da sessão
- **Controles**: Botão "Iniciar Sessão" e "Parar Sessão"

### Decisão Arquitetural
**Estratégia**: Expandir funcionalidade existente sem quebrar o wizard mode, adicionando gerenciamento de sessão global.

---

## 🔧 **Agente Frontend Developer** - Implementação

### 1. **Estados de Sessão Necessários**

```typescript
// Novos estados para gerenciar sessão
const [sessionActive, setSessionActive] = useState(false);
const [sessionStartTime, setSessionStartTime] = useState<number>(0);
const [currentSessionQuestion, setCurrentSessionQuestion] = useState<string | null>(null);
const [sessionAnsweredQuestions, setSessionAnsweredQuestions] = useState<Set<string>>(new Set());
const [showSessionSummary, setShowSessionSummary] = useState(false);
```

### 2. **Hook Customizado para Sessão** 

```typescript
// hooks/useQuestionSession.ts
const useQuestionSession = (questions: Question[], mode: 'list' | 'wizard') => {
  const [sessionActive, setSessionActive] = useState(false);
  const [globalTimer, setGlobalTimer] = useState(0);
  const [questionTimers, setQuestionTimers] = useState<Record<string, number>>({});
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  
  const startSession = (firstQuestionId?: string) => {
    setSessionActive(true);
    setGlobalTimer(0);
    if (firstQuestionId) {
      startQuestion(firstQuestionId);
    }
  };
  
  const stopSession = () => {
    setSessionActive(false);
    if (currentQuestionId) {
      stopQuestion(currentQuestionId);
    }
    setCurrentQuestionId(null);
  };
  
  const startQuestion = (questionId: string) => {
    // Parar questão anterior se houver
    if (currentQuestionId && currentQuestionId !== questionId) {
      stopQuestion(currentQuestionId);
    }
    setCurrentQuestionId(questionId);
  };
  
  const stopQuestion = (questionId: string) => {
    // Lógica para parar cronômetro da questão
  };
  
  const submitAnswer = (questionId: string, answer: string) => {
    stopQuestion(questionId);
    // No modo lista, auto-avançar para próxima questão
    if (mode === 'list') {
      const nextQuestion = findNextUnansweredQuestion(questionId);
      if (nextQuestion) {
        startQuestion(nextQuestion.id);
      }
    }
  };
  
  return {
    sessionActive,
    startSession,
    stopSession,
    startQuestion,
    submitAnswer,
    questionTimers,
    globalTimer
  };
};
```

### 3. **Modificações no Componente Principal**

#### 3.1 Estados Adicionais
```typescript
// Adicionar aos estados existentes
const [sessionActive, setSessionActive] = useState(false);
const [sessionGlobalTime, setSessionGlobalTime] = useState(0);
const [showSessionSummary, setShowSessionSummary] = useState(false);
```

#### 3.2 Timer Global da Sessão
```typescript
// Timer global para sessão ativa
useEffect(() => {
  let interval: NodeJS.Timeout;
  
  if (sessionActive) {
    interval = setInterval(() => {
      setSessionGlobalTime(prev => prev + 1);
    }, 1000);
  }
  
  return () => {
    if (interval) clearInterval(interval);
  };
}, [sessionActive]);
```

#### 3.3 Controles de Sessão no Modo Lista
```typescript
const startSession = () => {
  setSessionActive(true);
  setSessionGlobalTime(0);
  // Iniciar primeira questão não respondida
  const firstUnanswered = questionsToShow.find(q => !answeredQuestions.has(q.id));
  if (firstUnanswered) {
    startQuestionTimer(firstUnanswered.id);
  }
};

const stopSession = () => {
  setSessionActive(false);
  setIsTimerActive(false);
  setCurrentQuestionTime(0);
  setShowSessionSummary(true);
};

const handleAnswerWithAutoAdvance = async (questionId: string) => {
  // Lógica existente de resposta
  await handleAnswer(questionId);
  
  // Auto-avanço no modo lista durante sessão ativa
  if (viewMode === 'list' && sessionActive) {
    const currentIndex = questionsToShow.findIndex(q => q.id === questionId);
    const nextUnanswered = questionsToShow
      .slice(currentIndex + 1)
      .find(q => !answeredQuestions.has(q.id));
    
    if (nextUnanswered) {
      // Pequeno delay para feedback visual
      setTimeout(() => {
        startQuestionTimer(nextUnanswered.id);
        // Scroll suave para próxima questão
        document.getElementById(`question-${nextUnanswered.id}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 500);
    } else {
      // Acabaram as questões, parar sessão
      stopSession();
    }
  }
};
```

### 4. **Cronômetro no Modo Lista**

```typescript
// Modificar renderQuestion para incluir cronômetro em ambos os modos
const renderQuestion = (question: Question, index?: number) => (
  <div id={`question-${question.id}`} key={question.id} className="bg-app-bg-soft border border-app-border rounded-2xl overflow-hidden shadow-sm">
    {/* Header */}
    <div className="p-4 border-b border-app-border">
      <div className="flex items-start gap-3">
        <HelpCircle className="h-5 w-5 text-app-accent mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-app-text">
                {viewMode === 'wizard' && `${index! + 1}. `}Questão — {question.title}
              </h1>
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-app-muted text-app-text rounded-full border border-app-border">
                {question.category}
              </span>
            </div>
            
            {/* Cronômetro - AGORA EM AMBOS OS MODOS */}
            <div className="flex items-center gap-2">
              {/* Timer individual da questão */}
              <div className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                getCurrentQuestionTimer(question.id) ? 
                'bg-app-accent/20 text-app-accent border border-app-accent/30' : 
                'bg-app-muted text-app-text-muted'
              }`}>
                <Clock className="w-4 h-4" />
                <span className={getCurrentQuestionTimer(question.id) ? 'font-medium' : ''}>
                  {formatTime(questionTimes[question.id] || 0)}
                </span>
                {getCurrentQuestionTimer(question.id) && 
                  <div className="w-2 h-2 bg-app-accent rounded-full animate-pulse" />
                }
              </div>
              
              {/* Timer global da sessão (apenas no modo lista) */}
              {viewMode === 'list' && sessionActive && (
                <div className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md border border-blue-200">
                  <BarChart3 className="w-4 h-4" />
                  <span className="font-medium">{formatTime(sessionGlobalTime)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Conteúdo da questão ... */}

    {/* Botões de Ação */}
    <div className="flex items-center gap-2">
      {/* Botões de sessão apenas no modo lista */}
      {viewMode === 'list' && (
        <>
          {!sessionActive ? (
            <Button 
              onClick={startSession}
              className="bg-app-accent hover:bg-app-accent/90 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar Sessão
            </Button>
          ) : (
            <Button 
              onClick={stopSession}
              variant="destructive"
            >
              <Square className="h-4 w-4 mr-2" />
              Parar Sessão
            </Button>
          )}
        </>
      )}
      
      <Button 
        onClick={() => handleAnswerWithAutoAdvance(question.id)}
        className="bg-app-accent hover:bg-app-accent/90 text-white"
        disabled={answeredQuestions.has(question.id)}
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        Responder
      </Button>
    </div>
  </div>
);
```

---

## 🎨 **Agente UI/UX Designer** - Interface

### 1. **Modal de Resumo da Sessão**

```typescript
const SessionSummaryModal = ({ 
  isOpen, 
  onClose, 
  sessionTime, 
  questionTimes, 
  answeredQuestions, 
  questions 
}) => {
  const answeredCount = answeredQuestions.size;
  const correctAnswers = Array.from(answeredQuestions).filter(qId => {
    const question = questions.find(q => q.id === qId);
    const userAnswer = answers[qId];
    return question && userAnswer === question.correctAnswer;
  }).length;
  
  const successRate = answeredCount > 0 ? Math.round((correctAnswers / answeredCount) * 100) : 0;
  const times = Object.values(questionTimes).filter(t => t > 0);
  const avgTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const fastestTime = times.length > 0 ? Math.min(...times) : 0;
  const slowestTime = times.length > 0 ? Math.max(...times) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Resumo da sessão
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Tempo total" value={formatTime(sessionTime)} />
            <StatCard label="Questões respondidas" value={answeredCount} />
            <StatCard label="Aproveitamento" value={`${successRate}%`} />
            <StatCard label="Média por questão" value={formatTime(avgTime)} />
            <StatCard label="Mais rápida" value={formatTime(fastestTime)} />
            <StatCard label="Mais lenta" value={formatTime(slowestTime)} />
          </div>

          {/* Tabela Detalhada */}
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
                {questions.map((question, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="text-sm text-muted-foreground p-2">{idx + 1}</td>
                    <td className="text-sm p-2">
                      {question.title} <span className="text-muted-foreground">({question.code})</span>
                    </td>
                    <td className="text-sm p-2">
                      {questionTimes[question.id] ? formatTime(questionTimes[question.id]) : '—'}
                    </td>
                    <td className="text-sm p-2">
                      {answeredQuestions.has(question.id) ? (
                        answers[question.id] === question.correctAnswer ? (
                          <Badge className="bg-green-100 text-green-800">✔ correta</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">✖ errada</Badge>
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
            <Button variant="outline" onClick={() => {
              // Reset session
              setSessionActive(false);
              setSessionGlobalTime(0);
              setQuestionTimes({});
              setAnswers({});
              setAnsweredQuestions(new Set());
              onClose();
            }}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Nova sessão
            </Button>
            <Button onClick={onClose}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Concluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

### 2. **Indicadores Visuais de Estado**

```typescript
// Componente para indicar questão ativa na sessão
const QuestionSessionIndicator = ({ isActive, isAnswered, timer }) => (
  <div className={cn(
    "absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all",
    isActive && "bg-blue-100 text-blue-600 border border-blue-200",
    isAnswered && "bg-green-100 text-green-600 border border-green-200",
    !isActive && !isAnswered && "bg-gray-100 text-gray-500"
  )}>
    {isActive && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
    {isAnswered && <CheckCircle2 className="w-3 h-3" />}
    <span>{formatTime(timer)}</span>
  </div>
);
```

### 3. **Transições Suaves**

```css
/* Animações para mudança de questão */
.question-card {
  transition: all 0.3s ease-in-out;
}

.question-card.active {
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: var(--app-accent);
}

.question-card.answered {
  opacity: 0.8;
  transform: scale(0.98);
}

/* Auto-scroll suave */
.question-scroll {
  scroll-behavior: smooth;
}
```

---

## 📅 **Cronograma de Implementação**

### **Fase 1: Estados e Lógica Base** (2h)
- [x] Adicionar estados de sessão
- [x] Implementar timer global
- [x] Criar funções de start/stop sessão

### **Fase 2: Auto-avanço e Cronômetro Lista** (3h)
- [ ] Modificar `handleAnswer` para auto-avanço
- [ ] Adicionar cronômetro no modo lista
- [ ] Implementar indicadores visuais

### **Fase 3: Modal de Resumo** (2h)
- [ ] Criar componente `SessionSummaryModal`
- [ ] Implementar cálculo de estatísticas
- [ ] Adicionar tabela detalhada

### **Fase 4: Refinamentos e Testes** (1h)
- [ ] Testar fluxo completo
- [ ] Ajustar transições
- [ ] Corrigir bugs

---

## 🧪 **Plano de Testes**

### Casos de Teste Essenciais
1. **Iniciar sessão**: Timer global deve começar
2. **Responder questão**: Auto-avanço para próxima questão não respondida
3. **Parar sessão**: Modal de resumo com dados corretos
4. **Alternar modos**: Cronômetro funciona em ambos
5. **Edge cases**: Todas questões respondidas, sem questões, etc.

### Métricas de Sucesso
- ✅ Cronômetro funcional no modo lista
- ✅ Auto-avanço entre questões
- ✅ Modal de resumo com estatísticas completas
- ✅ Indicadores visuais funcionando
- ✅ Compatibilidade com modo wizard existente

---

## 🎯 **Próximos Passos**

1. **Implementar estados de sessão**
2. **Modificar renderQuestion para cronômetro em ambos os modos**
3. **Criar lógica de auto-avanço**
4. **Implementar modal de resumo completo**
5. **Testes e refinamentos**

---

**Tempo Total Estimado**: 8 horas
**Prioridade**: Alta
**Impacto**: Alto (funcionalidade muito solicitada pelos usuários)