# UI Agent - Interface e Experiência do Usuário

## Responsabilidades

Este agente é especializado em:
- Design de interfaces responsivas e acessíveis
- Animações e microinterações
- Componentes de feedback visual
- Otimização da experiência do usuário
- Design system e consistência visual

## Contexto do Projeto

### Stack Atual
- **UI Framework:** Radix UI + Tailwind CSS + shadcn/ui
- **Iconografia:** Lucide React
- **Animações:** Framer Motion (a ser adicionado)
- **Tema:** Sistema de cores customizável por tipo de estudo

## Tarefas Específicas

### 1. Sistema de Design Expandido

#### Color Palette Enhancement
```typescript
// src/lib/colors.ts
export const studyColors = {
  // Cores principais para tipos de estudo
  primary: {
    blue: '#3B82F6',
    red: '#EF4444',
    green: '#10B981',
    yellow: '#F59E0B',
    purple: '#8B5CF6',
    pink: '#EC4899',
    cyan: '#06B6D4',
    lime: '#84CC16',
  },
  
  // Variações para cada cor
  shades: {
    50: 'var(--color-50)',
    100: 'var(--color-100)',
    200: 'var(--color-200)',
    300: 'var(--color-300)',
    400: 'var(--color-400)',
    500: 'var(--color-500)',
    600: 'var(--color-600)',
    700: 'var(--color-700)',
    800: 'var(--color-800)',
    900: 'var(--color-900)',
  }
} as const;

export const generateColorShades = (baseColor: string) => {
  // Função para gerar variações de uma cor base
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const shades = {
    50: `rgb(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)})`,
    100: `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`,
    200: `rgb(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)})`,
    300: `rgb(${Math.min(255, r + 10)}, ${Math.min(255, g + 10)}, ${Math.min(255, b + 10)})`,
    400: `rgb(${r}, ${g}, ${b})`,
    500: baseColor,
    600: `rgb(${Math.max(0, r - 10)}, ${Math.max(0, g - 10)}, ${Math.max(0, b - 10)})`,
    700: `rgb(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)})`,
    800: `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`,
    900: `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`,
  };

  return shades;
};
```

### 2. Componentes de Layout Avançados

#### Dynamic Theme Provider
```typescript
// src/components/ui/theme-provider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { generateColorShades } from '@/lib/colors';

interface ThemeContextType {
  theme: 'light' | 'dark';
  primaryColor: string;
  setTheme: (theme: 'light' | 'dark') => void;
  setPrimaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) setTheme(saved as 'light' | 'dark');
    
    const savedColor = localStorage.getItem('primaryColor');
    if (savedColor) setPrimaryColor(savedColor);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('primaryColor', primaryColor);
    
    // Aplicar variações da cor primária como CSS variables
    const shades = generateColorShades(primaryColor);
    const root = document.documentElement;
    
    Object.entries(shades).forEach(([shade, color]) => {
      root.style.setProperty(`--color-${shade}`, color);
    });
  }, [primaryColor]);

  return (
    <ThemeContext.Provider value={{ theme, primaryColor, setTheme, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  return context;
};
```

#### Enhanced Card Component
```typescript
// src/components/ui/enhanced-card.tsx
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface EnhancedCardProps extends React.ComponentProps<typeof Card> {
  hover?: boolean;
  pressed?: boolean;
  gradient?: boolean;
  borderColor?: string;
  glowEffect?: boolean;
}

export const EnhancedCard = ({
  hover = true,
  pressed = true,
  gradient = false,
  borderColor,
  glowEffect = false,
  className,
  children,
  ...props
}: EnhancedCardProps) => {
  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.02 } : undefined}
      whileTap={pressed ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'transition-all duration-200',
          hover && 'hover:shadow-lg',
          gradient && 'bg-gradient-to-br from-white to-gray-50',
          glowEffect && 'shadow-lg shadow-primary/10',
          className
        )}
        style={{
          borderColor,
          boxShadow: glowEffect && borderColor 
            ? `0 0 20px ${borderColor}20` 
            : undefined
        }}
        {...props}
      >
        {children}
      </Card>
    </motion.div>
  );
};
```

### 3. Loading States Avançados

#### Skeleton Components
```typescript
// src/components/ui/skeletons.tsx
import { Skeleton } from '@/components/ui/skeleton';

export const StudyTypeCardSkeleton = () => (
  <div className="space-y-4 p-6 border rounded-lg">
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </div>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    
    <div className="flex items-center justify-between">
      <div className="flex space-x-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-6 w-12 rounded-full" />
    </div>
    
    <div className="space-y-2">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-8" />
      </div>
      <Skeleton className="h-2 w-full" />
    </div>
    
    <div className="flex space-x-2">
      <Skeleton className="h-8 flex-1" />
      <Skeleton className="h-8 flex-1" />
    </div>
  </div>
);

export const StudyTypeListSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <StudyTypeCardSkeleton key={i} />
    ))}
  </div>
);
```

#### Loading Spinner with Context
```typescript
// src/components/ui/loading-spinner.tsx
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export const LoadingSpinner = ({
  size = 'md',
  color = 'currentColor',
  text,
  className,
}: LoadingSpinnerProps) => {
  return (
    <div className={cn('flex flex-col items-center space-y-2', className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={cn(
          'border-2 border-t-transparent rounded-full',
          sizeClasses[size]
        )}
        style={{ borderColor: `${color}30`, borderTopColor: color }}
      />
      {text && (
        <p className="text-sm text-gray-600 font-medium">{text}</p>
      )}
    </div>
  );
};

// Spinner overlay para loading states
export const LoadingOverlay = ({ 
  isVisible, 
  text = 'Carregando...' 
}: { 
  isVisible: boolean; 
  text?: string; 
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </motion.div>
  );
};
```

