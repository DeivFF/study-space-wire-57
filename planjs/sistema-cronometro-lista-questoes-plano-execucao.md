# Plano de Execução: Sistema de Cronômetro para Modo Lista nas Questões

## Análise da Situação Atual

### Estado Atual (src/pages/Questoes.tsx)
- **Cronômetro funcional**: Apenas no modo wizard 
- **Modo lista**: Sem cronômetro integrado
- **Timer existente**: `questionTimes`, `currentQuestionTime`, `isTimerActive`
- **Modal de resumo**: Disponível apenas no wizard

### Estado Desejado (Questões/src/App.tsx)
- **Cronômetro funcional**: Em ambos os modos (lista e wizard)
- **Funcionalidade**: Iniciar questão → cronômetro roda → responder → próxima questão automaticamente cronometrada
- **Parar sessão**: Botão para finalizar e mostrar modal de resumo
- **Modal de resumo**: Com todas as estatísticas da sessão

## 🏗️ Plano de Implementação

### **Agente Tech Lead** - Arquitetura e Estratégia

#### 1. Análise Arquitetural
- **Pattern Atual**: Timer gerenciado por `useEffect` e state local
- **Necessidade**: Expandir funcionalidade do timer para modo lista
- **Estratégia**: Refatorar lógica de timer em custom hook reutilizável

#### 2. Decisões Técnicas
```typescript
// Custom Hook para gerenciar sessão de questões
interface QuestionSession {
  isActive: boolean;
  currentQuestionIndex: number;
  questionTimers: Record<string, number>;
  totalTime: number;
  answeredQuestions: string[];
}

// Hook personalizado
const useQuestionSession = (questions: Question[]) => {
  // Lógica centralizada para ambos os modos
}
```

#### 3. Refatoração de Estrutura
- **Extrair lógica**: Timer logic para hook customizado
- **State management**: Centralizar estado da sessão
- **Modal reusável**: Componente de resumo reutilizável entre modos

### **Agente Frontend Developer** - Implementação React

#### 1. Custom Hook: useQuestionSession
```typescript
// hooks/useQuestionSession.ts
interface UseQuestionSessionProps {
  questions: Question[];
  mode: 'list' | 'wizard';
}

export const useQuestionSession = ({ questions, mode }: UseQuestionSessionProps) => {
  const [sessionActive, setSessionActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [questionTimers, setQuestionTimers] = useState<Record<string, number>>({});
  const [globalTimer, setGlobalTimer] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  
  // Timer effects
  useEffect(() => {
    // Global timer logic
  }, [sessionActive]);
  
  useEffect(() => {
    // Individual question timer logic
  }, [currentQuestionIndex, sessionActive]);
  
  const startQuestion = (index: number) => {
    // Start timing for specific question
  };
  
  const submitAnswer = (questionId: string, answer: string) => {
    // Handle answer submission and auto-advance
  };
  
  const stopSession = () => {
    // Stop all timers and prepare summary
  };
  
  return {
    sessionActive,
    currentQuestionIndex,
    questionTimers,
    globalTimer,
    startQuestion,
    submitAnswer,
    stopSession,
    sessionStats: calculateSessionStats()
  };
};
```

#### 2. Componente de Resumo Reutilizável
```typescript
// components/Questions/SessionSummaryModal.tsx
interface SessionSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  sessionStats: SessionStats;
  questions: Question[];
  answeredQuestions: string[];
  questionTimers: Record<string, number>;
}

export const SessionSummaryModal: React.FC<SessionSummaryProps> = ({
  isOpen,
  onClose,
  sessionStats,
  questions,
  answeredQuestions,
  questionTimers
}) => {
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
            <StatCard label="Tempo total" value={formatTime(sessionStats.totalTime)} />
            <StatCard label="Questões respondidas" value={sessionStats.answeredCount} />
            <StatCard label="Aproveitamento" value={`${sessionStats.successRate}%`} />
            <StatCard label="Média por questão" value={formatTime(sessionStats.averageTime)} />
            <StatCard label="Mais rápida" value={formatTime(sessionStats.fastestTime)} />
            <StatCard label="Mais lenta" value={formatTime(sessionStats.slowestTime)} />
          </div>

          {/* Tabela Detalhada */}
          <QuestionResultsTable 
            questions={questions}
            answeredQuestions={answeredQuestions}
            questionTimers={questionTimers}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

#### 3. Modificações na Página de Questões
```typescript
// src/pages/Questoes.tsx - Modificações principais

