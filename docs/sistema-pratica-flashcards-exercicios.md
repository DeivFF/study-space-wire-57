# Sistema de Prática de Flashcards e Exercícios

## 📋 Visão Geral

Este documento detalha a implementação das funcionalidades de prática de flashcards e exercícios que serão acessadas através dos botões "Praticar exercício" e "Praticar flashcards" no dropdown de ações dos cards de aula (`LessonCard.tsx` linha 111).

## 🎯 Objetivos

1. **Prática de Flashcards**: Permitir ao usuário revisar flashcards de uma aula específica em um ambiente dedicado
2. **Prática de Exercícios**: Possibilitar a resolução de exercícios de uma aula em formato de quiz interativo
3. **Acompanhamento de Progresso**: Registrar performance e estatísticas de estudo
4. **Experiência Unificada**: Manter consistência visual e funcional com o resto da aplicação

## 🎮 Experiência do Usuário

### Fluxo de Prática de Flashcards

```mermaid
graph TD
    A[Usuário clica "Praticar flashcards"] --> B{Tem flashcards na aula?}
    B -->|Não| C[Exibe mensagem "Nenhum flashcard disponível"]
    B -->|Sim| D[Abre modal de prática]
    D --> E[Mostra configurações da sessão]
    E --> F[Usuário configura limite de cards]
    F --> G[Inicia sessão de flashcards]
    G --> H[Mostra card frontal]
    H --> I[Usuário clica "Ver resposta"]
    I --> J[Mostra card traseiro]
    J --> K[Usuário avalia dificuldade (1-5)]
    K --> L{Há mais cards?}
    L -->|Sim| H
    L -->|Não| M[Exibe estatísticas finais]
    M --> N[Fecha modal]
```

### Fluxo de Prática de Exercícios

```mermaid
graph TD
    A[Usuário clica "Praticar exercício"] --> B{Tem exercícios na aula?}
    B -->|Não| C[Exibe mensagem "Nenhum exercício disponível"]
    B -->|Sim| D[Abre modal de prática]
    D --> E[Mostra configurações da sessão]
    E --> F[Usuário seleciona filtros opcionais]
    F --> G[Inicia sessão de exercícios]
    G --> H[Mostra exercício atual]
    H --> I[Usuário responde]
    I --> J[Mostra feedback imediato]
    J --> K{Há mais exercícios?}
    K -->|Sim| H
    K -->|Não| L[Exibe estatísticas finais]
    L --> M[Fecha modal]
```

## 🔧 Implementação Técnica

### 1. Componentes a Criar

#### 1.1 FlashcardPracticeModal.tsx
**Localização**: `src/components/StudyApp/Practice/FlashcardPracticeModal.tsx`

```typescript
interface FlashcardPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle: string;
}
```

**Funcionalidades**:
- Modal full-screen responsivo
- Configuração de sessão (limite de cards, filtros por status)
- Interface de prática com animações de flip
- Sistema de avaliação por dificuldade (1-5 estrelas)
- Progresso visual da sessão
- Estatísticas em tempo real
- Botão de encerramento antecipado

#### 1.2 ExercisePracticeModal.tsx
**Localização**: `src/components/StudyApp/Practice/ExercisePracticeModal.tsx`

```typescript
interface ExercisePracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle: string;
}
```

**Funcionalidades**:
- Modal full-screen responsivo
- Configuração de sessão (filtros por dificuldade, tipo de questão)
- Interface de quiz com diferentes tipos de questão
- Feedback imediato com explicações
- Timer por exercício (opcional)
- Progresso visual da sessão
- Estatísticas finais
- Review de respostas incorretas

#### 1.3 PracticeSessionStats.tsx
**Localização**: `src/components/StudyApp/Practice/PracticeSessionStats.tsx`

```typescript
interface SessionStats {
  correct: number;
  total: number;
  accuracy: number;
  timeSpent: number;
  avgTimePerCard: number;
}
```

### 2. Hooks Personalizados

#### 2.1 usePracticeSession.ts
**Localização**: `src/hooks/usePracticeSession.ts`

```typescript
interface PracticeSessionConfig {
  lessonId: string;
  type: 'flashcards' | 'exercises';
  limit?: number;
  filters?: {
    difficulty?: string[];
    questionType?: string[];
    status?: string[];
  };
}

export const usePracticeSession = (config: PracticeSessionConfig) => {
  // Lógica de gerenciamento da sessão
  // Controle de progresso
  // Persistência de estatísticas
  // Timer management
}
```

