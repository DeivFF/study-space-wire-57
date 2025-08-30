# Padrões de Desenvolvimento

## Convenções de Código

### Nomenclatura

#### Arquivos e Pastas
- **Componentes React**: PascalCase (ex: `LoginForm.tsx`, `FeedHeader.tsx`)
- **Páginas**: PascalCase (ex: `Feed.tsx`, `Perfil.tsx`, `Auth.tsx`)
- **Utilitários e hooks**: camelCase (ex: `useAuth.ts`, `validation.ts`)
- **Pastas**: camelCase (ex: `components/`, `contexts/`, `utils/`)
- **Assets**: kebab-case (ex: `user-avatar.png`, `logo-light.svg`)

#### Variáveis e Funções
- **Variáveis**: camelCase (ex: `userName`, `isLoading`, `apiResponse`)
- **Funções**: camelCase (ex: `handleSubmit`, `fetchUserData`, `validateEmail`)
- **Constantes**: SCREAMING_SNAKE_CASE (ex: `API_BASE_URL`, `MAX_FILE_SIZE`)
- **Componentes**: PascalCase (ex: `Button`, `LoginForm`, `FeedHeader`)

#### Interfaces e Types
- **Interfaces**: PascalCase com prefixo "I" opcional (ex: `User`, `LoginFormProps`, `ApiResponse`)
- **Types**: PascalCase (ex: `UserRole`, `ThemeVariant`, `FormState`)
- **Enums**: PascalCase (ex: `UserStatus`, `NotificationType`)

### Estrutura de Arquivos

#### Componentes React
```typescript
// components/Auth/LoginForm.tsx
import React, { useState } from 'react';
import { ComponentType } from 'lucide-react';
import { useCustomHook } from '../../hooks/useCustomHook';

// 1. Interfaces/Types primeiro
interface LoginFormProps {
  onSubmit: (data: LoginData) => void;
  isLoading?: boolean;
}

// 2. Componente principal
export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading }) => {
  // 3. State hooks
  const [formData, setFormData] = useState(initialState);
  
  // 4. Custom hooks
  const { data, error } = useCustomHook();
  
  // 5. Funções auxiliares
  const handleSubmit = (e: React.FormEvent) => {
    // lógica aqui
  };
  
  // 6. Return JSX
  return (
    <div className="space-y-4">
      {/* JSX aqui */}
    </div>
  );
};
```

#### Hooks Personalizados
```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';

interface UseAuthReturn {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export const useAuth = (): UseAuthReturn => {
  // implementação
};
```

### Imports e Exports

#### Ordem dos Imports
1. **React e bibliotecas externas**
2. **Imports internos (componentes, hooks, utils)**
3. **Imports relativos**
4. **Tipos e interfaces**

```typescript
// 1. React e bibliotecas
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// 2. Internos absolutos
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

// 3. Relativos
import { validateForm } from '../utils/validation';
import { LoginFormProps } from './types';
```

#### Exports
- **Prefer named exports** para componentes
- **Default exports apenas para páginas**
- **Barrel exports** para índices de módulos

```typescript
// ✅ Named exports (preferido)
export const LoginForm: React.FC<Props> = () => {};

// ✅ Default export para páginas
export default Auth;

// ✅ Barrel exports em index.ts
export { LoginForm } from './LoginForm';
export { RegisterForm } from './RegisterForm';
```

## Padrões de Componentes React

### Estrutura Base de Componente

```typescript
interface ComponentProps {
  // Props tipadas
  title: string;
  isVisible?: boolean;
  onAction?: () => void;
  children?: React.ReactNode;
}

export const Component: React.FC<ComponentProps> = ({
  title,
  isVisible = true,
  onAction,
  children,
}) => {
  // Hooks e lógica
  
  if (!isVisible) return null;
  
  return (
    <div className="component-container">
      <h2>{title}</h2>
      {children}
    </div>
  );
};
```

### Padrões de State Management

