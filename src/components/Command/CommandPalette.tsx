import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Home, 
  Users, 
  BookOpen, 
  Calendar, 
  MessageCircle, 
  Settings, 
  Sun, 
  Moon,
  UserPlus,
  Bell,
  LogOut,
  User
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
  group: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
    }
  }, [open]);

  const commands: Command[] = [
    // Navigation
    {
      id: 'nav-home',
      label: 'Ir para Feed',
      description: 'Página principal com posts dos amigos',
      icon: <Home className="w-4 h-4" />,
      action: () => {
        navigate('/');
        onOpenChange(false);
      },
      keywords: ['feed', 'inicio', 'home', 'principal'],
      group: 'Navegação'
    },
    {
      id: 'nav-questions',
      label: 'Ir para Questões',
      description: 'Resolver questões de concursos',
      icon: <BookOpen className="w-4 h-4" />,
      action: () => {
        navigate('/questoes');
        onOpenChange(false);
      },
      keywords: ['questoes', 'exercicios', 'estudar', 'resolver'],
      group: 'Navegação'
    },
    {
      id: 'nav-calendar',
      label: 'Ir para Calendário',
      description: 'Organizar estudos e horários',
      icon: <Calendar className="w-4 h-4" />,
      action: () => {
        navigate('/calendario');
        onOpenChange(false);
      },
      keywords: ['calendario', 'agenda', 'horarios', 'cronograma'],
      group: 'Navegação'
    },
    {
      id: 'nav-friends',
      label: 'Ir para Amigos',
      description: 'Gerenciar conexões e amizades',
      icon: <Users className="w-4 h-4" />,
      action: () => {
        navigate('/amigos');
        onOpenChange(false);
      },
      keywords: ['amigos', 'conexoes', 'network', 'pessoas'],
      group: 'Navegação'
    },
    {
      id: 'nav-communities',
      label: 'Ir para Comunidades',
      description: 'Participar de comunidades de estudo',
      icon: <MessageCircle className="w-4 h-4" />,
      action: () => {
        navigate('/comunidades');
        onOpenChange(false);
      },
      keywords: ['comunidades', 'grupos', 'discussoes', 'forum'],
      group: 'Navegação'
    },
    {
      id: 'nav-study-rooms',
      label: 'Ir para Salas de Estudo',
      description: 'Entrar em salas de estudo colaborativo',
      icon: <Users className="w-4 h-4" />,
      action: () => {
        navigate('/sala');
        onOpenChange(false);
      },
      keywords: ['sala', 'estudo', 'colaborativo', 'grupo'],
      group: 'Navegação'
    },
    {
      id: 'nav-profile',
      label: 'Ir para Perfil',
      description: 'Ver e editar seu perfil',
      icon: <User className="w-4 h-4" />,
      action: () => {
        navigate('/perfil');
        onOpenChange(false);
      },
      keywords: ['perfil', 'profile', 'conta', 'usuario'],
      group: 'Navegação'
    },

    // Actions
    {
      id: 'action-add-friend',
      label: 'Adicionar Amigo',
      description: 'Buscar e adicionar novos amigos',
      icon: <UserPlus className="w-4 h-4" />,
      action: () => {
        navigate('/amigos?tab=search');
        onOpenChange(false);
      },
      keywords: ['adicionar', 'amigo', 'conectar', 'network'],
      group: 'Ações'
    },

    // Settings
    {
      id: 'theme-toggle',
      label: theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro',
      description: `Alternar para ${theme === 'dark' ? 'modo claro' : 'modo escuro'}`,
      icon: theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
      action: () => {
        toggleTheme();
        onOpenChange(false);
      },
      keywords: ['tema', 'claro', 'escuro', 'light', 'dark', 'noturno', 'branco'],
      group: 'Configurações'
    },

    // Account
    {
      id: 'account-logout',
      label: 'Sair',
      description: 'Fazer logout da conta',
      icon: <LogOut className="w-4 h-4" />,
      action: () => {
        logout();
        onOpenChange(false);
      },
      keywords: ['sair', 'logout', 'deslogar', 'exit'],
      group: 'Conta'
    }
  ];

  // Filter commands based on search term
  const filteredCommands = commands.filter(command => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      command.label.toLowerCase().includes(searchLower) ||
      command.description?.toLowerCase().includes(searchLower) ||
      command.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
    );
  });

  // Group filtered commands
  const groupedCommands = filteredCommands.reduce((groups, command) => {
    if (!groups[command.group]) {
      groups[command.group] = [];
    }
    groups[command.group].push(command);
    return groups;
  }, {} as Record<string, Command[]>);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Close on Escape
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Digite um comando ou busque por páginas..." 
        value={searchTerm}
        onValueChange={setSearchTerm}
        onKeyDown={handleKeyDown}
      />
      <CommandList>
        <CommandEmpty>
          <div className="text-center py-6">
            <Search className="w-12 h-12 mx-auto mb-4 text-app-text-muted" />
            <p className="text-app-text-muted font-medium">Nenhum comando encontrado</p>
            <p className="text-sm text-app-text-muted mt-1">
              Tente buscar por "feed", "questões", "amigos" ou outros termos
            </p>
          </div>
        </CommandEmpty>

        {Object.entries(groupedCommands).map(([group, commands], index) => (
          <div key={group}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {commands.map((command) => (
                <CommandItem
                  key={command.id}
                  onSelect={command.action}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                >
                  <div className="text-app-text-muted">{command.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-app-text">{command.label}</div>
                    {command.description && (
                      <div className="text-sm text-app-text-muted truncate">
                        {command.description}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}