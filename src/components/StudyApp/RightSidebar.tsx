import { PanelRight, ChevronRight, GraduationCap, Book } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useStudyApp, EXAMS } from '@/contexts/StudyAppContext';

export function RightSidebar() {
  const { state, dispatch } = useStudyApp();

  const handleToggleExam = (exam: string) => {
    if (exam === 'ENEM') {
      dispatch({ type: 'TOGGLE_ENEM', payload: !state.ui.ENEM_open });
      dispatch({ type: 'SET_SELECTED_EXAM', payload: 'ENEM' });
    }
  };

  const handleSelectDiscipline = (exam: string, discipline: string) => {
    dispatch({ type: 'SET_SELECTED_EXAM', payload: exam });
    dispatch({ type: 'SET_SELECTED_DISCIPLINE', payload: discipline });
    
    const mapping = EXAMS[exam as keyof typeof EXAMS]?.[discipline];
    if (mapping) {
      dispatch({ type: 'SET_SELECTED_CATEGORY', payload: mapping });
    }
  };

  return (
    <aside className="bg-app-bg-soft border border-app-border rounded-2xl sticky top-32">
      <div className="p-3 pb-0 flex items-center gap-2">
        <PanelRight className="w-4 h-4" />
        <div className="text-lg font-semibold text-app-text">Navegação</div>
      </div>
      
      <div className="p-3">
        <div className="text-sm text-app-text-muted mb-2">
          Selecione um exame e uma disciplina para listar as aulas.
        </div>

        {/* Exame: ENEM */}
        <div 
          className="flex items-center gap-2 p-2 rounded-xl border border-transparent cursor-pointer hover:bg-app-muted"
          onClick={() => handleToggleExam('ENEM')}
        >
          <ChevronRight 
            className={`w-4 h-4 transition-transform ${state.ui.ENEM_open ? 'rotate-90' : ''}`}
          />
          <GraduationCap className="w-4 h-4" />
          <div className="font-semibold text-app-text">ENEM</div>
        </div>
        
        {state.ui.ENEM_open && (
          <div className="ml-6 mt-1 space-y-1">
            <div 
              className="flex items-center gap-2 p-2 rounded-xl border border-transparent cursor-pointer hover:bg-app-muted"
              onClick={() => handleSelectDiscipline('ENEM', 'Matemática')}
            >
              <Book className="w-4 h-4" />
              Matemática
            </div>
            <div 
              className="flex items-center gap-2 p-2 rounded-xl border border-transparent cursor-pointer hover:bg-app-muted"
              onClick={() => handleSelectDiscipline('ENEM', 'Português')}
            >
              <Book className="w-4 h-4" />
              Português
            </div>
          </div>
        )}

        {/* Context chips */}
        <div className="mt-3 flex gap-2 flex-wrap">
          {state.ui.selectedExam && (
            <Badge className="bg-app-muted text-app-text border-app-border">
              <GraduationCap className="w-3 h-3 mr-1" />
              {state.ui.selectedExam}
            </Badge>
          )}
          {state.ui.selectedDiscipline && (
            <Badge className="bg-app-muted text-app-text border-app-border">
              <Book className="w-3 h-3 mr-1" />
              {state.ui.selectedDiscipline}
            </Badge>
          )}
        </div>
      </div>
    </aside>
  );
}