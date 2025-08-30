# Componentes e UI

## Sistema de Design

O Study Space utiliza um sistema de design baseado no **shadcn/ui**, que combina **Radix UI** (para funcionalidade) com **Tailwind CSS** (para estilização). Este approach garante componentes acessíveis, customizáveis e consistentes.

### Filosofia do Design

- **Acessibilidade**: Todos os componentes seguem padrões ARIA
- **Consistência**: Design system unificado
- **Flexibilidade**: Fácil customização via props e classes CSS
- **Performance**: Componentes otimizados e tree-shakeable

## Estrutura de Componentes

### Hierarquia

```
src/components/
├── ui/                     # Componentes base (shadcn/ui)
│   ├── button.tsx         # Botões com variantes
│   ├── card.tsx           # Cards e containers
│   ├── input.tsx          # Inputs de formulário
│   ├── dialog.tsx         # Modals e dialogs
│   └── ...                # Outros componentes base
├── Auth/                   # Componentes de autenticação
├── Feed/                   # Componentes do feed
├── StudyApp/              # Componentes de estudo
└── Community/             # Componentes de comunidades
```

## Componentes Base (UI)

### Button

Componente fundamental com múltiplas variantes:

```typescript
import { Button } from '@/components/ui/button';

// Variantes disponíveis
<Button variant="default">Padrão</Button>
<Button variant="destructive">Destructive</Button>  
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Tamanhos disponíveis
<Button size="default">Padrão</Button>
<Button size="sm">Pequeno</Button>
<Button size="lg">Grande</Button>
<Button size="icon">Ícone</Button>
```

**Implementação:**
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8", 
        icon: "h-10 w-10",
      },
    },
  }
);
```

### Card

Sistema de cards para containers de conteúdo:

```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Título do Card</CardTitle>
    <CardDescription>Descrição opcional</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Conteúdo principal do card</p>
  </CardContent>
  <CardFooter>
    <Button>Ação</Button>
  </CardFooter>
</Card>
```

### Input

Inputs de formulário com suporte a estados:

```typescript
import { Input } from '@/components/ui/input';

<Input 
  type="email"
  placeholder="Digite seu email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full"
/>

// Com erro
<Input 
  type="password"
  placeholder="Digite sua senha"
  className={cn(
    "w-full",
    error && "border-destructive focus-visible:ring-destructive"
  )}
/>
```

### Dialog/Modal

Sistema de modais baseado em Radix:

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título do Modal</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      {/* Conteúdo do modal */}
    </div>
  </DialogContent>
</Dialog>
```

## Componentes de Funcionalidade

### Componentes de Autenticação

#### LoginForm
```typescript
// src/components/Auth/LoginForm.tsx
interface LoginFormProps {
  onForgotPassword: () => void;
  showSuccessMessage?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onForgotPassword,
  showSuccessMessage
}) => {
  // Implementação com validação e estados
};
```

#### RegisterForm
```typescript
// src/components/Auth/RegisterForm.tsx
interface RegisterFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onBack,
  onSuccess
}) => {
  // Implementação com validação complexa
};
```

### Componentes do Feed

#### FeedHeader
```typescript
// src/components/Feed/FeedHeader.tsx
export const FeedHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      {/* Logo, busca e notificações */}
    </div>
  );
};
```

#### FriendsPanel
```typescript
// src/components/Feed/FriendsPanel.tsx
interface FriendsPanelProps {
  friends: User[];
  onChatOpen: (friendId: string) => void;
}
```

## Sistema de Cores

### Cores Primárias

Definidas via CSS custom properties em `globals.css`:

```css
:root {
  /* Cores base */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  
  /* Cores da aplicação */
  --app-bg: 210 20% 98%;
  --app-panel: 0 0% 100%;
  --app-text: 222.2 84% 4.9%;
  --app-accent: 221.2 83.2% 53.3%;
}

[data-theme="dark"] {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 84% 4.9%;
}
```

### Aplicação das Cores

```typescript
// Usando cores do sistema
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Botão Primário
  </button>
</div>

// Usando cores da aplicação  
<div className="bg-app-bg text-app-text">
  <div className="bg-app-panel border-app-border">
    Panel da aplicação
  </div>
</div>
```

## Padrões de Estilização

### Utility-First com Tailwind

```typescript
// ✅ Composição com utilities
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border">
  <h2 className="text-lg font-semibold text-gray-900">Título</h2>
  <Button size="sm" variant="outline">Ação</Button>
</div>

// ✅ Responsividade
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid responsivo */}
</div>

// ✅ Estados interativos
<button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors">
  Botão Interativo
</button>
```

### Class Name Utility

Função `cn()` para combinar classes condicionalmente:

```typescript
import { cn } from '@/lib/utils';

// Combinação simples
<div className={cn("base-class", "additional-class")} />

// Condicional
<div className={cn(
  "base-class",
  isActive && "active-class",
  isError && "error-class"
)} />

// Com prop className
<div className={cn("default-styles", className)} />
```

