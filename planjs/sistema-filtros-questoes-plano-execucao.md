# Plano de Execução: Sistema de Filtros de Questões

## 📋 Visão Geral do Projeto

Este documento define o plano completo para implementar um sistema avançado de filtros de questões no Study Space, incluindo questões do ENEM, OAB e Concursos com múltiplos critérios de filtragem.

## 🎯 Objetivos

- Implementar sistema de filtros hierárquicos (ENEM, OAB, Concursos)
- Criar estrutura de banco de dados robusta para questões compartilhadas
- Desenvolver API RESTful para gerenciamento de questões
- Construir interface responsiva com filtros dinâmicos
- Implementar sistema de estatísticas de erro personalizado

## 🧑‍💻 Agentes Envolvidos

### 1. **Database Engineer** 📊

- **Responsabilidade**: Schema, migrations, otimização de queries
- **Arquivos**: `agents/database-engineer.md`
- **Fases**: Fase 1 (Design do banco), Fase 2 (Otimizações)

### 2. **Backend Developer** 🔧

- **Responsabilidade**: APIs REST, validações, lógica de negócio
- **Arquivos**: `agents/backend-developer.md`
- **Fases**: Fase 2 (APIs), Fase 3 (Integrações)

### 3. **Frontend Developer** ⚛️

- **Responsabilidade**: Interface, filtros dinâmicos, experiência do usuário
- **Arquivos**: `agents/frontend-developer.md`
- **Fases**: Fase 3 (UI/UX), Fase 4 (Otimizações)

### 4. **QA Engineer** 🧪

- **Responsabilidade**: Testes automatizados, validação de funcionalidades
- **Arquivos**: `agents/qa-engineer.md`
- **Fases**: Fase 4 (Testes)

## 🏗️ Arquitetura do Sistema

### Estrutura de Dados

```sql
-- Tabela principal de questões
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(20) NOT NULL, -- 'ENEM', 'OAB', 'CONCURSO'
  subcategory VARCHAR(100), -- 'CNU', 'PRIMEIRA_FASE', etc
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'OBJETIVA', 'DISCURSIVA', 'PECA_PRATICA'
  year INTEGER NOT NULL,
  difficulty VARCHAR(20), -- 'FACIL', 'MEDIO', 'DIFICIL'
  subject_area VARCHAR(100), -- Área do conhecimento
  legal_branch VARCHAR(100), -- Para OAB: ramo do direito
  exam_phase VARCHAR(20), -- Para OAB: 'PRIMEIRA', 'SEGUNDA'
  institution VARCHAR(100), -- Órgão/banca
  position VARCHAR(100), -- Cargo para concursos
  education_level VARCHAR(20), -- 'MEDIO', 'SUPERIOR'
  metadata JSONB DEFAULT '{}', -- Dados específicos flexíveis
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alternativas para questões objetivas
CREATE TABLE question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  option_letter CHAR(1) NOT NULL, -- A, B, C, D, E
  content TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  explanation TEXT
);

-- Estatísticas de resposta por usuário
CREATE TABLE user_question_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  time_spent_seconds INTEGER,
  UNIQUE(user_id, question_id)
);

-- Questões favoritadas
CREATE TABLE user_favorite_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, question_id)
);
```

### API Endpoints

```typescript
// GET /api/questions - Listar questões com filtros
interface QuestionFilters {
  category: "ENEM" | "OAB" | "CONCURSO";
  subcategory?: string; // 'CNU', 'PRIMEIRA_FASE', etc
  year?: number[];
  difficulty?: ("FACIL" | "MEDIO" | "DIFICIL")[];
  subject_area?: string[];
  legal_branch?: string[]; // Para OAB
  exam_phase?: "PRIMEIRA" | "SEGUNDA"; // Para OAB
  type?: ("OBJETIVA" | "DISCURSIVA" | "PECA_PRATICA")[];
  institution?: string[];
  position?: string[];
  education_level?: "MEDIO" | "SUPERIOR";
  favorites_only?: boolean;
  never_answered?: boolean;
  user_correct?: boolean;
  user_incorrect?: boolean;
  min_error_rate?: number; // Filtro de erro mínimo %
  page?: number;
  limit?: number;
}

// GET /api/questions/stats - Estatísticas globais das questões
interface QuestionStats {
  total_questions: number;
  total_responses: number;
  average_error_rate: number;
  by_category: Record<string, number>;
  by_difficulty: Record<string, number>;
}
```

