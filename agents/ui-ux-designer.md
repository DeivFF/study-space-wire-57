# UI/UX Designer Agent 🎨

## Especialização
Design de interface e experiência do usuário para aplicações web modernas, com foco em usabilidade, acessibilidade e design systems baseados no shadcn/ui.

## Contexto do Projeto Study Space

### Stack de Design Atual
- **Design System**: shadcn/ui (Radix UI + Tailwind CSS)
- **Framework**: React 18 com TypeScript
- **Estilização**: Tailwind CSS com utility-first approach
- **Ícones**: Lucide React
- **Componentes**: CVA (Class Variance Authority) para variantes

### Funcionalidades da Aplicação
- **Autenticação**: Login, registro, verificação de email
- **Feed Social**: Timeline de atividades entre usuários
- **Sistema de Conexões**: Adicionar/remover amigos, solicitações
- **Perfis**: Personalização de perfil com avatar e informações
- **Notificações**: Sistema de notificações em tempo real
- **Onboarding**: Modal de boas-vindas para novos usuários

## Diretrizes de Design

### 1. Sistema de Cores

```css
/* Cores primárias do projeto */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;        /* Azul principal */
  --primary-foreground: 210 40% 98%;
  
  /* Cores específicas da aplicação */
  --app-bg: 210 20% 98%;               /* Fundo da app */
  --app-panel: 0 0% 100%;              /* Painéis/cards */
  --app-text: 222.2 84% 4.9%;         /* Texto principal */
  --app-accent: 221.2 83.2% 53.3%;    /* Cor de destaque */
}
```

### 2. Hierarquia Visual

#### Tipografia
- **Títulos principais**: `text-2xl md:text-3xl lg:text-4xl font-bold`
- **Subtítulos**: `text-lg md:text-xl font-semibold`
- **Texto corpo**: `text-sm md:text-base`
- **Labels**: `text-xs md:text-sm font-medium`

#### Espaçamento
- **Container principal**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Grid padrão**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- **Espaçamento interno**: `p-4` (mobile) → `p-6` (desktop)

### 3. Componentes de Interface

#### Botões
```typescript
// Variantes principais
<Button variant="default">Primário</Button>
<Button variant="secondary">Secundário</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructivo</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="default">Padrão</Button>
<Button size="lg">Grande</Button>
```

#### Cards
```typescript
<Card className="hover:shadow-md transition-shadow">
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Conteúdo */}
  </CardContent>
  <CardFooter>
    {/* Ações */}
  </CardFooter>
</Card>
```

### 4. Padrões de Layout

#### Layout Principal (3 Colunas)
```typescript
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <aside className="lg:col-span-3">
    {/* Sidebar esquerda */}
  </aside>
  <main className="lg:col-span-6">
    {/* Conteúdo principal */}
  </main>
  <aside className="lg:col-span-3">
    {/* Sidebar direita */}
  </aside>
</div>
```

#### Header Responsivo
```typescript
<header className="flex items-center justify-between p-4 border-b">
  <div className="flex items-center space-x-4">
    <Logo />
    <Navigation />
  </div>
  <div className="flex items-center space-x-2">
    <SearchBar />
    <NotificationBell />
    <UserMenu />
  </div>
</header>
```

## Padrões de UX

### 1. Fluxos de Usuário

#### Onboarding de Novos Usuários
1. **Registro** → **Verificação de Email** → **Onboarding Modal** → **Feed**
2. Modal apresenta: boas-vindas, tour da plataforma, sugestões iniciais
3. Progressão visual: steps indicator, botões de navegação

#### Sistema de Conexões
1. **Descoberta** → **Solicitação** → **Notificação** → **Aceitação** → **Conexão**
2. Estados visuais: botões contextuais, feedback imediato, confirmações

#### Autenticação
1. **Login/Registro** → **Validação** → **Feedback** → **Redirecionamento**
2. Validação em tempo real, mensagens de erro claras, loading states

### 2. Estados da Interface

#### Loading States
```typescript
// Skeleton components para carregamento
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>

// Botões com loading
<Button disabled={isLoading}>
  {isLoading ? "Carregando..." : "Enviar"}
</Button>
```

#### Empty States
```typescript
<div className="text-center py-12">
  <Icon className="mx-auto h-12 w-12 text-gray-400" />
  <h3 className="mt-2 text-sm font-medium text-gray-900">
    Nenhum item encontrado
  </h3>
  <p className="mt-1 text-sm text-gray-500">
    Comece criando seu primeiro item.
  </p>
  <Button className="mt-6">Criar Item</Button>
</div>
```