### Variantes com CVA

Para componentes com múltiplas variações:

```typescript
import { cva } from "class-variance-authority";

const cardVariants = cva(
  "rounded-lg border shadow-sm", // classes base
  {
    variants: {
      variant: {
        default: "bg-white",
        primary: "bg-blue-50 border-blue-200",
        warning: "bg-yellow-50 border-yellow-200",
      },
      size: {
        sm: "p-3",
        md: "p-4", 
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

// Uso
<div className={cardVariants({ variant: "primary", size: "lg" })}>
  Card com variantes
</div>
```

## Padrões de Layout

### Grid System

```typescript
// Grid responsivo padrão
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <Card key={item.id} />)}
</div>

// Layout de aplicação
<div className="min-h-screen bg-app-bg">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-3">
        {/* Sidebar */}
      </aside>
      <main className="lg:col-span-6">
        {/* Conteúdo principal */}
      </main>
      <aside className="lg:col-span-3">
        {/* Sidebar direita */}
      </aside>
    </div>
  </div>
</div>
```

### Flexbox Patterns

```typescript
// Header com navegação
<header className="flex items-center justify-between p-4 border-b">
  <div className="flex items-center space-x-4">
    <Logo />
    <Navigation />
  </div>
  <UserMenu />
</header>

// Cards com footer fixo
<div className="flex flex-col h-full">
  <div className="flex-1 p-4">
    {/* Conteúdo flexível */}
  </div>
  <footer className="mt-auto p-4 border-t">
    {/* Footer fixo */}
  </footer>
</div>
```

## Animações e Transições

### Transições CSS

```typescript
// Transições padrão
<button className="transition-colors duration-200 hover:bg-blue-600">
  Hover suave
</button>

<div className="transition-all duration-300 ease-in-out transform hover:scale-105">
  Escala no hover
</div>
```

### Animações Keyframe

Definidas no Tailwind config:

```typescript
// tailwind.config.ts
keyframes: {
  'fade-in': {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  'slide-up': {
    '0%': { transform: 'translateY(100%)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
},
animation: {
  'fade-in': 'fade-in 0.3s ease-out',
  'slide-up': 'slide-up 0.3s ease-out',
}
```

Uso das animações:

```typescript
<div className="animate-fade-in">
  Elemento que aparece suavemente
</div>

<Modal className="animate-slide-up">
  Modal que desliza para cima
</Modal>
```

## Responsividade

### Breakpoints Padrão

```typescript
// Tailwind breakpoints
sm: 640px   // tablet pequeno
md: 768px   // tablet
lg: 1024px  // desktop pequeno  
xl: 1280px  // desktop
2xl: 1536px // desktop grande
```

### Patterns Responsivos

```typescript
// Stack em mobile, grid em desktop
<div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
  <Card />
  <Card />
</div>

// Sidebar collapsible
<div className="block lg:hidden">
  <MobileSidebar />
</div>
<div className="hidden lg:block">
  <DesktopSidebar />
</div>

// Typography responsiva
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Título Responsivo
</h1>
```

## Acessibilidade

### ARIA e Semântica

```typescript
// Botões semânticos
<button 
  type="submit"
  aria-label="Salvar formulário"
  aria-describedby="save-help-text"
  className="..."
>
  Salvar
</button>

// Labels associados
<div className="space-y-2">
  <label htmlFor="email" className="text-sm font-medium">
    Email
  </label>
  <input 
    id="email"
    type="email" 
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : undefined}
  />
  {hasError && (
    <p id="email-error" className="text-sm text-red-600">
      Email inválido
    </p>
  )}
</div>
```

### Focus e Navegação

```typescript
// Estados de focus visíveis
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Foco acessível
</button>

// Skip links
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0"
>
  Pular para conteúdo principal
</a>
```

## Melhores Práticas

### Performance

- **Lazy Loading**: Componentes grandes com `React.lazy()`
- **Memoização**: `React.memo()` para componentes puros
- **Tree Shaking**: Import apenas componentes necessários
- **CSS Purge**: Tailwind remove classes não utilizadas

### Manutenibilidade

- **Componentes Pequenos**: Princípio de responsabilidade única
- **Props Tipadas**: TypeScript para todas as interfaces
- **Documentação**: Props comentadas e exemplos de uso
- **Consistência**: Seguir padrões estabelecidos

### Exemplo Completo

```typescript
interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  className
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      await onAddToCart(product.id);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className={cn("overflow-hidden transition-shadow hover:shadow-md", className)}>
      <div className="aspect-square relative">
        <img 
          src={product.image} 
          alt={product.name}
          className="object-cover w-full h-full"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg truncate">{product.name}</h3>
        <p className="text-muted-foreground text-sm line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-lg">R$ {product.price}</span>
          <Button 
            size="sm"
            onClick={handleAddToCart}
            disabled={isLoading}
            className="min-w-[80px]"
          >
            {isLoading ? "..." : "Adicionar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```