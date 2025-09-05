# Plano de Implementação: Sistema de Criação de Postagens

## Visão Geral

Este documento define o plano de implementação para o sistema de criação de postagens no Study Space, baseado no design do `post.html` e integrando com a arquitetura React/Node.js existente.

## 📊 Análise da Situação Atual

### Estrutura Existente

- **Frontend**: Feed.tsx com posts mock e componente StudyPost
- **Backend**: Sistema de autenticação funcional
- **Design Base**: post.html com 4 tipos de postagem
- **UI**: shadcn/ui + Tailwind CSS implementado

### Tipos de Postagem Identificados

1. **Publicação** - Post simples tipo social media
2. **Dúvida** - Pergunta estruturada com título e descrição
3. **Enquete** - Poll com múltiplas opções
4. **Exercício** - Questões de múltipla escolha ou dissertativas

## 🎯 Objetivos

### Funcionais

- [ ] Usuário pode criar postagens de 4 tipos diferentes
- [ ] Interface intuitiva com tabs para tipos de post
- [ ] Validação em tempo real dos campos
- [ ] Persistência no banco de dados
- [ ] Integração com o feed existente

### Não-Funcionais

- [ ] Performance otimizada para mobile
- [ ] Acessibilidade completa (ARIA)
- [ ] Responsive design
- [ ] Segurança de inputs (XSS/injection)

## 🏗️ Arquitetura da Solução

### Frontend (React + TypeScript)

```
src/components/Post/
├── PostComposer/
│   ├── PostComposer.tsx          # Componente principal
│   ├── PostTypeSelector.tsx      # Seletor de tipos
│   ├── forms/
│   │   ├── PublicacaoForm.tsx    # Form para publicação
│   │   ├── DuvidaForm.tsx        # Form para dúvida
│   │   ├── EnqueteForm.tsx       # Form para enquete
│   │   └── ExercicioForm.tsx     # Form para exercício
│   └── PostComposer.module.css   # Estilos específicos
```

### Backend (Node.js + Express)

```
backend/src/
├── routes/posts.js               # Rotas de posts
├── controllers/postsController.js # Lógica de negócio
├── models/Post.js                # Modelo de dados
├── middleware/postValidation.js  # Validação de posts
└── migrations/
    └── 011_create_posts_table.sql
```

## 🗄️ Estrutura de Dados

### Tabela `posts`

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('publicacao', 'duvida', 'enquete', 'exercicio')),
    title VARCHAR(500), -- Para dúvida e exercício
    content TEXT NOT NULL,
    data JSONB, -- Dados específicos por tipo (opções da enquete, alternativas do exercício)
    tags TEXT[], -- Array de tags
    is_anonymous BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Índices
    CONSTRAINT posts_type_check CHECK (
        (type = 'publicacao' AND title IS NULL) OR
        (type IN ('duvida', 'exercicio') AND title IS NOT NULL) OR
        (type = 'enquete' AND title IS NOT NULL)
    )
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);
```

### Estrutura JSONB por Tipo

#### Publicação

```typescript
interface PublicacaoData {
  // Nenhum dado adicional necessário
}
```

#### Dúvida

```typescript
interface DuvidaData {
  description: string;
  tags?: string[];
}
```

#### Enquete

```typescript
interface EnqueteData {
  question: string;
  options: Array<{
    id: string;
    text: string;
    votes: number;
  }>;
  allowMultiple: boolean;
  duration: number; // dias
  endsAt: string; // ISO date
}
```

#### Exercício

```typescript
interface ExercicioData {
  statement: string;
  mode: "multiple_choice" | "essay";
  difficulty: "facil" | "medio" | "dificil";
  topic?: string;

  // Para múltipla escolha
  alternatives?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;

  // Para dissertativa
  rubric?: string;
}
```

## 🎨 Interface de Usuário

### Design System

- **Base**: Componentes shadcn/ui existentes
- **Cores**: CSS variables do sistema atual
- **Ícones**: Lucide React (já implementado)
- **Layout**: Card-based com footer de ações

### Componente PostComposer

```typescript
interface PostComposerProps {
  onSubmit: (post: PostData) => Promise<void>;
  onCancel?: () => void;
  isExpanded?: boolean;
}

