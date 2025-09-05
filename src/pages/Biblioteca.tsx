import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, Search, LayoutGrid, List,
  FileText, Headphones, Sparkles, ListChecks, File, Eye, Bookmark, 
  MoreHorizontal, Tag, HardDrive, Calendar, Book, Hash, PlayCircle,
  Package, Play, Download, Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StudyAppProvider } from '@/contexts/StudyAppContext';
import { FlashcardPreview } from '@/components/StudyApp/FlashcardPreview';

// Mock data - dados dos recursos
const RESOURCES = [
  {
    id: 'r1',
    type: 'pdf',
    title: 'ENEM - Matemática: Funções (Apostila)',
    discipline: 'Matemática',
    tags: ['enem', 'funções', 'graficos'],
    size: 3.4,
    updated: '2025-08-20',
    url: 'about:blank'
  },
  {
    id: 'r2',
    type: 'audio',
    title: 'Português — Interpretação de Texto (áudio)',
    discipline: 'Português',
    tags: ['enem', 'interpretação'],
    size: 0.08,
    updated: '2025-08-29',
    url: 'https://www.w3schools.com/html/horse.ogg'
  },
  {
    id: 'r3',
    type: 'flash',
    title: 'Flashcards: Química Orgânica — Funções',
    discipline: 'Química',
    tags: ['flash', 'orgânica'],
    size: 0.02,
    updated: '2025-08-28',
    cards: [
      { q: 'O que é uma função orgânica?', a: 'Grupo de compostos com o mesmo grupo funcional.' },
      { q: 'Fórmula do metano?', a: 'CH₄' }
    ]
  },
  {
    id: 'r4',
    type: 'ex',
    title: 'Exercícios: Matemática — Razões e Proporções',
    discipline: 'Matemática',
    tags: ['lista', 'proporções'],
    size: 0.15,
    updated: '2025-08-23',
    questions: 20
  },
  {
    id: 'r5',
    type: 'pdf',
    title: 'Biologia: Ecologia — Resumo ilustrado',
    discipline: 'Biologia',
    tags: ['ecologia', 'resumo'],
    size: 5.7,
    updated: '2025-08-18',
    url: 'about:blank'
  },
  {
    id: 'r6',
    type: 'audio',
    title: 'Química — Ligações Químicas (áudio)',
    discipline: 'Química',
    tags: ['audio', 'ligações'],
    size: 0.12,
    updated: '2025-08-17',
    url: 'https://www.w3schools.com/html/horse.ogg'
  },
  {
    id: 'r7',
    type: 'flash',
    title: 'Flashcards: Português — Classes de Palavras',
    discipline: 'Português',
    tags: ['gramática'],
    size: 0.03,
    updated: '2025-08-12',
    cards: [{ q: 'O que é advérbio?', a: 'Palavra que modifica verbo, adjetivo ou outro advérbio.' }]
  },
  {
    id: 'r8',
    type: 'ex',
    title: 'Exercícios: Biologia — Citologia',
    discipline: 'Biologia',
    tags: ['lista', 'citologia'],
    size: 0.11,
    updated: '2025-08-10',
    questions: 15
  }
];

type Resource = typeof RESOURCES[0];

interface State {
  query: string;
  type: string;
  discipline: string;
  sort: string;
  view: 'grid' | 'list';
  selected: Resource | null;
  showPreview: boolean;
}

// Utility functions
const getTypeIcon = (type: string) => {
  const icons = { pdf: FileText, audio: Headphones, flash: Sparkles, ex: ListChecks };
  return icons[type as keyof typeof icons] || File;
};

const getTypeLabel = (type: string) => {
  const labels = { pdf: 'PDF', audio: 'Áudio', flash: 'Flashcards', ex: 'Exercícios' };
  return labels[type as keyof typeof labels] || type;
};

const formatSize = (size: number) => {
  if (size >= 1) return `${size.toFixed(1)} MB`;
  return `${Math.round(size * 1024)} KB`;
};