## 📅 Cronograma de Execução

### **Fase 1: Fundação do Sistema (Semanas 1-2)** ✅ **CONCLUÍDA**

#### **Database Engineer** - Design e Estrutura

- [x] **Semana 1**: Criar schema completo das questões ✅
  - [x] Projetar tabelas `questions`, `question_options`, `user_question_stats` ✅
  - [x] Criar tabela `user_favorite_questions` ✅
  - [x] Definir índices para performance de filtros ✅
- [x] **Semana 2**: Implementar migrations e dados de exemplo ✅
  - [x] Criar migration `014_create_questions_system.sql` ✅
  - [x] Inserir dados de exemplo para cada categoria (ENEM, OAB, Concursos) ✅ (`015_add_sample_questions.sql`)
  - [x] Otimizar queries com índices compostos ✅

**Entregáveis:** ✅ **TODOS CONCLUÍDOS**

- [x] Schema completo de questões ✅
- [x] Migration com dados de exemplo ✅
- [x] Documentação de índices e performance ✅

### **Fase 2: APIs e Lógica de Negócio (Semanas 3-4)** ✅ **CONCLUÍDA**

#### **Backend Developer** - Desenvolvimento das APIs

- [x] **Semana 3**: APIs de questões ✅
  - [x] Endpoint `GET /api/questions` com filtros avançados ✅
  - [x] Endpoint `GET /api/questions/:id` para questão específica ✅
  - [x] Endpoint `POST /api/questions/:id/answer` para responder questão ✅
- [x] **Semana 4**: APIs de estatísticas e favoritos ✅
  - [x] Endpoint `GET /api/questions/stats` para estatísticas globais ✅
  - [x] Endpoint `POST /api/questions/:id/favorite` para favoritar questão ✅
  - [x] Endpoint `GET /api/users/question-history` para histórico do usuário ✅
  - [x] Sistema de cálculo de taxa de erro dinâmica ✅

**Entregáveis:** ✅ **TODOS CONCLUÍDOS**

- [x] APIs RESTful completas com validação ✅ (`backend/src/controllers/questionsController.js`)
- [x] Sistema de estatísticas de erro em tempo real ✅ (`question_error_rates` view)
- [x] Documentação da API com exemplos ✅

### **Fase 3: Interface e Experiência do Usuário (Semanas 5-6)** ✅ **CONCLUÍDA**

#### **Frontend Developer** - Interface de Filtros

- [x] **Semana 5**: Componentes de filtro ✅
  - [x] Componente `QuestionFilters` integrado com APIs ✅ (modificado)
  - [x] Componente `QuestionCard` para exibir questões ✅ (existente, reutilizado)
  - [x] Componente `FilterChips` para mostrar filtros ativos ✅ (existente)
  - [x] Hook `useQuestions` para gerenciar estado de questões ✅ (`src/hooks/useQuestions.ts`)
- [x] **Semana 6**: Página de questões completa ✅
  - [x] Página `Questoes.tsx` com listagem e paginação ✅ (integrada com API)
  - [x] Componente `QuestionDetail` para visualização detalhada ✅ (existente, `QuestionStats`)
  - [x] Sistema de favoritos integrado ✅
  - [x] Responsividade para mobile ✅ (mantida do existente)

**Entregáveis:** ✅ **TODOS CONCLUÍDOS**

- [x] Interface completa de filtros de questões ✅ (integração híbrida API + mock)
- [x] Experiência mobile-first responsiva ✅ (mantida)
- [x] Integração com APIs do backend ✅ (`useQuestions` hook)

### **Fase 4: Testes e Otimização (Semanas 7-8)** ⚠️ **PARCIALMENTE CONCLUÍDA**

