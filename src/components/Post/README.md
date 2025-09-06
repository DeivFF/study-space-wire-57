# Sistema de Componentes para Criação de Posts

Este sistema fornece uma interface completa e intuitiva para criação de diferentes tipos de posts na plataforma de estudos.

## Arquitetura dos Componentes

### 📁 Estrutura de Arquivos
```
src/components/Post/
├── PostComposer/
│   ├── PostComposer.tsx          # Componente principal
│   ├── PostTypeSelector.tsx      # Seletor de tipos de post
│   ├── TagInput.tsx              # Input para tags
│   ├── schemas.ts                # Schemas de validação Zod
│   ├── hooks/
│   │   └── usePostCreation.tsx   # Hook para criação de posts
│   └── forms/
│       ├── PublicacaoForm.tsx    # Formulário para publicações
│       ├── DuvidaForm.tsx        # Formulário para dúvidas
│       ├── ExercicioForm.tsx     # Formulário para exercícios
│       └── DesafioForm.tsx       # Formulário para desafios
└── index.ts                      # Exportações principais
```

## 🎯 Tipos de Post Suportados

### 1. **Publicação** 📚
- Compartilhamento de conhecimento, resumos e materiais
- Campos: título, conteúdo, categoria, fonte/referência
- Ideal para: resumos, explicações, dicas de estudo

### 2. **Dúvida** ❓
- Perguntas e solicitações de ajuda
- Campos: título, descrição, categoria*, nível de dificuldade, contexto
- Ideal para: tirar dúvidas, buscar explicações

### 3. **Exercício** 📝
- Compartilhamento de exercícios e questões
- Campos: título, enunciado, categoria*, tipo, resolução, fonte
- Ideal para: prática, questões de prova, listas de exercício

### 4. **Desafio** 🏆
- Criação de desafios para a comunidade
- Campos: título, descrição, categoria*, prazo, critérios, recompensa
- Ideal para: competições, projetos colaborativos

*Campos obrigatórios

## 🚀 Como Usar

### Uso Básico
```tsx
import { PostComposer } from '@/components/Post';

function Feed() {
  const handlePostCreated = (newPost) => {
    console.log('Novo post criado:', newPost);
    // Atualizar lista de posts
  };

  return (
    <PostComposer 
      onPostCreated={handlePostCreated}
      className="mb-6"
    />
  );
}
```

### Uso de Forms Individuais
```tsx
import { DuvidaForm, usePostCreation } from '@/components/Post';

function CreateDuvida() {
  const { createPost, isLoading } = usePostCreation();

  return (
    <DuvidaForm
      onSubmit={createPost}
      isLoading={isLoading}
      initialData={{ /* dados pré-preenchidos */ }}
    />
  );
}
```

## 🎨 Estados Visuais

O componente principal (`PostComposer`) possui 5 estados visuais:

1. **Collapsed**: Estado inicial compacto
2. **Type Selection**: Seleção do tipo de post
3. **Form**: Preenchimento do formulário específico
4. **Loading**: Durante a criação do post
5. **Success**: Confirmação de sucesso

## ✨ Funcionalidades

### 🔍 Progressive Disclosure
- Interface começa simples e se expande conforme necessário
- Reduz cognitive load do usuário
- Melhora a experiência em dispositivos móveis

### 🎯 Validação em Tempo Real
- Validação usando Zod schemas
- Feedback imediato para o usuário
- Prevenção de erros de envio

### 📱 Design Responsivo
- Mobile-first approach
- Layouts adaptativos para diferentes telas
- Otimizado para touch interfaces

### ♿ Acessibilidade
- ARIA labels adequados
- Navegação por teclado
- Focus management
- Contraste adequado

### 🏷️ Sistema de Tags
- Input inteligente com validação
- Sugestões visuais
- Limite de tags configurável
- Remoção fácil de tags

## 🔧 Personalização

### Schemas de Validação
```tsx
// Exemplo de schema customizado
const customSchema = basePostSchema.extend({
  customField: z.string().min(1, "Campo obrigatório")
});
```

### Componente de Form Customizado
```tsx
interface CustomFormProps {
  onSubmit: (data: CustomFormData) => Promise<boolean>;
  isLoading?: boolean;
  initialData?: Partial<CustomFormData>;
}

export const CustomForm: React.FC<CustomFormProps> = ({
  onSubmit,
  isLoading,
  initialData
}) => {
  // Implementação do form
};
```

## 🎨 Animações

Utiliza Framer Motion para:
- Transições suaves entre estados
- Feedback visual durante ações
- Micro-interações que melhoram UX

## 🔌 Integração com APIs

O hook `usePostCreation` se integra automaticamente com:
- Sistema de autenticação (`AuthContext`)
- APIs do backend (`/api/posts/:type`)
- Sistema de toast para feedback
- Tratamento de erros

## 📋 Validações Implementadas

### Gerais
- Conteúdo: 1-10.000 caracteres
- Título: 1-255 caracteres (quando aplicável)
- Tags: máximo 10, cada uma com até 50 caracteres
- Posts anônimos suportados

### Específicas por Tipo
- **Dúvida/Exercício/Desafio**: Categoria obrigatória
- **Desafio**: Prazo deve ser data futura
- **Exercício**: Tipos específicos (múltipla escolha, dissertativo, etc.)

## 🔐 Segurança

- Sanitização automática de conteúdo
- Rate limiting no backend
- Validação server-side
- Autenticação obrigatória

## 📈 Performance

- Lazy loading de componentes
- Memoização de componentes pesados
- Debounce em inputs de busca
- Otimizações de re-render

## 🧪 Testes

Para testar o sistema:
1. Inicie o backend: `cd backend && bun run dev`
2. Inicie o frontend: `npm run dev`
3. Acesse http://localhost:8080
4. Faça login na aplicação
5. Teste cada tipo de post no Feed

## 🐛 Troubleshooting

### Problemas Comuns

**Post não está sendo criado:**
- Verifique se o backend está rodando
- Confirme se o token de autenticação está válido
- Verifique logs do console para erros de validação

**Componente não está renderizando:**
- Confirme se o usuário está logado
- Verifique se todas as dependências estão instaladas
- Confirme se o path dos imports está correto

**Animações não funcionam:**
- Verifique se `framer-motion` está instalado
- Confirme se não há conflitos de CSS

### Logs Úteis
```tsx
// Para debug, adicione logs no componente
console.log('Estado atual:', state);
console.log('Tipo selecionado:', selectedType);
console.log('Dados do form:', formData);
```

## 🔮 Próximos Passos

- [ ] Suporte a upload de imagens
- [ ] Preview em tempo real
- [ ] Templates de post
- [ ] Rascunhos automáticos
- [ ] Colaboração em tempo real
- [ ] Integração com IA para sugestões