export default function Biblioteca() {
  const [state, setState] = useState<State>({
    query: '',
    type: 'ALL',
    discipline: 'ALL',
    sort: 'recent',
    view: 'grid',
    selected: null,
    showPreview: false
  });

  // Filter data
  const filterData = (): Resource[] => {
    let data = [...RESOURCES];
    
    if (state.query) {
      const q = state.query.toLowerCase();
      data = data.filter(r => 
        r.title.toLowerCase().includes(q) || 
        r.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    
    if (state.type !== 'ALL') {
      data = data.filter(r => r.type === state.type);
    }
    
    if (state.discipline !== 'ALL') {
      data = data.filter(r => r.discipline === state.discipline);
    }
    
    // Sort
    if (state.sort === 'recent') {
      data.sort((a, b) => b.updated.localeCompare(a.updated));
    } else if (state.sort === 'az') {
      data.sort((a, b) => a.title.localeCompare(b.title, 'pt'));
    } else if (state.sort === 'size') {
      data.sort((a, b) => b.size - a.size);
    }
    
    return data;
  };

  const handleAction = (action: string, resource: Resource) => {
    if (action === 'open') {
      setState(prev => ({ ...prev, selected: resource, showPreview: true }));
    } else if (action === 'pin') {
      alert('Recurso fixado (mock).');
    } else if (action === 'download') {
      alert('Download iniciado (mock).');
    } else if (action === 'more') {
      alert('Mais ações (renomear, mover, compartilhar) — mock.');
    }
  };

  const filteredData = filterData();

  return (
    <StudyAppProvider>
      <div className="min-h-screen bg-app-bg">
          
          <main className="flex flex-col flex-1 min-w-0">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-app-panel border-b border-app-border px-4 py-3 flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-app-text" />
              <h1 className="text-xl font-semibold text-app-text">Biblioteca de Recursos</h1>
              <div className="flex-1" />
            </header>

            {/* Toolbar */}
            <div className="sticky top-14 z-[9] bg-app-panel border-b border-app-border px-4 py-3">
              <div className="flex flex-col gap-3">
                {/* Search bar */}
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 flex-shrink-0 text-app-text" />
                  <Input
                    placeholder="Buscar por título, tag ou disciplina..."
                    value={state.query}
                    onChange={(e) => setState(prev => ({ ...prev, query: e.target.value }))}
                    className="flex-1 bg-app-bg border-app-border text-app-text"
                  />
                </div>
                
                {/* Filters and view controls */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2">
                    <select
                      value={state.type}
                      onChange={(e) => setState(prev => ({ ...prev, type: e.target.value }))}
                      className="bg-app-bg border border-app-border text-app-text px-2 py-2 rounded-lg text-sm min-w-0"
                    >
                      <option value="ALL">Todos</option>
                      <option value="pdf">PDF</option>
                      <option value="audio">Áudio</option>
                      <option value="flash">Cards</option>
                      <option value="ex">Exercícios</option>
                    </select>
                    
                    <select
                      value={state.discipline}
                      onChange={(e) => setState(prev => ({ ...prev, discipline: e.target.value }))}
                      className="bg-app-bg border border-app-border text-app-text px-2 py-2 rounded-lg text-sm min-w-0"
                    >
                      <option value="ALL">Todas</option>
                      <option>Matemática</option>
                      <option>Português</option>
                      <option>Química</option>
                      <option>Biologia</option>
                    </select>
                    
                    <select
                      value={state.sort}
                      onChange={(e) => setState(prev => ({ ...prev, sort: e.target.value }))}
                      className="bg-app-bg border border-app-border text-app-text px-2 py-2 rounded-lg text-sm min-w-0"
                    >
                      <option value="recent">Recentes</option>
                      <option value="az">A–Z</option>
                      <option value="size">Tamanho</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-center sm:justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setState(prev => ({ ...prev, view: 'grid' }))}
                      className={`${state.view === 'grid' ? 'bg-app-accent' : 'bg-app-bg'} border-app-border text-app-text hover:bg-app-muted`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setState(prev => ({ ...prev, view: 'list' }))}
                      className={`${state.view === 'list' ? 'bg-app-accent' : 'bg-app-bg'} border-app-border text-app-text hover:bg-app-muted`}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4">
              {state.view === 'grid' ? (
                <GridView resources={filteredData} onAction={handleAction} />
              ) : (
                <ListView resources={filteredData} onAction={handleAction} />
              )}
            </div>
          </main>

          {/* Preview Modal */}
          <Dialog open={state.showPreview} onOpenChange={(open) => setState(prev => ({ ...prev, showPreview: open }))}>
            <DialogContent className="w-[90vw] sm:w-[80vw] max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2.5 pr-8">
                  {state.selected && (
                    <>
                      {(() => {
                        const TypeIcon = getTypeIcon(state.selected.type);
                        return <TypeIcon className="w-5 h-5 flex-shrink-0" />;
                      })()}
                      <span className="truncate text-sm sm:text-base">{state.selected.title}</span>
                    </>
                  )}
                </DialogTitle>
              </DialogHeader>
              
              {state.selected && <PreviewContent resource={state.selected} />}
            </DialogContent>
          </Dialog>
      </div>
    </StudyAppProvider>
  );
}

// Grid View Component
function GridView({ resources, onAction }: { resources: Resource[], onAction: (action: string, resource: Resource) => void }) {
  if (resources.length === 0) {
    return (
      <div className="border border-dashed border-app-border rounded-2xl p-6 text-center text-app-text-secondary">
        Nenhum recurso encontrado.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {resources.map(resource => {
        const TypeIcon = getTypeIcon(resource.type);
        return (
          <Card 
            key={resource.id} 
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow bg-app-panel border-app-border"
            onClick={() => onAction('open', resource)}
          >
            <div className="h-[140px] bg-app-muted border-b border-app-border flex items-center justify-center">
              <TypeIcon className="w-8 h-8 text-app-text-secondary" />
            </div>
            
            <CardHeader className="p-3 flex-row items-center gap-2.5">
              <TypeIcon className="w-5 h-5 flex-shrink-0 text-app-text" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate text-sm text-app-text">{resource.title}</div>
                <div className="text-xs text-app-text-secondary">
                  {resource.discipline} • {resource.updated}
                </div>
              </div>
              <Badge variant="secondary" className="gap-1.5 text-xs bg-app-accent text-app-text">
                <Tag className="w-3 h-3" />
                <span className="hidden sm:inline">{getTypeLabel(resource.type)}</span>
              </Badge>
            </CardHeader>
            
            <CardContent className="px-3 pb-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-wrap gap-1">
                  {resource.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full border border-app-border bg-app-bg text-app-text">
                      #{tag}
                    </span>
                  ))}
                  {resource.tags.length > 2 && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full border border-app-border bg-app-bg text-app-text">
                      +{resource.tags.length - 2}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-app-text-secondary">
                  <HardDrive className="w-3 h-3" />
                  {formatSize(resource.size)}
                </div>
              </div>
              
              <div className="flex justify-end gap-1">
                <ActionButtons resource={resource} onAction={onAction} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// List View Component
function ListView({ resources, onAction }: { resources: Resource[], onAction: (action: string, resource: Resource) => void }) {
  if (resources.length === 0) {
    return (
      <div className="border border-dashed border-app-border rounded-2xl p-6 text-center text-app-text-secondary">
        Nenhum recurso encontrado.
      </div>
    );
  }

  return (
    <Card className="overflow-hidden bg-app-panel border-app-border">
      <CardContent className="p-0">
        {/* Desktop view - Hidden on mobile */}
        <div className="hidden lg:block">
          <div className="border-t border-app-border">
            {/* Header */}
            <div className="flex items-center px-3 py-2.5 text-xs text-app-text-secondary border-b border-app-border">
              <div className="flex-1 min-w-0">Recurso</div>
              <div className="w-[100px] text-center">Tipo</div>
              <div className="w-[120px] text-center">Disciplina</div>
              <div className="w-[100px] text-center">Atualizado</div>
              <div className="w-[80px] text-center">Tamanho</div>
              <div className="w-[140px] text-center">Ações</div>
            </div>
            
            {resources.map(resource => {
              const TypeIcon = getTypeIcon(resource.type);
              return (
                <div 
                  key={resource.id}
                  className="flex items-center px-3 py-2.5 border-b border-app-border hover:bg-app-muted cursor-pointer"
                  onClick={() => onAction('open', resource)}
                >
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <TypeIcon className="w-4 h-4 flex-shrink-0 text-app-text" />
                    <div className="font-semibold truncate text-app-text">{resource.title}</div>
                  </div>
                  <div className="w-[100px] text-center text-sm text-app-text">{getTypeLabel(resource.type)}</div>
                  <div className="w-[120px] text-center text-sm text-app-text">{resource.discipline}</div>
                  <div className="w-[100px] text-center text-sm text-app-text-secondary">{resource.updated}</div>
                  <div className="w-[80px] text-center text-sm text-app-text-secondary">{formatSize(resource.size)}</div>
                  <div className="w-[140px] flex justify-center">
                    <ActionButtons resource={resource} onAction={onAction} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile/Tablet view - Hidden on desktop */}
        <div className="lg:hidden">
          <div className="border-t border-app-border">
            {resources.map(resource => {
              const TypeIcon = getTypeIcon(resource.type);
              return (
                <div 
                  key={resource.id}
                  className="px-3 py-3 border-b border-app-border hover:bg-app-muted cursor-pointer"
                  onClick={() => onAction('open', resource)}
                >
                  <div className="flex items-start gap-3">
                    <TypeIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-app-text" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm leading-tight mb-1 text-app-text">{resource.title}</div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs bg-app-accent text-app-text">
                          {getTypeLabel(resource.type)}
                        </Badge>
                        <span className="text-xs text-app-text-secondary">{resource.discipline}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs text-app-text-secondary">
                        <span>{resource.updated}</span>
                        <span>{formatSize(resource.size)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-2">
                    <ActionButtons resource={resource} onAction={onAction} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Action Buttons Component
function ActionButtons({ resource, onAction }: { resource: Resource, onAction: (action: string, resource: Resource) => void }) {
  return (
    <div className="flex gap-1">
      <Button 
        variant="outline" 
        size="icon" 
        className="h-8 w-8 bg-app-bg border-app-border text-app-text hover:bg-app-muted" 
        onClick={(e) => { e.stopPropagation(); onAction('open', resource); }}
      >
        <Eye className="w-3 h-3" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        className="h-8 w-8 bg-app-bg border-app-border text-app-text hover:bg-app-muted" 
        onClick={(e) => { e.stopPropagation(); onAction('pin', resource); }}
      >
        <Bookmark className="w-3 h-3" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        className="h-8 w-8 bg-app-bg border-app-border text-app-text hover:bg-app-muted" 
        onClick={(e) => { e.stopPropagation(); onAction('download', resource); }}
      >
        <Download className="w-3 h-3" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        className="h-8 w-8 bg-app-bg border-app-border text-app-text hover:bg-app-muted" 
        onClick={(e) => { e.stopPropagation(); onAction('more', resource); }}
      >
        <MoreHorizontal className="w-3 h-3" />
      </Button>
    </div>
  );
}

// Preview Content Component
function PreviewContent({ resource }: { resource: Resource }) {
  let previewContent;
  
  if (resource.type === 'pdf') {
    previewContent = (
      <div className="border border-app-border rounded-xl overflow-hidden bg-app-muted">
        <embed type="application/pdf" src={resource.url} className="w-full h-[300px] sm:h-[400px] border-0 bg-white" />
      </div>
    );
  } else if (resource.type === 'audio') {
    previewContent = (
      <div className="border border-app-border rounded-xl overflow-hidden bg-app-muted">
        <div className="p-4 bg-app-panel">
          <div className="font-semibold mb-3 text-app-text">Preview de Áudio</div>
          <audio controls src={resource.url} className="w-full" />
        </div>
      </div>
    );
  } else if (resource.type === 'flash') {
    const cards = (resource as any).cards || [];
    const card = cards[0] || { q: 'Sem prévia', a: '—' };
    
    previewContent = (
      <FlashcardPreview 
        card={card}
        onExport={() => alert('Exportar .apkg (mock)')}
      />
    );
  } else if (resource.type === 'ex') {
    const questions = (resource as any).questions || 0;
    previewContent = (
      <div className="border border-app-border rounded-xl overflow-hidden bg-app-muted">
        <div className="p-4 bg-app-panel">
          <div className="font-semibold mb-2 text-app-text">Lista de Exercícios</div>
          <div className="text-sm text-app-text-secondary mb-4">{questions} questões disponíveis</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => alert('Iniciar prática (mock)')} className="gap-2">
              <Play className="w-4 h-4" />
              Iniciar Prática
            </Button>
            <Button variant="outline" onClick={() => alert('Baixar PDF (mock)')} className="gap-2">
              <Download className="w-4 h-4" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </div>
    );
  } else {
    previewContent = (
      <div className="border border-app-border rounded-xl overflow-hidden bg-app-muted">
        <div className="p-4 bg-app-panel">
          <div className="text-center py-8 text-app-text-secondary">
            <File className="w-12 h-12 mx-auto mb-2" />
            <div>Preview não disponível para este tipo de arquivo</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {previewContent}
      
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-app-border bg-app-bg text-app-text">
          <Hash className="w-3 h-3" />
          {resource.tags.map(t => `#${t}`).join(' ')}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-app-border bg-app-bg text-app-text">
          <HardDrive className="w-3 h-3" />
          {formatSize(resource.size)}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-app-border bg-app-bg text-app-text">
          <Calendar className="w-3 h-3" />
          {resource.updated}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-app-border bg-app-bg text-app-text">
          <Book className="w-3 h-3" />
          {resource.discipline}
        </span>
      </div>
    </div>
  );
}