# Plano de Execução - Sistema de Posts com Design Visual Aprimorado

## 📋 Visão Geral da Tarefa

### Objetivo
Implementar o design visual dos posts já criados no sistema seguindo exatamente o estilo do arquivo `postagem.html`, convertendo o CSS puro para componentes React com Tailwind CSS e shadcn/ui, mantendo a funcionalidade dinâmica dos 4 tipos de post.

### Escopo
- **Converter design HTML/CSS** do `postagem.html` para React components
- **Manter funcionalidade completa** do sistema de posts já implementado
- **Aplicar estilo consistente** para os 4 tipos: publicação, dúvida, enquete, exercício
- **Garantir responsividade** e acessibilidade
- **Preservar interações** (curtir, comentar, compartilhar)

## 🎯 Agentes Selecionados

### 1. **UI/UX Designer** - Agente Principal
**Responsabilidade:** Análise e conversão do design
- Analisar estilo visual do `postagem.html`
- Definir componentes e estrutura visual
- Especificar cores, tipografia e espaçamentos
- Garantir consistência visual entre tipos de post

### 2. **Frontend Developer** - Agente de Implementação
**Responsabilidade:** Desenvolvimento dos componentes
- Implementar componentes React com TypeScript
- Converter CSS para classes Tailwind
- Integrar com shadcn/ui components
- Manter funcionalidade de estado e interações

### 3. **Tech Lead** - Agente de Supervisão
**Responsabilidade:** Arquitetura e qualidade
- Revisar estrutura de componentes
- Garantir padrões de código
- Validar performance e acessibilidade
- Supervisionar integração com sistema existente

## 📊 Análise do Design Atual

### Elementos Visuais Identificados no `postagem.html`

#### **Card Structure**
```css
.card {
  background: #fff;
  border: 1px solid #e2e7f0;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(15,23,42,0.08);
  margin-bottom: 16px;
}
```

#### **Header com Ícones**
- **Publicação:** `pen-line` icon
- **Dúvida:** `help-circle` icon  
- **Enquete:** `bar-chart-2` icon
- **Exercício:** `pencil-ruler` icon

#### **Typography**
- **Font:** ui-sans-serif, system-ui
- **Author:** font-weight: 600
- **Time:** font-size: 12px, color: #5e6470
- **Content:** line-height: 1.5

#### **Interaction Elements**
- **Buttons:** border-radius: 8px, padding: 6px 12px
- **Hover:** background: #f1f3f8
- **Chips:** border-radius: 999px, border: 1px solid #e2e7f0

#### **Colors Palette**
- **Background:** #f6f7fb
- **Card Background:** #fff
- **Border:** #e2e7f0
- **Text Primary:** #12131a
- **Text Secondary:** #5e6470
- **Accent:** #2962ff

### Componentes Existentes para Atualizar
- `src/components/StudyFeed/StudyPost.tsx` - Componente principal
- CSS classes personalizadas (precisam ser criadas)

## 🗓️ Cronograma de Execução

### **Fase 1: Análise e Planejamento** (UI/UX Designer)
- [ ] Análise detalhada do design `postagem.html`
- [ ] Mapeamento de componentes visuais
- [ ] Definição de classe Tailwind equivalentes
- [ ] Especificação de variantes por tipo de post

### **Fase 2: Criação de Componentes Base** (Frontend Developer)
- [ ] Criar arquivo de CSS customizado ou classes Tailwind
- [ ] Implementar componente `PostCard` base
- [ ] Criar variantes para cada tipo de post
- [ ] Implementar sistema de ícones

### **Fase 3: Implementação de Tipos Específicos** (Frontend Developer)
- [ ] **Publicação:** Layout básico de texto
- [ ] **Dúvida:** Título + conteúdo + tags visuais
- [ ] **Enquete:** Opções com radio buttons + timer
- [ ] **Exercício:** Múltipla escolha + chips de dificuldade

### **Fase 4: Interações e Estados** (Frontend Developer) 
- [ ] Sistema de curtidas com animação
- [ ] Contador de comentários
- [ ] Estados hover e active
- [ ] Loading states

