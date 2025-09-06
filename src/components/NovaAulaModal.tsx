import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, FilePlus, List } from 'lucide-react';
import { useStudyApp } from '@/contexts/StudyAppContext';
import { studyAPI, StudyType, Subject, Lesson } from '@/services/studyApi';
import { useToast } from '@/hooks/use-toast';

interface NovaAulaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson?: Lesson | null;
  mode?: 'create' | 'edit';
}

interface SubjectWithStudyType extends Subject {
  studyTypeName: string;
}

export function NovaAulaModal({ open, onOpenChange, lesson, mode = 'create' }: NovaAulaModalProps) {
  const [activeTab, setActiveTab] = useState<'adicionar' | 'multiplas'>('adicionar');
  const [singleForm, setSingleForm] = useState({ 
    nome: '', 
    duracao: '', 
    subjectId: ''
  });
  const [bulkForm, setBulkForm] = useState({
    subjectId: ''
  });
  const [bulkText, setBulkText] = useState('');
  const [allSubjects, setAllSubjects] = useState<SubjectWithStudyType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const { dispatch, state, loadLessons } = useStudyApp();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadAllSubjects();
      
      // Populate form for edit mode
      if (mode === 'edit' && lesson) {
        setSingleForm({
          nome: lesson.title,
          duracao: lesson.duration_minutes?.toString() || '',
          subjectId: lesson.subject_id
        });
      } else {
        // Reset form for create mode
        setSingleForm({ nome: '', duracao: '', subjectId: '' });
      }
    }
  }, [open, mode, lesson]);

  const loadAllSubjects = async () => {
    setIsLoadingData(true);
    try {
      const studyTypes = await studyAPI.getStudyTypes();
      const allSubjectsData: SubjectWithStudyType[] = [];
      
      for (const studyType of studyTypes) {
        const subjects = await studyAPI.getStudyTypeSubjects(studyType.id);
        subjects.forEach(subject => {
          allSubjectsData.push({
            ...subject,
            studyTypeName: studyType.name
          });
        });
      }
      
      setAllSubjects(allSubjectsData);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar disciplinas",
        variant: "destructive"
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSaveSingle = async () => {
    if (!singleForm.nome.trim() || !singleForm.duracao || !singleForm.subjectId) {
      toast({
        title: "Erro",
        description: "Todos os campos obrigatórios devem ser preenchidos",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      if (mode === 'edit' && lesson) {
        // Update existing lesson
        await studyAPI.updateLesson(lesson.id.toString(), {
          title: singleForm.nome.trim(),
          duration_minutes: parseInt(singleForm.duracao)
        });

        toast({
          title: "Sucesso",
          description: "Aula atualizada com sucesso!",
        });
      } else {
        // Create new lesson
        await studyAPI.createLesson(singleForm.subjectId, {
          title: singleForm.nome.trim(),
          duration_minutes: parseInt(singleForm.duracao)
        });

        toast({
          title: "Sucesso",
          description: "Aula criada com sucesso!",
        });
      }

      // Reload lessons from the database if this subject is currently selected
      console.log('NovaAulaModal - Selected category ID:', state.selectedCategoryId);
      console.log('NovaAulaModal - Single form subject ID:', singleForm.subjectId);
      if (state.selectedCategoryId === singleForm.subjectId) {
        console.log('NovaAulaModal - Reloading lessons for subject:', singleForm.subjectId);
        await loadLessons(singleForm.subjectId);
      } else {
        console.log('NovaAulaModal - Not reloading lessons - different subject selected');
      }

      setSingleForm({ 
        nome: '', 
        duracao: '', 
        subjectId: ''
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : (mode === 'edit' ? "Erro ao atualizar aula" : "Erro ao criar aula"),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const parseBulkLessons = (text: string) => {
    if (!text.trim()) return [];
    const parts = text.split(';').map(s => s.trim()).filter(Boolean);
    const lessons = [];
    
    for (const part of parts) {
      const match = part.match(/^\s*"([^"]+)"\s*,\s*"?(\d+)"?\s*$/);
      if (match) {
        lessons.push({ nome: match[1], duracao: Number(match[2]) });
      }
    }
    return lessons;
  };

  const handleImportBulk = async () => {
    const lessons = parseBulkLessons(bulkText);
    if (lessons.length === 0 || !bulkForm.subjectId) {
      toast({
        title: "Erro",
        description: "Selecione uma disciplina e adicione aulas válidas",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      for (const lesson of lessons) {
        await studyAPI.createLesson(bulkForm.subjectId, {
          title: lesson.nome,
          duration_minutes: lesson.duracao
        });
      }

      // Reload lessons from the database if this subject is currently selected
      if (state.selectedCategoryId === bulkForm.subjectId) {
        await loadLessons(bulkForm.subjectId);
      }

      toast({
        title: "Sucesso",
        description: `${lessons.length} aulas criadas com sucesso!`,
      });

      setBulkText('');
      setBulkForm({ subjectId: '' });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar aulas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const bulkLessons = parseBulkLessons(bulkText);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl bg-app-panel border-app-border">
        <DialogHeader className="flex flex-row items-center gap-2 space-y-0 pb-4 border-b border-app-border">
          <GraduationCap className="w-5 h-5 text-app-text" />
          <DialogTitle className="text-app-text">{mode === 'edit' ? 'Editar aula' : 'Nova aula'}</DialogTitle>
        </DialogHeader>

        {/* Tabs - only show in create mode */}
        {mode === 'create' && (
          <div className="px-1 pb-4 border-b border-app-border">
            <div className="flex gap-2 p-1.5 bg-app-bg rounded-xl border border-app-border">
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                  activeTab === 'adicionar'
                    ? 'bg-app-bg-soft border-app-border text-app-text'
                    : 'border-transparent text-app-text-muted hover:text-app-text'
                }`}
                onClick={() => setActiveTab('adicionar')}
              >
                <FilePlus className="w-4 h-4" />
                Adicionar aula
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                  activeTab === 'multiplas'
                    ? 'bg-app-bg-soft border-app-border text-app-text'
                    : 'border-transparent text-app-text-muted hover:text-app-text'
                }`}
                onClick={() => setActiveTab('multiplas')}
              >
                <List className="w-4 h-4" />
                Múltiplas aulas
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="py-4">
          {(activeTab === 'adicionar' || mode === 'edit') ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-xs text-app-text-muted">Disciplina *</Label>
                <Select
                  value={singleForm.subjectId}
                  onValueChange={(value) => setSingleForm(prev => ({ ...prev, subjectId: value }))}
                  disabled={mode === 'edit'}
                >
                  <SelectTrigger className="bg-app-bg border-app-border text-app-text">
                    <SelectValue placeholder={isLoadingData ? "Carregando..." : "Selecione uma disciplina"} />
                  </SelectTrigger>
                  <SelectContent className="bg-app-panel border-app-border">
                    {allSubjects.map((subject) => (
                      <SelectItem 
                        key={subject.id} 
                        value={subject.id}
                        className="text-app-text hover:bg-app-muted focus:bg-app-muted"
                      >
                        {subject.studyTypeName} {'>'} {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-xs text-app-text-muted">Nome da aula *</Label>
                  <Input
                    id="nome"
                    placeholder="Ex.: Adjetivo"
                    value={singleForm.nome}
                    onChange={(e) => setSingleForm(prev => ({ ...prev, nome: e.target.value }))}
                    className="bg-app-bg border-app-border text-app-text placeholder:text-app-text-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duracao" className="text-xs text-app-text-muted">Duração (min) *</Label>
                  <Input
                    id="duracao"
                    type="number"
                    min="1"
                    placeholder="30"
                    value={singleForm.duracao}
                    onChange={(e) => setSingleForm(prev => ({ ...prev, duracao: e.target.value }))}
                    className="bg-app-bg border-app-border text-app-text placeholder:text-app-text-muted"
                  />
                </div>
              </div>
              
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-subject" className="text-xs text-app-text-muted">Disciplina *</Label>
                <Select
                  value={bulkForm.subjectId}
                  onValueChange={(value) => setBulkForm(prev => ({ ...prev, subjectId: value }))}
                >
                  <SelectTrigger className="bg-app-bg border-app-border text-app-text">
                    <SelectValue placeholder={isLoadingData ? "Carregando..." : "Selecione uma disciplina"} />
                  </SelectTrigger>
                  <SelectContent className="bg-app-panel border-app-border">
                    {allSubjects.map((subject) => (
                      <SelectItem 
                        key={subject.id} 
                        value={subject.id}
                        className="text-app-text hover:bg-app-muted focus:bg-app-muted"
                      >
                        {subject.studyTypeName} {'>'} {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aulas-lote" className="text-xs text-app-text-muted">Cole as aulas no formato abaixo</Label>
                <Textarea
                  id="aulas-lote"
                  rows={6}
                  placeholder={`"Adjetivo","30";"Substantivo","20";"Verbo","25"`}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="bg-app-bg border-app-border text-app-text placeholder:text-app-text-muted resize-none"
                />
                <div className="text-xs text-app-text-muted">
                  Exemplo: <code className="bg-app-muted px-1.5 py-0.5 rounded border border-app-border">"Adjetivo","30";"Substantivo","20"</code>
                </div>
              </div>

              {bulkLessons.length > 0 && bulkForm.subjectId && (
                <div className="p-3 bg-app-bg rounded-xl border border-app-border border-dashed">
                  <div className="text-xs text-app-text-muted mb-2">
                    Disciplina: {allSubjects.find(s => s.id === bulkForm.subjectId)?.studyTypeName} {'>'} {allSubjects.find(s => s.id === bulkForm.subjectId)?.name}
                  </div>
                  <div className="text-xs text-app-text-muted mb-2">Aulas detectadas:</div>
                  <ul className="ml-4 text-sm text-app-text space-y-1">
                    {bulkLessons.map((lesson, index) => (
                      <li key={index}><strong>{lesson.nome}</strong> — {lesson.duracao} min</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-app-border">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="bg-transparent border-app-border text-app-text hover:bg-app-muted"
          >
            Cancelar
          </Button>
          
          {(activeTab === 'adicionar' || mode === 'edit') ? (
            <Button
              onClick={handleSaveSingle}
              disabled={!singleForm.nome.trim() || !singleForm.duracao || !singleForm.subjectId || isLoading}
              className="bg-gradient-to-r from-app-accent to-app-accent-2 text-white hover:opacity-90"
            >
              {isLoading ? (mode === 'edit' ? 'Atualizando...' : 'Salvando...') : (mode === 'edit' ? 'Atualizar' : 'Salvar')}
            </Button>
          ) : (
            <Button
              onClick={handleImportBulk}
              disabled={bulkLessons.length === 0 || !bulkForm.subjectId || isLoading}
              className="bg-gradient-to-r from-app-accent to-app-accent-2 text-white hover:opacity-90"
            >
              {isLoading ? 'Importando...' : 'Importar em lote'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}