### 4. Microinterações e Animações

#### Progress Animation Component
```typescript
// src/components/ui/animated-progress.tsx
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedProgressProps {
  value: number;
  max?: number;
  duration?: number;
  showPercentage?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export const AnimatedProgress = ({
  value,
  max = 100,
  duration = 1,
  showPercentage = true,
  color,
  size = 'md',
}: AnimatedProgressProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = Math.round((value / max) * 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {showPercentage && (
          <motion.span
            className="text-sm font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: duration }}
          >
            {percentage}%
          </motion.span>
        )}
      </div>
      
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color || '#3B82F6' }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};
```

#### Floating Action Button
```typescript
// src/components/ui/floating-action-button.tsx
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-left';
  visible?: boolean;
  color?: string;
}

export const FloatingActionButton = ({
  onClick,
  icon = <Plus className="w-6 h-6" />,
  label,
  position = 'bottom-right',
  visible = true,
  color = '#3B82F6',
}: FloatingActionButtonProps) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={cn('fixed z-50', positionClasses[position])}
        >
          <Button
            onClick={onClick}
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            style={{ backgroundColor: color }}
          >
            {icon}
            <span className="sr-only">{label}</span>
          </Button>
          
          {label && (
            <motion.div
              initial={{ opacity: 0, x: position === 'bottom-right' ? 10 : -10 }}
              whileHover={{ opacity: 1, x: 0 }}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 bg-gray-900 text-white px-2 py-1 rounded text-sm whitespace-nowrap',
                position === 'bottom-right' ? 'right-16' : 'left-16'
              )}
            >
              {label}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

### 5. Navigation Components

#### Enhanced Breadcrumb
```typescript
// src/components/layout/enhanced-breadcrumb.tsx
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
  color?: string;
  icon?: React.ReactNode;
}

interface EnhancedBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const EnhancedBreadcrumb = ({ items, className }: EnhancedBreadcrumbProps) => {
  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)}>
      <Link to="/" className="text-gray-500 hover:text-gray-700 transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      
      {items.map((item, index) => (
        <motion.div
          key={item.href}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center space-x-2"
        >
          <ChevronRight className="w-4 h-4 text-gray-400" />
          
          {index === items.length - 1 ? (
            <span 
              className="font-medium flex items-center space-x-1"
              style={{ color: item.color }}
            >
              {item.icon}
              <span>{item.label}</span>
            </span>
          ) : (
            <Link
              to={item.href}
              className="text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-1"
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          )}
        </motion.div>
      ))}
    </nav>
  );
};
```

### 6. Feedback Components

#### Toast System Enhancement
```typescript
// src/components/ui/enhanced-toast.tsx
import { toast as baseToast } from '@/components/ui/use-toast';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

interface ToastOptions {
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const toastColors = {
  success: 'border-green-500 text-green-700',
  error: 'border-red-500 text-red-700',
  warning: 'border-yellow-500 text-yellow-700',
  info: 'border-blue-500 text-blue-700',
};

export const toast = ({
  title,
  description,
  type = 'info',
  duration = 5000,
  action,
}: ToastOptions) => {
  const Icon = toastIcons[type];
  
  return baseToast({
    title: (
      <div className="flex items-center space-x-2">
        <Icon className="w-5 h-5" />
        <span>{title}</span>
      </div>
    ),
    description,
    duration,
    className: toastColors[type],
    action: action ? (
      <button
        onClick={action.onClick}
        className="text-sm font-medium underline underline-offset-4"
      >
        {action.label}
      </button>
    ) : undefined,
  });
};
```

#### Success Animations
```typescript
// src/components/ui/success-animation.tsx
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
}

export const SuccessAnimation = ({
  show,
  message = 'Sucesso!',
  onComplete,
}: SuccessAnimationProps) => {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/20"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="bg-white rounded-lg p-8 shadow-xl"
      >
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          </motion.div>
          
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-xl font-semibold text-gray-900"
          >
            {message}
          </motion.h3>
        </div>
      </motion.div>
    </motion.div>
  );
};
```

### 7. Empty States

#### Enhanced Empty State
```typescript
// src/components/ui/empty-state.tsx
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  illustration?: React.ReactNode;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  illustration,
}: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {illustration || (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6"
        >
          <Icon className="w-10 h-10 text-gray-400" />
        </motion.div>
      )}
      
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xl font-semibold text-gray-900 mb-2"
      >
        {title}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-gray-500 max-w-md mb-6"
      >
        {description}
      </motion.p>
      
      {action && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
```

## Entregáveis

### Design System
- Paleta de cores expandida com variações automáticas
- Componentes temáticos adaptáveis
- Sistema de tipografia consistente
- Spacing e sizing padronizados

### Componentes Avançados
- Cards com animações e estados interativos
- Loading states elaborados com skeletons
- Progress bars animadas
- Floating action buttons
- Enhanced breadcrumbs

### Animações e Microinterações
- Transições suaves entre estados
- Hover effects e feedback visual
- Success animations
- Loading animations customizadas
- Page transitions

### UX Enhancements
- Empty states informativos e acionáveis
- Error states com recovery actions
- Optimistic UI updates
- Drag and drop indicators
- Keyboard navigation support

## Responsividade

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Layout Adaptativo
- Grid responsivo para cards
- Navigation drawer em mobile
- Stacked forms em telas pequenas
- Touch-friendly targets

## Acessibilidade

### WCAG Compliance
- Contraste adequado (AA)
- Navigation por teclado
- Screen reader support
- Focus management
- ARIA labels apropriados

### Inclusive Design
- Suporte para motion reduction
- High contrast mode
- Font scaling support
- Color blind friendly palette