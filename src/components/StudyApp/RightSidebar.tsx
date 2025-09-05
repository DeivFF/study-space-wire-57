import { PanelRight, ChevronRight, GraduationCap, Book, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useStudyApp, EXAMS } from '@/contexts/StudyAppContext';
import { studyAPI, StudyType, Subject } from '@/services/studyApi';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

interface StudyTypeWithSubjects extends StudyType {
  subjects: Subject[];
  isOpen: boolean;
}

export const RightSidebar = forwardRef<{ refreshData: () => void }>((props, ref) => {
  const { state, dispatch, loadLessons } = useStudyApp();
  const [studyTypes, setStudyTypes] = useState<StudyTypeWithSubjects[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStudyTypes();
  }, []);

  const loadStudyTypes = async () => {
    try {
      setIsLoading(true);
      const types = await studyAPI.getStudyTypes();
      
      // Load subjects for each study type
      const typesWithSubjects = await Promise.all(
        types.map(async (type) => {
          const subjects = await studyAPI.getStudyTypeSubjects(type.id);
          return {
            ...type,
            subjects,
            isOpen: false
          };
        })
      );
      
      setStudyTypes(typesWithSubjects);
    } catch (error) {
      console.error('Error loading study types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStudyType = (studyTypeId: string) => {
    setStudyTypes(prev => prev.map(type => 
      type.id === studyTypeId 
        ? { ...type, isOpen: !type.isOpen }
        : type
    ));
  };

  const handleSelectSubject = async (studyTypeName: string, subjectId: string, subjectName: string) => {
    // Use the new action that includes persistence
    dispatch({ 
      type: 'SET_CATEGORY_WITH_PERSISTENCE', 
      payload: { 
        categoryId: subjectId, 
        examName: studyTypeName,
        disciplineName: subjectName
      } 
    });
    
    // Ensure the category exists in the state
    dispatch({ 
      type: 'ENSURE_CATEGORY', 
      payload: { 
        categoryId: subjectId, 
        categoryName: `${studyTypeName} - ${subjectName}` 
      } 
    });

    // Load lessons from the database  
    console.log('RightSidebar - About to call loadLessons for:', subjectId);
    try {
      await loadLessons(subjectId);
      console.log('RightSidebar - loadLessons completed for:', subjectId);
    } catch (error) {
      console.error('RightSidebar - loadLessons failed for:', subjectId, error);
    }
  };

  const handleEditStudyType = (studyTypeId: string) => {
    // TODO: Implementar modal de edição de tipo de estudo
    console.log('Edit study type:', studyTypeId);
  };

  const handleDeleteStudyType = async (studyTypeId: string) => {
    try {
      // Optimistically remove from UI first
      setStudyTypes(prev => prev.filter(type => type.id !== studyTypeId));
      
      // Then delete from backend
      await studyAPI.deleteStudyType(studyTypeId);
    } catch (error) {
      console.error('Error deleting study type:', error);
      // Reload data if deletion failed
      loadStudyTypes();
    }
  };

  const handleEditSubject = (subjectId: string) => {
    // TODO: Implementar modal de edição de disciplina
    console.log('Edit subject:', subjectId);
  };

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      // Optimistically remove from UI first
      setStudyTypes(prev => prev.map(type => ({
        ...type,
        subjects: type.subjects.filter(subject => subject.id !== subjectId)
      })));
      
      // Then delete from backend
      await studyAPI.deleteSubject(subjectId);
    } catch (error) {
      console.error('Error deleting subject:', error);
      // Reload data if deletion failed
      loadStudyTypes();
    }
  };

  // Expose refreshData method through ref
  useImperativeHandle(ref, () => ({
    refreshData: loadStudyTypes
  }));

  return (
    <aside className="bg-app-bg-soft border border-app-border rounded-2xl sticky top-32">
      <div className="p-3 pb-0 flex items-center gap-2">
        <PanelRight className="w-4 h-4" />
        <div className="text-lg font-semibold text-app-text">Navegação</div>
      </div>
      
      <div className="p-3">
        <div className="text-sm text-app-text-muted mb-2">
          Selecione um tipo de estudo e uma disciplina para listar as aulas.
        </div>

        {isLoading ? (
          <div className="text-sm text-app-text-muted">Carregando...</div>
        ) : (
          <div className="space-y-1">
            {studyTypes.map((studyType) => (
              <div key={studyType.id}>
                <div className="flex items-center gap-2 p-2 rounded-xl border border-transparent hover:bg-app-muted group">
                  <div 
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                    onClick={() => handleToggleStudyType(studyType.id)}
                  >
                    <ChevronRight 
                      className={`w-4 h-4 transition-transform ${studyType.isOpen ? 'rotate-90' : ''}`}
                    />
                    <GraduationCap className="w-4 h-4" style={{ color: studyType.color }} />
                    <div className="font-semibold text-app-text">{studyType.name}</div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-app-muted transition-opacity">
                        <MoreHorizontal className="w-4 h-4 text-app-text-muted" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-app-panel border-app-border">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditStudyType(studyType.id);
                        }}
                        className="text-app-text hover:bg-app-muted focus:bg-app-muted"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStudyType(studyType.id);
                        }}
                        className="text-app-danger hover:bg-app-danger/10 focus:bg-app-danger/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {studyType.isOpen && studyType.subjects.length > 0 && (
                  <div className="ml-6 mt-1 space-y-1">
                    {studyType.subjects.map((subject) => (
                      <div 
                        key={subject.id}
                        className="flex items-center gap-2 p-2 rounded-xl border border-transparent hover:bg-app-muted group"
                      >
                        <div 
                          className="flex items-center gap-2 flex-1 cursor-pointer"
                          onClick={() => handleSelectSubject(studyType.name, subject.id, subject.name)}
                        >
                          <Book className="w-4 h-4" style={{ color: subject.color }} />
                          {subject.name}
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-app-muted transition-opacity">
                              <MoreHorizontal className="w-4 h-4 text-app-text-muted" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-app-panel border-app-border">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSubject(subject.id);
                              }}
                              className="text-app-text hover:bg-app-muted focus:bg-app-muted"
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSubject(subject.id);
                              }}
                              className="text-app-danger hover:bg-app-danger/10 focus:bg-app-danger/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
                
                {studyType.isOpen && studyType.subjects.length === 0 && (
                  <div className="ml-6 mt-1 text-xs text-app-text-muted">
                    Nenhuma disciplina criada ainda
                  </div>
                )}
              </div>
            ))}
            
            {studyTypes.length === 0 && (
              <div className="text-sm text-app-text-muted">
                Nenhum tipo de estudo criado ainda
              </div>
            )}
          </div>
        )}

        {/* Context chips */}
        {studyTypes.length > 0 && (
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
        )}
      </div>
    </aside>
  );
});