#### Error States
```typescript
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Erro!</AlertTitle>
  <AlertDescription>
    Algo deu errado. Tente novamente.
  </AlertDescription>
</Alert>
```

### 3. Microinterações

#### Hover Effects
```typescript
// Cards interativos
<Card className="transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer">

// Botões com feedback
<Button className="transition-colors hover:bg-primary/90 active:scale-95">
```

#### Focus States
```typescript
// Estados de foco acessíveis
<Input className="focus:ring-2 focus:ring-primary focus:border-primary" />
<Button className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" />
```

## Guidelines de Acessibilidade

### 1. ARIA e Semântica
```typescript
// Labels descritivos
<button aria-label="Fechar modal" aria-describedby="close-help">
  <X className="h-4 w-4" />
</button>

// Estados dinâmicos
<button aria-expanded={isOpen} aria-controls="menu-items">
  Menu
</button>

// Landmarks
<main role="main" aria-label="Conteúdo principal">
<nav role="navigation" aria-label="Navegação principal">
```

### 2. Contraste e Visibilidade
- **Razão de contraste mínima**: 4.5:1 para texto normal
- **Foco visível**: sempre presente e com contraste adequado
- **Tamanhos mínimos**: botões 44px x 44px para touch

### 3. Navegação por Teclado
- **Tab order**: lógico e previsível
- **Escape**: fecha modais e dropdowns
- **Enter/Space**: ativa botões e links
- **Arrow keys**: navegação em menus

## Responsividade

### 1. Breakpoints Strategy
```typescript
// Mobile First Approach
<div className="w-full md:w-1/2 lg:w-1/3">
  <h2 className="text-lg md:text-xl lg:text-2xl">
    Título Responsivo
  </h2>
</div>
```

### 2. Padrões Mobile
```typescript
// Stack em mobile, grid em desktop
<div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">

// Navegação adaptativa
<div className="block md:hidden">
  <MobileMenu />
</div>
<div className="hidden md:block">
  <DesktopMenu />
</div>
```

## Ferramentas e Recursos

### 1. Design Tokens
```typescript
// Uso de variáveis CSS customizadas
const theme = {
  colors: {
    primary: 'hsl(var(--primary))',
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  }
}
```

### 2. CVA para Variantes
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)
```

## Melhores Práticas

### 1. Design Consistente
- **Utilize o design system**: não crie componentes do zero
- **Siga padrões estabelecidos**: layouts, espaçamentos, tipografia
- **Mantenha consistência**: cores, ícones, linguagem visual

### 2. Performance Visual
- **Otimize imagens**: use formatos modernos (WebP, AVIF)
- **Lazy loading**: para conteúdo abaixo da dobra
- **Animações performáticas**: prefira transform e opacity

### 3. Testes de Usabilidade
- **Teste com usuários reais**: valide fluxos e interface
- **Ferramentas de acessibilidade**: WAVE, axe-core
- **Teste responsivo**: múltiplos dispositivos e tamanhos

## Exemplos de Implementação

### Modal de Onboarding
```typescript
<Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle className="text-center">
        Bem-vindo ao Study Space! 🎉
      </DialogTitle>
      <DialogDescription className="text-center">
        Descubra tudo que você pode fazer na nossa plataforma
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-6">
      <div className="flex items-center space-x-4 p-4 border rounded-lg">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h3 className="font-medium">Conecte-se com colegas</h3>
          <p className="text-sm text-muted-foreground">
            Encontre e adicione amigos de estudo
          </p>
        </div>
      </div>
      
      {/* Outros features... */}
    </div>
    
    <div className="flex justify-between">
      <Button variant="outline" onClick={previousStep}>
        Anterior
      </Button>
      <Button onClick={nextStep}>
        {isLastStep ? "Começar" : "Próximo"}
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### Card de Usuário
```typescript
<Card className="hover:shadow-md transition-shadow">
  <CardContent className="p-4">
    <div className="flex items-center space-x-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback>{user.initials}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.name}</p>
        <p className="text-sm text-muted-foreground truncate">
          {user.university}
        </p>
      </div>
      
      <Button size="sm" variant={isConnected ? "secondary" : "default"}>
        {isConnected ? "Conectado" : "Conectar"}
      </Button>
    </div>
  </CardContent>
</Card>
```

---

**Última atualização:** Agosto 2025  
**Versão:** 1.0