interface PostData {
  type: "publicacao" | "duvida" | "enquete" | "exercicio";
  title?: string;
  content: string;
  data?: any;
  tags?: string[];
  isAnonymous?: boolean;
}
```

### Estados do Componente

1. **Collapsed** - Botão "Novo tópico"
2. **Expanded** - Interface completa com tabs
3. **Loading** - Durante envio
4. **Error** - Tratamento de erros

## 🔧 Implementação Técnica

### Fase 1: Estrutura Base (Backend)

**Agente Responsável**: Backend Developer
**Estimativa**: 2-3 dias

#### Tarefas:

1. **Migração do Banco**

   ```sql
   -- 011_create_posts_table.sql
   CREATE TABLE posts (...);
   CREATE INDEX ...;
   ```

2. **Modelo de Dados**

   ```javascript
   // models/Post.js
   export class Post {
     static async create(postData) {...}
     static async findByUserId(userId, limit, offset) {...}
     static async findById(id) {...}
   }
   ```

3. **Validação Backend**

   ```javascript
   // middleware/postValidation.js
   export const validatePost = (req, res, next) => {
     const schema = getSchemaByType(req.body.type);
     // Joi validation logic
   };
   ```

4. **Controller e Rotas**

   ```javascript
   // controllers/postsController.js
   export const createPost = async (req, res) => {
     // Lógica de criação
   };

   export const getUserPosts = async (req, res) => {
     // Buscar posts do usuário
   };
   ```

### Fase 2: Componentes Frontend (Base)

**Agente Responsável**: Frontend Developer
**Estimativa**: 3-4 dias

#### Tarefas:

1. **PostComposer Base**

   ```typescript
   // Estrutura do componente principal
   // Estados: collapsed, expanded, loading
   // Integração com React Hook Form
   ```

2. **Formulários por Tipo**

   ```typescript
   // PublicacaoForm.tsx - Textarea simples + contador
   // DuvidaForm.tsx - Título + descrição + tags
   // EnqueteForm.tsx - Pergunta + opções dinâmicas
   // ExercicioForm.tsx - Enunciado + alternativas/rubrica
   ```

3. **Validação Frontend**
   ```typescript
   // Schemas Zod para cada tipo de post
   // Validação em tempo real
   // Feedback visual de erros
   ```

### Fase 3: Integração e API

**Agentes Responsáveis**: Frontend + Backend Developer
**Estimativa**: 2 dias

#### Tarefas:

1. **API Integration**

   ```typescript
   // hooks/usePosts.tsx
   export const useCreatePost = () => {
     return useMutation({...});
   };
   ```

2. **Feed Integration**

   ```typescript
   // Atualizar Feed.tsx para incluir PostComposer
   // Refresh automático após criação
   ```

3. **Error Handling**
   ```typescript
   // Toast notifications
   // Retry logic
   // Validação de rate limiting
   ```

### Fase 4: Refinamento e UX

**Agente Responsável**: UI/UX Designer + Frontend Developer
**Estimativa**: 2-3 dias

#### Tarefas:

1. **Animações e Transições**

   ```typescript
   // Framer Motion para expand/collapse
   // Loading states suaves
   // Feedback visual de sucesso
   ```

2. **Responsive Design**

   ```css
   /* Mobile-first approach */
   /* Adaptação para tablets/desktop */
   ```

3. **Acessibilidade**
   ```typescript
   // ARIA labels completos
   // Focus management
   // Keyboard navigation
   ```

## 🧪 Estratégia de Testes

### Backend Tests

```javascript
// tests/posts.test.js
describe("Posts API", () => {
  test("should create publicacao post");
  test("should create duvida with validation");
  test("should create enquete with options");
  test("should create exercicio with alternatives");
  test("should reject invalid data");
});
```

### Frontend Tests

```typescript
// PostComposer.test.tsx
describe("PostComposer", () => {
  test("renders collapsed state initially");
  test("expands when button clicked");
  test("switches between post types");
  test("validates required fields");
  test("submits form with correct data");
});
```

## 🚀 Deployment e Rollout

### Estratégia de Release

1. **Feature Flag**: Habilitar para usuários específicos
2. **A/B Testing**: Comparar com interface anterior
3. **Gradual Rollout**: 10% → 50% → 100% dos usuários
4. **Monitoring**: Métricas de uso e performance

### Métricas de Sucesso

- **Engagement**: Taxa de criação de posts
- **Completion**: Taxa de finalização dos formulários
- **Performance**: Tempo de carregamento < 2s
- **Errors**: Taxa de erro < 1%

## 🔒 Considerações de Segurança

### Validação e Sanitização

- **Input Sanitization**: HTML/XSS protection
- **Content Validation**: Tamanho máximo, caracteres permitidos
- **Spam Detection**: Filtros básicos de conteúdo repetitivo

### Privacidade

- **Soft Delete**: Manter histórico para moderação
- **GDPR Compliance**: Possibilidade de exportar/deletar dados

## 📈 Monitoramento e Analytics

### Métricas Técnicas

```javascript
// Logging estruturado
logger.info("post_created", {
  userId,
  postType: type,
  duration: endTime - startTime,
  source: "web",
});
```

### Business Intelligence

- Posts por tipo por dia/semana
- Taxa de conversão (visualização → criação)
- Tipos de post mais populares
- Performance por dispositivo/browser

## 🔄 Manutenção e Evolução

### Próximas Funcionalidades

1. **Rich Text Editor** - Formatação avançada
2. **Media Upload** - Imagens e vídeos
3. **Collaborative Posts** - Múltiplos autores
4. **Templates** - Posts pré-configurados
5. **Scheduling** - Agendamento de publicações

### Refatorações Futuras

1. **Microservices** - Separar serviço de posts
2. **Real-time** - WebSockets para colaboração
3. **AI Integration** - Sugestões automáticas de conteúdo
4. **Advanced Analytics** - ML para insights

## 👥 Equipe e Responsabilidades

### Backend Developer 🔧

- **Responsabilidades**: API, banco de dados, validação
- **Entregáveis**: Endpoints REST, migrations, testes
- **Timeline**: Fases 1 e 3

### Frontend Developer ⚛️

- **Responsabilidades**: Componentes React, integração de APIs
- **Entregáveis**: PostComposer, formulários, hooks
- **Timeline**: Fases 2, 3 e 4

### UI/UX Designer 🎨

- **Responsabilidades**: Design system, usabilidade
- **Entregáveis**: Componentes refinados, animações
- **Timeline**: Fase 4

### QA Engineer 🧪

- **Responsabilidades**: Testes automatizados e manuais
- **Entregáveis**: Suites de teste, casos de edge
- **Timeline**: Todas as fases (paralelo)

## 📋 Cronograma de Execução

### Semana 1: Fundação

- **Dias 1-2**: Migração BD + Modelo de dados (Backend)
- **Dias 3-5**: PostComposer base + formulários (Frontend)

### Semana 2: Integração

- **Dias 1-2**: API endpoints + validação (Backend)
- **Dias 3-4**: Integração Frontend + API (Frontend)
- **Dia 5**: Testes de integração (QA)

### Semana 3: Refinamento

- **Dias 1-3**: UX refinements + animações (Frontend + Designer)
- **Dias 4-5**: Testes finais + bugfixes (QA + Devs)

### Semana 4: Deploy

- **Dias 1-2**: Feature flag deployment
- **Dias 3-5**: Gradual rollout + monitoring

## ✅ Critérios de Aceitação

### Funcionalidades Principais

- [ ] Usuário pode criar postagem do tipo "Publicação"
- [ ] Usuário pode criar postagem do tipo "Dúvida"
- [ ] Usuário pode criar postagem do tipo "Enquete"
- [ ] Usuário pode criar postagem do tipo "Exercício"
- [ ] Posts aparecem no feed imediatamente após criação
- [ ] Validação funciona corretamente para todos os tipos

### Qualidade Técnica

- [ ] Performance: Loading < 2s, interação < 100ms
- [ ] Acessibilidade: Score > 95% no Lighthouse
- [ ] Testes: Coverage > 80% em componentes críticos
- [ ] Mobile: Interface funciona bem em telas pequenas
- [ ] Segurança: Inputs sanitizados, rate limiting ativo

### Experiência do Usuário

- [ ] Interface intuitiva (< 3 cliques para criar post)
- [ ] Feedback visual claro em todas as ações
- [ ] Mensagens de erro compreensíveis
- [ ] Animações suaves e não distrativas
- [ ] Compatibilidade cross-browser (Chrome, Firefox, Safari, Edge)

---

**Documento criado em**: 26 de Agosto de 2025  
**Versão**: 1.0  
**Próxima revisão**: Após implementação da Fase 1