#### Local State
```typescript
// ✅ Estado simples
const [isOpen, setIsOpen] = useState(false);

// ✅ Estado complexo com useReducer
const [state, dispatch] = useReducer(reducer, initialState);

// ✅ Estado derivado
const isFormValid = useMemo(() => {
  return email.length > 0 && password.length >= 8;
}, [email, password]);
```

#### Context API
```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Padrões de Props

#### Props Padrão
```typescript
// ✅ Destructuring com defaults
const Component: React.FC<Props> = ({
  title = 'Default Title',
  isVisible = true,
  onClick = () => {},
}) => {};

// ✅ Props condicionais
interface BaseProps {
  title: string;
}

interface WithAction extends BaseProps {
  hasAction: true;
  onAction: () => void;
}

interface WithoutAction extends BaseProps {
  hasAction?: false;
}

type ComponentProps = WithAction | WithoutAction;
```

### Padrões de Performance

#### Memoização
```typescript
// ✅ React.memo para componentes puros
export const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* renderização pesada */}</div>;
});

// ✅ useMemo para cálculos custosos
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// ✅ useCallback para funções estáveis
const handleClick = useCallback(() => {
  onAction(data);
}, [onAction, data]);
```

## TypeScript Best Practices

### Tipagem Rigorosa

#### Interfaces vs Types
```typescript
// ✅ Interfaces para objetos extensíveis
interface User {
  id: string;
  name: string;
  email: string;
}

interface AdminUser extends User {
  permissions: string[];
}

// ✅ Types para unions, primitivos, e computed types
type Status = 'idle' | 'loading' | 'success' | 'error';
type UserWithStatus = User & { status: Status };
```

#### Utility Types
```typescript
// ✅ Usar utility types do TypeScript
type PartialUser = Partial<User>;
type UserEmail = Pick<User, 'email'>;
type UserWithoutId = Omit<User, 'id'>;

// ✅ Generic constraints
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

function fetchData<T extends { id: string }>(endpoint: string): Promise<ApiResponse<T>> {
  // implementação
}
```

### Event Handlers

```typescript
// ✅ Tipos específicos para eventos
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // lógica
};

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // lógica
};
```

### Refs e DOM

```typescript
// ✅ Refs tipados
const inputRef = useRef<HTMLInputElement>(null);
const divRef = useRef<HTMLDivElement>(null);

// ✅ Forward refs
interface InputProps {
  placeholder?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ placeholder }, ref) => {
    return <input ref={ref} placeholder={placeholder} />;
  }
);
```

## Estilo e CSS

### Tailwind CSS Classes

#### Organização das Classes
```typescript
// ✅ Ordem lógica das classes
const buttonClasses = cn(
  // Layout
  "flex items-center justify-center",
  // Sizing
  "h-10 w-full px-4",
  // Spacing
  "gap-2",
  // Typography
  "text-sm font-medium",
  // Colors
  "bg-primary text-primary-foreground",
  // Effects
  "rounded-md transition-colors",
  // States
  "hover:bg-primary/90 disabled:opacity-50",
  // Responsive
  "md:w-auto"
);
```

#### Variantes com CVA
```typescript
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### Responsive Design

```typescript
// ✅ Mobile-first approach
<div className="w-full md:w-1/2 lg:w-1/3">
  <h2 className="text-lg md:text-xl lg:text-2xl">
    Título Responsivo
  </h2>
</div>
```

## Tratamento de Erros

### Error Boundaries
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### Async Error Handling
```typescript
// ✅ Try-catch em async functions
const handleSubmit = async (data: FormData) => {
  try {
    setLoading(true);
    const result = await apiCall(data);
    setSuccess(true);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Erro desconhecido');
  } finally {
    setLoading(false);
  }
};
```

## Testes (Preparação Futura)

### Estrutura de Testes
```typescript
// ✅ Estrutura padrão de teste
describe('LoginForm', () => {
  beforeEach(() => {
    // setup
  });

  it('should render login form', () => {
    // teste
  });

  it('should handle form submission', async () => {
    // teste assíncrono
  });
});
```

### Naming Convention para Testes
- **Arquivos**: `Component.test.tsx`
- **Describe blocks**: Nome do componente/função
- **It blocks**: "should + ação esperada"