import { BookOpen, Moon, Sun, Import, Share2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useStudyApp } from '@/contexts/StudyAppContext';
import { NovaAulaModal } from '../NovaAulaModal';
import { useState } from 'react';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { dispatch } = useStudyApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 bg-app-panel border-b border-app-border px-4 py-3 flex items-center gap-3">
      <BookOpen className="w-5 h-5" />
      <div className="text-xl font-semibold text-app-text">Resumos</div>
      <div className="flex-1" />
      
      <Button 
        variant="outline" 
        onClick={toggleTheme}
        className="bg-app-bg border-app-border text-app-text hover:bg-app-muted"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        <span className="text-sm">Tema</span>
      </Button>
      
      <Button 
        variant="outline"
        onClick={() => dispatch({ type: 'SET_APP_MODE', payload: 'import' })}
        className="bg-app-bg border-app-border text-app-text hover:bg-app-muted"
      >
        <Import className="w-4 h-4" />
        Importar
      </Button>
      
      <Button 
        variant="outline"
        onClick={() => dispatch({ type: 'SET_APP_MODE', payload: 'share' })}
        className="bg-app-bg border-app-border text-app-text hover:bg-app-muted"
      >
        <Share2 className="w-4 h-4" />
        Compartilhar
      </Button>
      
      <Button 
        onClick={() => setIsModalOpen(true)}
        className="bg-gradient-to-r from-app-accent to-app-accent-2 text-white font-semibold"
      >
        <Plus className="w-4 h-4" />
        Nova Aula
      </Button>
      
      <NovaAulaModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </header>
  );
}