#### 2.2 useFlashcardReview.ts
**Localização**: `src/hooks/useFlashcardReview.ts`

```typescript
export const useFlashcardReview = (lessonId: string) => {
  // Sistema de repetição espaçada (SRS)
  // Cálculo de próxima revisão
  // Estatísticas de revisão
}
```

#### 2.3 useExerciseAttempt.ts
**Localização**: `src/hooks/useExerciseAttempt.ts`

```typescript
export const useExerciseAttempt = (lessonId: string) => {
  // Submissão de respostas
  // Validação de respostas
  // Histórico de tentativas
}
```

### 3. Integração com Backend

#### 3.1 Endpoints para Flashcards
```typescript
// Já existentes - usar os atuais
GET /api/flashcards/due/:lessonId
POST /api/flashcards/:id/review
GET /api/flashcards/session/start/:lessonId
```

#### 3.2 Endpoints para Exercícios
```typescript
// Já existentes - usar os atuais
GET /api/exercises/lesson/:lessonId
POST /api/exercises/:id/attempt
GET /api/exercises/:id/statistics
```

#### 3.3 Novos Endpoints para Estatísticas
```typescript
// A implementar no backend
POST /api/practice/session/start
POST /api/practice/session/complete
GET /api/practice/sessions/:lessonId
GET /api/practice/statistics/:lessonId
```

### 4. Atualização dos Componentes Existentes

#### 4.1 LessonCard.tsx (linhas 32-40)
```typescript
const handlePracticeExercise = () => {
  setExercisePracticeModal(true);
};

const handlePracticeFlashcards = () => {
  setFlashcardPracticeModal(true);
};
```

#### 4.2 LessonListItem.tsx (linhas 31-39)
Similar ao LessonCard.tsx

### 5. Estados e Context

#### 5.1 PracticeContext.tsx
**Localização**: `src/contexts/PracticeContext.tsx`

```typescript
interface PracticeContextType {
  activeSession: PracticeSession | null;
  startFlashcardSession: (lessonId: string, config?: SessionConfig) => void;
  startExerciseSession: (lessonId: string, config?: SessionConfig) => void;
  endSession: () => void;
  sessionStats: SessionStats;
}
```

## 📱 Design e Interface

### 1. Modal de Configuração
- **Layout**: Centrado, 500px largura em desktop
- **Elementos**:
  - Título da aula
  - Número de items disponíveis
  - Slider para limite de items
  - Checkboxes para filtros
  - Botão "Iniciar Prática"

### 2. Interface de Prática - Flashcards
- **Layout**: Full-screen modal
- **Elementos**:
  - Header com progresso (ex: "3 de 10")
  - Card central com animação flip
  - Área de avaliação (1-5 estrelas)
  - Estatísticas laterais (acertos, precisão)
  - Botão "Encerrar"

### 3. Interface de Prática - Exercícios
- **Layout**: Full-screen modal
- **Elementos**:
  - Header com progresso
  - Área da questão
  - Opções de resposta (conforme tipo)
  - Timer (opcional)
  - Feedback area
  - Botão "Próximo"

### 4. Tela de Resultados
- **Layout**: Centrado no modal
- **Elementos**:
  - Estatísticas principais (acertos, tempo, etc.)
  - Gráfico de performance
  - Lista de items revisados
  - Botões "Revisar Erros" e "Finalizar"

## 🎨 Estilos e Animações

### 1. Animações de Transição
```css
/* Flip animation para flashcards */
.flashcard-flip {
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

/* Slide animation para exercícios */
.exercise-slide {
  transition: transform 0.3s ease-in-out;
}

/* Progress bar animation */
.progress-smooth {
  transition: width 0.5s ease-out;
}
```

### 2. Responsividade
- **Mobile**: Modal full-screen, navegação por swipe
- **Tablet**: Modal adaptado, botões maiores
- **Desktop**: Modal otimizado, shortcuts de teclado

## 📊 Estatísticas e Métricas

### 1. Durante a Sessão
- Progresso atual (X de Y)
- Tempo decorrido
- Accuracy em tempo real
- Streak de acertos

### 2. Ao Final da Sessão
- Total de items revisados
- Acertos vs erros
- Tempo total e médio por item
- Melhoria vs sessões anteriores
- Items que precisam ser revistos

### 3. Histórico (futuro)
- Gráfico de performance ao longo do tempo
- Heatmap de atividade
- Estatísticas por tipo de conteúdo