#### **QA Engineer** - Testes Automatizados

- [x] **Semana 7**: Testes de backend ✅ **BÁSICOS REALIZADOS**
  - [x] Testes manuais para controllers de questões ✅ (validados via API calls)
  - [x] Testes de integração para APIs com filtros ✅ (testados com curl/Postman)
  - [ ] **PENDENTE**: Testes unitários automatizados com Jest ⚠️
  - [ ] **PENDENTE**: Testes de performance para queries complexas ⚠️

#### **Frontend Developer** + **QA Engineer** - Testes Frontend

- [x] **Semana 8**: Testes de frontend básicos ✅
  - [x] Validação manual de componentes de filtro ✅
  - [x] Teste de integração frontend-backend ✅
  - [ ] **PENDENTE**: Testes automatizados com Jest/React Testing Library ⚠️
  - [ ] **PENDENTE**: Testes end-to-end com Playwright/Cypress ⚠️
  - [x] Performance básica de carregamento validada ✅
  - [ ] **PENDENTE**: Cache inteligente de filtros ⚠️

**Entregáveis:** ⚠️ **PARCIALMENTE CONCLUÍDOS**

- [ ] **PENDENTE**: Suite de testes automatizada completa (>90% cobertura) ⚠️
- [x] Performance básica otimizada (< 2s para carregar questões) ✅
- [ ] **PENDENTE**: Documentação completa de uso para administradores ⚠️

## 🔧 Especificações Técnicas

### **Filtros por Categoria**

#### **ENEM**

```typescript
interface ENEMFilters {
  category: "ENEM";
  year: number[]; // 2009-2024
  difficulty: ("FACIL" | "MEDIO" | "DIFICIL")[];
  subject_area: string[]; // Matemática, Linguagens, etc.
  favorites_only: boolean;
  never_answered: boolean;
  min_error_rate: number; // 0-100%
}
```

#### **OAB**

```typescript
interface OABFilters {
  category: "OAB";
  year: number[];
  type: ("OBJETIVA" | "DISCURSIVA" | "PECA_PRATICA")[];
  difficulty: ("FACIL" | "MEDIO" | "DIFICIL")[];
  exam_phase: "PRIMEIRA" | "SEGUNDA";
  legal_branch: string[]; // Civil, Penal, Trabalhista, etc.
  piece_type?: "PROCESSUAL" | "DISCURSIVA"; // Para peças
  favorites_only: boolean;
  never_answered: boolean;
  user_correct: boolean; // Questões que o usuário acertou
  user_incorrect: boolean; // Questões que o usuário errou
  min_error_rate: number;
}
```

#### **Concursos**

```typescript
interface ConcursoFilters {
  category: "CONCURSO";
  subcategory: string; // 'CNU', 'INSS', etc.
  year: number[];
  type: ("OBJETIVA" | "DISCURSIVA" | "PECA_PRATICA")[];
  difficulty: ("FACIL" | "MEDIO" | "DIFICIL")[];
  institution: string[]; // 'Qualquer' ou específica
  position: string[]; // Analista, Técnico, etc.
  education_level: "MEDIO" | "SUPERIOR";
  subject_area: string[];
  favorites_only: boolean;
  never_answered: boolean;
  avoid_repetitions: boolean; // Evitar questões já respondidas
  min_error_rate: number;
}
```

### **Sistema de Taxa de Erro**

```sql
-- View para calcular taxa de erro por questão
CREATE VIEW question_error_rates AS
SELECT
  q.id,
  q.title,
  COUNT(uqs.id) as total_responses,
  COUNT(CASE WHEN uqs.is_correct = false THEN 1 END) as incorrect_responses,
  CASE
    WHEN COUNT(uqs.id) > 0
    THEN (COUNT(CASE WHEN uqs.is_correct = false THEN 1 END) * 100.0) / COUNT(uqs.id)
    ELSE 0
  END as error_rate_percentage
FROM questions q
LEFT JOIN user_question_stats uqs ON q.id = uqs.question_id
GROUP BY q.id, q.title;
```