### **Fase 5: Integração e Testes** (Tech Lead)
- [ ] Integrar com `StudyPost.tsx` existente
- [ ] Testes de responsividade
- [ ] Validação de acessibilidade
- [ ] Performance review

### **Fase 6: Refinamento Visual** (UI/UX Designer + Frontend Developer)
- [ ] Ajustes finais de espaçamento
- [ ] Animações e transições
- [ ] Consistency check
- [ ] Testes cross-browser

## 🔧 Especificações Técnicas

### **Estrutura de Arquivos**
```
src/components/Posts/
├── PostCard/
│   ├── PostCard.tsx           # Componente principal
│   ├── PostHeader.tsx         # Header com ícone e tipo
│   ├── PostContent.tsx        # Conteúdo específico por tipo
│   ├── PostInteractions.tsx   # Botões de interação
│   └── index.ts               # Exports
├── PostTypes/
│   ├── PublicacaoPost.tsx
│   ├── DuvidaPost.tsx
│   ├── EnquetePost.tsx
│   └── ExercicioPost.tsx
└── posts.css                  # Estilos customizados
```

### **Classes Tailwind Principais**
```css
/* Card */
.post-card: bg-white border border-gray-200 rounded-2xl shadow-lg mb-4

/* Header */
.post-header: p-3 border-b border-gray-200 flex items-center gap-2

/* Content */
.post-content: p-4

/* Author */
.post-author: flex items-center gap-3 mb-3

/* Interactions */
.post-interactions: flex items-center gap-2 py-2 border-t border-gray-200
```

### **Props Interface**
```typescript
interface PostCardProps {
  post: {
    id: string;
    type: 'publicacao' | 'duvida' | 'enquete' | 'exercicio';
    author: { name: string; avatar: string; };
    content: string;
    data: any; // Dados específicos por tipo
    tags?: string[];
    createdAt: string;
    likes: number;
    comments: Comment[];
  };
  onLike: (postId: string) => void;
  onComment: (postId: string, comment: string) => void;
}
```

## ✅ Critérios de Aceitação

### **Visual**
- [ ] Design idêntico ao `postagem.html`
- [ ] Responsivo em todos os breakpoints
- [ ] Animações suaves nos hovers
- [ ] Tipografia consistente

### **Funcional** 
- [ ] Todos os 4 tipos funcionando corretamente
- [ ] Interações (curtir, comentar) preservadas
- [ ] Estado persistente na interface
- [ ] Loading states adequados

### **Código**
- [ ] TypeScript sem erros
- [ ] Componentes reutilizáveis
- [ ] Props bem tipadas
- [ ] Performance otimizada

### **Acessibilidade**
- [ ] Contraste adequado (WCAG AA)
- [ ] Navegação por teclado
- [ ] Screen readers compatíveis
- [ ] Focus indicators visíveis

## 🚀 Pontos de Atenção

### **Desafios Técnicos**
1. **Conversão CSS → Tailwind:** Manter fidelidade visual
2. **Tipos dinâmicos:** Renderização condicional por tipo
3. **Estados complexos:** Enquetes e exercícios interativos
4. **Performance:** Renderização de listas grandes

### **Decisões Arquiteturais**
1. **Componente único vs separados:** Usar componente base + variantes
2. **CSS customizado vs Tailwind puro:** Híbrido para casos específicos
3. **Estado local vs global:** Manter interações locais
4. **Animações:** CSS transitions vs Framer Motion

## 📝 Entregáveis

### **Código**
- [ ] Componente `PostCard` atualizado
- [ ] Arquivo CSS customizado (se necessário)
- [ ] Tipos TypeScript atualizados
- [ ] Documentação de componentes

### **Testes**
- [ ] Posts visuais funcionando no Feed
- [ ] Todos os tipos renderizando corretamente
- [ ] Interações funcionais
- [ ] Responsividade validada

### **Documentação**
- [ ] Guia de uso dos componentes
- [ ] Especificação de props
- [ ] Exemplos de implementação

---

**Próximo Passo:** Iniciar Fase 1 com o agente UI/UX Designer para análise detalhada do design alvo.