## 🔄 Integração com Sistema Existente

### 1. Compatibilidade com FlashcardsTab
- Reutilizar hooks existentes (`useFlashcards`)
- Manter API calls consistentes
- Integrar com sistema SRS existente

### 2. Compatibilidade com ExerciseBank
- Reutilizar hooks existentes (`useExercises`)
- Manter validação de respostas
- Integrar com sistema de tentativas

### 3. Persistência de Dados
- Utilizar backend local existente
- Não modificar estrutura de tabelas
- Adicionar apenas logs de sessões de prática

## 🚀 Cronograma de Implementação

### Fase 1: Fundação (1-2 dias)
1. Criar estrutura de pastas `/Practice`
2. Implementar `usePracticeSession` hook básico
3. Criar componente base do modal

### Fase 2: Flashcards (2-3 dias)
1. Implementar `FlashcardPracticeModal`
2. Adicionar sistema de avaliação
3. Integrar com SRS existente
4. Testes de funcionalidade

### Fase 3: Exercícios (2-3 dias)
1. Implementar `ExercisePracticeModal`
2. Suporte para múltiplos tipos de questão
3. Sistema de feedback
4. Testes de funcionalidade

### Fase 4: Polimento (1-2 dias)
1. Animações e transições
2. Responsividade
3. Acessibilidade
4. Testes finais

## 📋 Lista de Arquivos a Criar

### Componentes
- `src/components/StudyApp/Practice/FlashcardPracticeModal.tsx`
- `src/components/StudyApp/Practice/ExercisePracticeModal.tsx`
- `src/components/StudyApp/Practice/PracticeSessionStats.tsx`
- `src/components/StudyApp/Practice/SessionConfigDialog.tsx`
- `src/components/StudyApp/Practice/SessionResultsDialog.tsx`
- `src/components/StudyApp/Practice/index.ts`

### Hooks
- `src/hooks/usePracticeSession.ts`
- `src/hooks/useFlashcardReview.ts`
- `src/hooks/useExerciseAttempt.ts`

### Tipos
- `src/types/practice.ts`

### Contextos
- `src/contexts/PracticeContext.tsx`

### Estilos
- `src/components/StudyApp/Practice/Practice.css`

## 🔧 Modificações em Arquivos Existentes

### src/components/StudyApp/LessonCard.tsx
- Linhas 32-40: Implementar handlers de prática
- Adicionar estados para modais

### src/components/StudyApp/LessonListItem.tsx  
- Linhas 31-39: Implementar handlers de prática
- Adicionar estados para modais

### src/services/studyApi.ts
- Adicionar métodos para sessões de prática
- Endpoints de estatísticas

## 💡 Considerações Especiais

### 1. Performance
- Lazy loading dos modais
- Otimização de re-renders
- Cache de dados da sessão

### 2. Acessibilidade
- Suporte a navegação por teclado
- Screen reader compatibility
- High contrast mode

### 3. Offline Support (futuro)
- Cache de flashcards/exercícios
- Sincronização quando voltar online

### 4. Analytics
- Tracking de uso das funcionalidades
- Métricas de engagement
- A/B testing para otimizações

## 🎯 Critérios de Sucesso

### Funcional
- [ ] Usuário consegue iniciar prática de flashcards
- [ ] Usuário consegue iniciar prática de exercícios  
- [ ] Sistema salva progresso corretamente
- [ ] Estatísticas são calculadas precisamente
- [ ] Interface é responsiva em todos dispositivos

### Técnico
- [ ] Código segue padrões do projeto
- [ ] Performance adequada (< 2s load time)
- [ ] Testes unitários cobrem funcionalidades críticas
- [ ] Integração não quebra funcionalidades existentes

### UX
- [ ] Interface intuitiva e fácil de usar
- [ ] Feedback visual claro e imediato
- [ ] Animações melhoram experiência
- [ ] Acessibilidade atende padrões WCAG

## 📝 Notas de Implementação

1. **Reutilização**: Máxima reutilização de hooks e componentes existentes
2. **Modularidade**: Componentes independentes e reutilizáveis
3. **Testabilidade**: Separação clara de lógica e apresentação
4. **Manutenibilidade**: Código limpo e bem documentado
5. **Escalabilidade**: Preparado para funcionalidades futuras

---

**Autor**: Sistema de Documentação  
**Data**: Janeiro 2025  
**Versão**: 1.0  
**Status**: Especificação Técnica