### **Performance e Índices**

```sql
-- Índices para filtros frequentes
CREATE INDEX idx_questions_category_year ON questions(category, year);
CREATE INDEX idx_questions_difficulty_subject ON questions(difficulty, subject_area);
CREATE INDEX idx_questions_category_phase ON questions(category, exam_phase)
WHERE category = 'OAB';

-- Índice para estatísticas de usuário
CREATE INDEX idx_user_stats_user_correct ON user_question_stats(user_id, is_correct);

-- Índice para favoritos
CREATE INDEX idx_favorites_user_created ON user_favorite_questions(user_id, created_at);
```

## 📊 Interface de Usuário

### **Layout de Filtros**

```
┌─────────────────────────────────────────────────────────────┐
│ [ENEM] [OAB] [Concursos]                           🔍 Busca │
├─────────────────────────────────────────────────────────────┤
│ Filtros Ativos: [2023] [Matemática] [×] [Médio] [×]        │
├─────────────────────────────────────────────────────────────┤
│ ┌─ Ano ────────┐ ┌─ Dificuldade ─┐ ┌─ Área ──────────────┐  │
│ │ □ 2024       │ │ ☑ Fácil       │ │ ☑ Matemática        │  │
│ │ ☑ 2023       │ │ ☑ Médio       │ │ □ Linguagens        │  │
│ │ □ 2022       │ │ □ Difícil     │ │ □ Ciências Natureza │  │
│ └──────────────┘ └───────────────┘ └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ □ Apenas Favoritas  □ Nunca Respondidas  □ Taxa erro > 20% │
├─────────────────────────────────────────────────────────────┤
│ 📊 Encontradas: 1,247 questões | Página 1 de 63            │
└─────────────────────────────────────────────────────────────┘
```

### **Card de Questão**

```
┌─────────────────────────────────────────────────────────────┐
│ 🏷️ ENEM 2023 • Matemática • Médio        ⭐ 👁️ 📊 30% erro │
├─────────────────────────────────────────────────────────────┤
│ Uma empresa produz dois tipos de produtos A e B. O lucro... │
│                                                             │
│ A) R$ 1.200,00                                             │
│ B) R$ 1.500,00                                             │
│ C) R$ 1.800,00                                             │
│ D) R$ 2.100,00                                             │
│ E) R$ 2.400,00                                             │
├─────────────────────────────────────────────────────────────┤
│ [Ver Detalhes] [Responder] [Favoritar]                     │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Critérios de Sucesso

### **Performance**

- [ ] Carregamento de questões em < 2 segundos
- [ ] Filtros respondem em < 500ms
- [ ] Suporte a 10,000+ questões simultâneas

### **Funcionalidade**

- [ ] Todos os filtros especificados implementados
- [ ] Sistema de estatísticas em tempo real
- [ ] Favoritos sincronizados entre dispositivos

### **Qualidade**

- [ ] Cobertura de testes > 90%
- [ ] Interface responsiva (mobile-first)
- [ ] Acessibilidade WCAG 2.1 AA

### **Dados**

- [ ] Base inicial de 500+ questões por categoria
- [ ] Sistema de importação para administradores
- [ ] Backup automático de estatísticas

## 📝 Documentação de Entrega

### **Para Desenvolvedores**

- [ ] README com instruções de setup
- [ ] Documentação da API com Swagger/OpenAPI
- [ ] Guia de contribuição para novas questões

### **Para Usuários**

- [ ] Manual de uso dos filtros
- [ ] FAQ sobre critérios de filtragem
- [ ] Vídeo tutorial de 3 minutos

### **Para Administradores**

- [ ] Interface para inserir novas questões
- [ ] Dashboard de estatísticas de uso
- [ ] Ferramentas de moderação de conteúdo

## 📝 Como Inserir Questões no Sistema

### **Opção 1: Via SQL Direto (Recomendado para Admin)**

```sql
-- 1. Inserir questão principal
INSERT INTO questions (
  category, subcategory, title, content, type, year,
  difficulty, subject_area, legal_branch, exam_phase,
  institution, position, education_level, metadata
) VALUES (
  'ENEM', -- 'ENEM', 'OAB', 'CONCURSO'
  NULL,
  'Título da Questão',
  'Enunciado completo da questão...',
  'OBJETIVA', -- 'OBJETIVA', 'DISCURSIVA', 'PECA_PRATICA'
  2024,
  'MEDIO', -- 'FACIL', 'MEDIO', 'DIFICIL'
  'Matemática',
  NULL, -- Para OAB: 'Civil', 'Penal', etc.
  NULL, -- Para OAB: 'PRIMEIRA', 'SEGUNDA'
  'INEP', -- Instituição/Banca
  NULL, -- Para concursos: cargo
  'MEDIO', -- 'MEDIO', 'SUPERIOR'
  '{"tema": "Funções", "competencia": 5}'::jsonb
) RETURNING id;