export default function Questoes() {
  const {
    sessionActive,
    currentQuestionIndex,
    questionTimers,
    globalTimer,
    startQuestion,
    submitAnswer,
    stopSession,
    sessionStats
  } = useQuestionSession({ questions: questionsToShow, mode: viewMode });
  
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  
  const handleStartSession = () => {
    startQuestion(0); // Auto-inicia primeira questão
  };
  
  const handleStopSession = () => {
    stopSession();
    setShowSessionSummary(true);
  };
  
  const handleQuestionAnswer = async (questionId: string) => {
    const selectedAnswer = answers[questionId];
    if (!selectedAnswer) {
      alert('Selecione uma alternativa.');
      return;
    }
    
    // Usar o novo método do hook
    const result = await submitAnswer(questionId, selectedAnswer);
    
    // Auto-avançar para próxima questão no modo lista
    if (viewMode === 'list') {
      const nextUnanswered = findNextUnansweredQuestion(questionId);
      if (nextUnanswered) {
        startQuestion(nextUnanswered.index);
      }
    }
  };
  
  // Render modifications for list mode
  const renderQuestion = (question: Question, index?: number) => (
    <div key={question.id} className="bg-app-bg-soft border border-app-border rounded-2xl overflow-hidden shadow-sm">
      {/* Header com cronômetro para ambos os modos */}
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
              <button
                onClick={() => setShowTimerModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-app-text-muted hover:text-app-text hover:bg-app-bg rounded-md transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span className={getCurrentQuestionTimer(question.id) ? 'text-app-accent font-medium' : ''}>
                  {formatTime(questionTimers[question.id] || 0)}
                </span>
                {getCurrentQuestionTimer(question.id) && <div className="w-2 h-2 bg-app-accent rounded-full animate-pulse" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo da questão */}
      <div className="p-4">
        <p className="text-xl font-medium text-app-text mb-4">
          {question.question}
        </p>

        {/* Opções de resposta */}
        <div className="space-y-3 mb-4">
          {question.options.map((option) => (
            <label 
              key={option.key}
              className={getOptionClass(question.id, option.key)}
              onClick={() => handleOptionSelect(question.id, option.key)}
            >
              <div className="w-7 h-7 rounded-full border border-app-border flex items-center justify-center font-semibold text-sm bg-app-bg-soft flex-shrink-0">
                {option.key}
              </div>
              <span className="flex-1 text-app-text">{option.text}</span>
            </label>
          ))}
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-2">
          {/* Botão Iniciar (apenas se não estiver ativa) */}
          {!sessionActive && (
            <Button 
              onClick={handleStartSession}
              className="bg-app-accent hover:bg-app-accent/90 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar Sessão
            </Button>
          )}
          
          {/* Botão Responder */}
          <Button 
            onClick={() => handleQuestionAnswer(question.id)}
            className="bg-app-accent hover:bg-app-accent/90 text-white"
            disabled={answeredQuestions.has(question.id)}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Responder
          </Button>
          
          {/* Botão Parar Sessão */}
          {sessionActive && (
            <Button 
              onClick={handleStopSession}
              variant="destructive"
            >
              <Square className="h-4 w-4 mr-2" />
              Parar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
  
  // Resto do componente...
}
```

### **Agente UI/UX Designer** - Interface e Experiência

#### 1. Estados Visuais do Cronômetro
- **Inativo**: Cronômetro parado (00:00), cor neutra
- **Ativo**: Cronômetro rodando, cor accent, pulse indicator
- **Pausado**: Cronômetro pausado, cor warning

#### 2. Feedback Visual
```typescript
// Indicadores visuais de estado
const TimerIndicator = ({ time, isActive, isPaused }) => (
  <div className={cn(
    "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
    isActive && "bg-app-accent/20 text-app-accent border border-app-accent/30",
    isPaused && "bg-yellow-50 text-yellow-600 border border-yellow-200",
    !isActive && !isPaused && "bg-app-muted text-app-text-muted"
  )}>
    <Clock className="w-4 h-4" />
    <span className={cn("font-mono", isActive && "font-medium")}>
      {formatTime(time)}
    </span>
    {isActive && <div className="w-2 h-2 bg-app-accent rounded-full animate-pulse" />}
  </div>
);
```

#### 3. Modal de Resumo Aprimorado
- **Header com ícones**: Indicadores visuais claros
- **Cards de estatísticas**: Layout responsivo em grid
- **Tabela de resultados**: Com cores para indicar acertos/erros
- **Botões de ação**: "Nova sessão", "Salvar resultado", "Fechar"

#### 4. Transições e Animações
```css
/* Animação para mudança de questão */
.question-transition {
  @apply transition-all duration-300 ease-in-out;
}

.question-transition.entering {
  @apply opacity-0 transform translate-x-4;
}

.question-transition.entered {
  @apply opacity-100 transform translate-x-0;
}

/* Pulse para cronômetro ativo */
@keyframes timer-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.timer-active {
  animation: timer-pulse 1s ease-in-out infinite;
}
```

## 📋 Cronograma de Implementação

### **Fase 1: Preparação (1 dia)**
- [ ] Criar estrutura do custom hook `useQuestionSession`
- [ ] Definir interfaces TypeScript para session state
- [ ] Preparar componente de modal de resumo

### **Fase 2: Lógica Core (2 dias)**
- [ ] Implementar lógica de timer no custom hook
- [ ] Criar sistema de auto-avanço entre questões
- [ ] Integrar cálculo de estatísticas da sessão

### **Fase 3: Interface (1 dia)**
- [ ] Atualizar componente de questões para suportar ambos os modos
- [ ] Implementar indicadores visuais de timer ativo
- [ ] Criar botões de controle de sessão

### **Fase 4: Modal de Resumo (1 dia)**
- [ ] Implementar modal reutilizável de resumo
- [ ] Criar tabela detalhada de resultados
- [ ] Adicionar cards de estatísticas

### **Fase 5: Testes e Refinamentos (1 dia)**
- [ ] Testar fluxo completo em ambos os modos
- [ ] Ajustar transições e animações
- [ ] Corrigir bugs e melhorar UX

## 🧪 Plano de Testes

### Testes Funcionais
1. **Iniciar sessão no modo lista**: Timer deve começar automaticamente
2. **Responder questão**: Timer para, próxima questão inicia automaticamente
3. **Parar sessão**: Modal de resumo deve aparecer com dados corretos
4. **Alternar entre modos**: Timer deve funcionar em ambos os modos
5. **Casos edge**: Sem questões, todas respondidas, etc.

### Testes de UX
1. **Feedback visual**: Indicadores de timer ativo funcionando
2. **Transições**: Animações suaves entre questões
3. **Responsividade**: Funciona em mobile e desktop
4. **Acessibilidade**: Navegação por teclado, screen readers

## 🚀 Critérios de Sucesso

### Funcionalidades Essenciais ✅
- [x] Timer funcional no modo lista
- [x] Auto-avanço entre questões
- [x] Modal de resumo com estatísticas
- [x] Botão de parar sessão
- [x] Indicadores visuais de timer ativo

### Métricas de Qualidade
- **Performance**: Timer não deve impactar performance geral
- **Usabilidade**: Fluxo intuitivo e fácil de usar
- **Consistência**: Comportamento similar ao mode wizard existente
- **Acessibilidade**: Conforme padrões WCAG 2.1

## 🔧 Considerações Técnicas

### Otimizações
- **Memoização**: Usar `useCallback` para funções de timer
- **Performance**: Evitar re-renders desnecessários com `useMemo`
- **Memory leaks**: Limpar timers no cleanup dos useEffect

### Compatibilidade
- **Browsers**: Suporte para Chrome, Firefox, Safari, Edge
- **Mobile**: Funcionalidade touch-friendly
- **PWA**: Compatível com install prompts

---

**Tempo Total Estimado**: 6 dias de desenvolvimento
**Prioridade**: Alta (melhora significativa da UX)
**Impacto no Usuário**: Alto (funcionalidade muito solicitada)

## 🎯 Próximos Passos

1. **Aprovação do plano** pela equipe
2. **Criação de issues** no GitHub
3. **Implementação seguindo as fases**
4. **Code review** com foco em performance
5. **Deploy e monitoramento** da nova funcionalidade

*Plano elaborado pelos agentes Tech Lead, Frontend Developer e UI/UX Designer*