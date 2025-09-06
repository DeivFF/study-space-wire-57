import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Users, MessageCircle, DoorOpen, BookOpen, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderNavigationProps {
  className?: string;
}

export function HeaderNavigation({ className = '' }: HeaderNavigationProps) {
  const [isExplorarOpen, setIsExplorarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExplorarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if current route is active
  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsExplorarOpen(false);
  };

  const explorarOptions = [
    {
      label: 'Comunidades',
      path: '/comunidades',
      icon: Users,
      description: 'Grupos de estudo'
    },
    {
      label: 'Feed',
      path: '/feed', 
      icon: MessageCircle,
      description: 'Rede social de estudos'
    },
    {
      label: 'Sala',
      path: '/sala',
      icon: DoorOpen,
      description: 'Salas colaborativas'
    }
  ];

  return (
    <nav className={`hidden md:flex items-center gap-1 ${className}`}>
      {/* Questões */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleNavigation('/questoes')}
        className={`relative px-3 py-2 text-sm font-medium transition-colors ${
          isActive('/questoes')
            ? 'text-primary bg-primary/10 hover:bg-primary/20'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
        <HelpCircle className="w-4 h-4 mr-1.5" />
        Questões
      </Button>

      {/* Biblioteca */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleNavigation('/biblioteca')}
        className={`relative px-3 py-2 text-sm font-medium transition-colors ${
          isActive('/biblioteca')
            ? 'text-primary bg-primary/10 hover:bg-primary/20'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
        <BookOpen className="w-4 h-4 mr-1.5" />
        Biblioteca
      </Button>

      {/* Explorar Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExplorarOpen(!isExplorarOpen)}
          className={`relative px-3 py-2 text-sm font-medium transition-colors ${
            isActive('/comunidades') || isActive('/feed') || isActive('/sala')
              ? 'text-primary bg-primary/10 hover:bg-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          Explorar
          <ChevronDown className={`w-4 h-4 ml-1.5 transition-transform ${
            isExplorarOpen ? 'rotate-180' : ''
          }`} />
        </Button>

        {isExplorarOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-background border border-border rounded-lg shadow-lg py-2 z-50">
            {explorarOptions.map((option) => {
              const IconComponent = option.icon;
              const isOptionActive = isActive(option.path);
              
              return (
                <button
                  key={option.path}
                  onClick={() => handleNavigation(option.path)}
                  className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                    isOptionActive
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <IconComponent className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}