-- 2. Inserir alternativas (para questões objetivas)
INSERT INTO question_options (question_id, option_letter, content, is_correct, explanation) VALUES
  ('question-id-aqui', 'A', 'Alternativa A', false, 'Explicação da alternativa A'),
  ('question-id-aqui', 'B', 'Alternativa B', false, 'Explicação da alternativa B'),
  ('question-id-aqui', 'C', 'Alternativa C', true, 'Explicação da resposta correta'),
  ('question-id-aqui', 'D', 'Alternativa D', false, 'Explicação da alternativa D'),
  ('question-id-aqui', 'E', 'Alternativa E', false, 'Explicação da alternativa E');
```

### **Opção 2: Via Script de Importação**

```bash
# No diretório backend
cd backend

# Criar arquivo CSV com as questões
# Formato: category,title,content,type,year,difficulty,subject_area,option_a,option_b,option_c,option_d,option_e,correct_option

# Executar script de importação (a ser criado)
bun run import-questions data/questoes.csv
```

### **Opção 3: Via API Admin (Futuro)**

```javascript
// POST /api/admin/questions
const questionData = {
  category: "ENEM",
  title: "Título da Questão",
  content: "Enunciado...",
  type: "OBJETIVA",
  year: 2024,
  difficulty: "MEDIO",
  subject_area: "Matemática",
  options: [
    { letter: "A", content: "Alt A", correct: false },
    { letter: "B", content: "Alt B", correct: false },
    { letter: "C", content: "Alt C", correct: true },
    { letter: "D", content: "Alt D", correct: false },
    { letter: "E", content: "Alt E", correct: false },
  ],
};
```

### **Comandos Úteis para Administração**

```sql
-- Ver estatísticas das questões
SELECT
  category,
  COUNT(*) as total_questions,
  COUNT(DISTINCT year) as years_covered,
  MIN(year) as oldest_year,
  MAX(year) as newest_year
FROM questions
GROUP BY category;

-- Ver questões sem respostas
SELECT q.id, q.title, q.category
FROM questions q
LEFT JOIN question_options qo ON q.id = qo.question_id
WHERE qo.id IS NULL AND q.type = 'OBJETIVA';

-- Backup das questões
COPY questions TO '/backup/questions.csv' DELIMITER ',' CSV HEADER;
COPY question_options TO '/backup/options.csv' DELIMITER ',' CSV HEADER;
```

## 🔄 Próximos Passos

1. **✅ Fase 1-3 Completas**: Sistema base implementado
2. **⚠️ Fase 4 Pendente**: Testes automatizados e otimizações
3. **📋 Backlog**:
   - Interface administrativa para inserção de questões
   - Script de importação em lote
   - Dashboard de estatísticas para admin
   - Testes automatizados completos

---

**Data de Criação:** Agosto 2025  
**Versão:** 1.0  
**Status:** Aguardando Aprovação

**Agentes Responsáveis:**

- 📊 Database Engineer: Schema e performance
- 🔧 Backend Developer: APIs e lógica de negócio
- ⚛️ Frontend Developer: Interface e experiência
- 🧪 QA Engineer: Testes e qualidade
