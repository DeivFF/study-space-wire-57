import { BookOpen, Import, Share2, Plus, FileText, FolderOpen, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';
import { useStudyApp } from '@/contexts/StudyAppContext';
import { NovaAulaModal } from '../NovaAulaModal';
import { CreateStudyTypeModal } from '../CreateStudyTypeModal';
import { CreateSubjectModal } from '../CreateSubjectModal';
import { useState } from 'react';

interface HeaderProps {
  onRefreshSidebar?: () => void;
}

export function Header({ onRefreshSidebar }: HeaderProps) {
  const { dispatch } = useStudyApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStudyTypeModalOpen, setIsStudyTypeModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  return (
    <header className="sticky top-16 z-10 bg-app-panel border-b border-app-border">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-3">
          <BookOpen className="w-5 h-5" />
          <div className="text-xl font-semibold text-app-text">Resumos</div>
          <div className="flex-1" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                className="bg-app-bg border-app-border text-app-text hover:bg-app-muted"
              >
                <Plus className="w-4 h-4" />
                Adicionar
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-app-panel border-app-border">
              <DropdownMenuItem 
                onClick={() => setIsStudyTypeModalOpen(true)}
                className="text-app-text hover:bg-app-muted focus:bg-app-muted"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Tipo de Estudo
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsSubjectModalOpen(true)}
                className="text-app-text hover:bg-app-muted focus:bg-app-muted"
              >
                <FileText className="w-4 h-4 mr-2" />
                Disciplina
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsModalOpen(true)}
                className="text-app-text hover:bg-app-muted focus:bg-app-muted"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Nova Aula
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
            onClick={() => window.location.href = '/biblioteca'}
            className="bg-app-bg border-app-border text-app-text hover:bg-app-muted"
          >
            <BookOpen className="w-4 h-4" />
            Biblioteca
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => dispatch({ type: 'SET_APP_MODE', payload: 'share' })}
            className="bg-app-bg border-app-border text-app-text hover:bg-app-muted"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar
          </Button>
        </div>
      </div>
      
      <NovaAulaModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      <CreateStudyTypeModal 
        open={isStudyTypeModalOpen} 
        onOpenChange={setIsStudyTypeModalOpen}
        onStudyTypeCreated={onRefreshSidebar}
      />
      <CreateSubjectModal 
        open={isSubjectModalOpen} 
        onOpenChange={setIsSubjectModalOpen}
        onSubjectCreated={onRefreshSidebar}
      />
    </header>
  );
}