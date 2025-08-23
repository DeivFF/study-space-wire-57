import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GraduationCap, FilePlus, List, X } from 'lucide-react';
import { useStudyApp } from '@/contexts/StudyAppContext';

interface NovaAulaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovaAulaModal({ open, onOpenChange }: NovaAulaModalProps) {
  const [activeTab, setActiveTab] = useState<'adicionar' | 'multiplas'>('adicionar');
  const [singleForm, setSingleForm] = useState({ nome: '', duracao: '' });
  const [bulkText, setBulkText] = useState('');
  const { dispatch, state } = useStudyApp();

  const handleSaveSingle = () => {
    if (!singleForm.nome.trim() || !singleForm.duracao) return;
    
    const newLesson = {
      id: `lesson-${Date.now()}`,
      title: singleForm.nome.trim(),
      difficulty: 'medio' as const,
      status: 'nao_iniciado' as const,
      accuracy: 0,
      resources: [],
      notes: '',
      flashcards: 0,
      flashcardsDue: 0,
      progress: 0,
      updatedAt: new Date().toISOString()
    };

    dispatch({ type: 'ADD_LESSON', payload: { categoryId: state.selectedCategoryId, lesson: newLesson } });
    setSingleForm({ nome: '', duracao: '' });
    onOpenChange(false);
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

  const handleImportBulk = () => {
    const lessons = parseBulkLessons(bulkText);
    if (lessons.length === 0) return;

    lessons.forEach(lesson => {
      const newLesson = {
        id: `lesson-${Date.now()}-${Math.random()}`,
        title: lesson.nome,
        difficulty: 'medio' as const,
        status: 'nao_iniciado' as const,
        accuracy: 0,
        resources: [],
        notes: '',
        flashcards: 0,
        flashcardsDue: 0,
        progress: 0,
        updatedAt: new Date().toISOString()
      };

      dispatch({ type: 'ADD_LESSON', payload: { categoryId: state.selectedCategoryId, lesson: newLesson } });
    });

    setBulkText('');
    onOpenChange(false);
  };

  const bulkLessons = parseBulkLessons(bulkText);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl bg-app-panel border-app-border">
        <DialogHeader className="flex flex-row items-center gap-2 space-y-0 pb-4 border-b border-app-border">
          <GraduationCap className="w-5 h-5 text-app-text" />
          <DialogTitle className="text-app-text">Nova aula</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
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

        {/* Content */}
        <div className="py-4">
          {activeTab === 'adicionar' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-xs text-app-text-muted">Nome da aula</Label>
                  <Input
                    id="nome"
                    placeholder="Ex.: Adjetivo"
                    value={singleForm.nome}
                    onChange={(e) => setSingleForm(prev => ({ ...prev, nome: e.target.value }))}
                    className="bg-app-bg border-app-border text-app-text placeholder:text-app-text-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duracao" className="text-xs text-app-text-muted">Duração (min)</Label>
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
              
              {singleForm.nome && singleForm.duracao && (
                <div className="mt-4 p-3 bg-app-bg rounded-xl border border-app-border border-dashed">
                  <div className="text-xs text-app-text-muted mb-2">Pré-visualização</div>
                  <ul className="ml-4 text-sm text-app-text">
                    <li><strong>{singleForm.nome}</strong> — {singleForm.duracao} min</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
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

              {bulkLessons.length > 0 && (
                <div className="p-3 bg-app-bg rounded-xl border border-app-border border-dashed">
                  <div className="text-xs text-app-text-muted mb-2">Itens detectados</div>
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
            className="bg-transparent border-app-border text-app-text hover:bg-app-muted"
          >
            Cancelar
          </Button>
          
          {activeTab === 'adicionar' ? (
            <Button
              onClick={handleSaveSingle}
              disabled={!singleForm.nome.trim() || !singleForm.duracao}
              className="bg-gradient-to-r from-app-accent to-app-accent-2 text-white hover:opacity-90"
            >
              Salvar
            </Button>
          ) : (
            <Button
              onClick={handleImportBulk}
              disabled={bulkLessons.length === 0}
              className="bg-app-bg border border-app-border text-app-text hover:bg-app-muted"
            >
              Importar em lote
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}