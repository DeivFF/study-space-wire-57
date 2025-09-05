import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Tag, Save, Trash2, Edit3, 
  FileText, Calendar, Hash, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useNotes } from '@/hooks/useNotes';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/advanced-loading';
import { LessonNote } from '@/services/studyApi';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotesTabProps {
  lessonId: string;
}

interface NoteEditorProps {
  note?: LessonNote;
  onSave: (data: { title: string; content: string; tags: string[] }) => void;
  onCancel: () => void;
  onAutoSave?: (noteId: string, data: { title?: string; content?: string; tags?: string[] }) => void;
  isLoading?: boolean;
}

const NoteEditor = ({ note, onSave, onCancel, onAutoSave, isLoading = false }: NoteEditorProps) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tagsInput, setTagsInput] = useState(note?.tags.join(', ') || '');
  const [isPreview, setIsPreview] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (note && onAutoSave && (title !== note.title || content !== note.content)) {
      const timer = setTimeout(() => {
        onAutoSave(note.id, { 
          title: title !== note.title ? title : undefined,
          content: content !== note.content ? content : undefined,
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [title, content, note, onAutoSave]);

  const handleSave = () => {
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
      
    onSave({ title, content, tags });
  };

  const renderMarkdownPreview = (markdown: string) => {
    // Simple markdown preview (you might want to use a proper markdown parser)
    return markdown
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 text-app-text">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mb-3 text-app-text">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mb-2 text-app-text">$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4 text-app-text">• $1</li>')
      .replace(/\n/gim, '<br>');
  };

  return (
    <div className="space-y-4">
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Título da anotação (opcional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold bg-transparent border-0 px-0 focus-visible:ring-0 text-app-text placeholder:text-app-text-muted"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isPreview ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
            className="text-app-text border-app-border hover:bg-app-muted"
          >
            {isPreview ? 'Editar' : 'Preview'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || (!content.trim())}
            className="bg-app-accent text-white hover:bg-app-accent/90"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="text-app-text border-app-border hover:bg-app-muted"
          >
            Cancelar
          </Button>
        </div>
      </div>

      {/* Content Editor/Preview */}
      <div className="border border-app-border rounded-xl overflow-hidden bg-app-bg">
        {isPreview ? (
          <div 
            className="p-4 min-h-[300px] text-app-text prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: content ? renderMarkdownPreview(content) : '<p class="text-app-text-muted">Nenhum conteúdo para visualizar</p>' 
            }}
          />
        ) : (
          <Textarea
            placeholder="Escreva suas anotações em Markdown..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[300px] border-0 bg-transparent text-app-text resize-none focus-visible:ring-0 text-sm leading-relaxed"
          />
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-app-text flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Tags (separadas por vírgula)
        </label>
        <Input
          placeholder="Ex: importante, revisar, fórmulas"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="bg-app-bg border-app-border text-app-text"
        />
      </div>

      {/* Markdown Help */}
      {!isPreview && (
        <div className="text-xs text-app-text-muted bg-app-bg-soft p-3 rounded-lg">
          <p className="font-medium mb-1">Dicas de Markdown:</p>
          <p>**negrito**, *itálico*, # Título, ## Subtítulo, * lista</p>
        </div>
      )}
    </div>
  );
};

export const NotesTab = ({ lessonId }: NotesTabProps) => {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  const {
    notes,
    filteredNotes,
    isLoading,
    searchQuery,
    setSearchQuery,
    createNote,
    updateNote,
    deleteNote,
    autoSave,
    isCreating: isCreatingNote,
    isUpdating,
    isDeleting,
  } = useNotes(lessonId);

  const activeNote = activeNoteId ? notes.find(n => n.id === activeNoteId) : null;
  const displayNotes = searchQuery ? filteredNotes : notes;

  const handleCreateNote = (data: { title: string; content: string; tags: string[] }) => {
    createNote(data);
    setIsCreating(false);
  };

  const handleUpdateNote = (data: { title: string; content: string; tags: string[] }) => {
    if (activeNoteId) {
      updateNote({ noteId: activeNoteId, data });
      setActiveNoteId(null);
    }
  };

  const handleDeleteNote = (noteId: string, title: string) => {
    setDeleteConfirm({ id: noteId, title: title || 'Nota sem título' });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteNote(deleteConfirm.id);
      setDeleteConfirm(null);
      if (activeNoteId === deleteConfirm.id) {
        setActiveNoteId(null);
      }
    }
  };

  const handleNoteClick = (noteId: string) => {
    if (isCreating) {
      setIsCreating(false);
    }
    setActiveNoteId(activeNoteId === noteId ? null : noteId);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 h-[600px]">
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonCard className="h-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-app-text">
          Anotações da aula
        </h3>
        <Button
          onClick={() => {
            setIsCreating(true);
            setActiveNoteId(null);
          }}
          className="bg-app-accent text-white hover:bg-app-accent/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova anotação
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 min-h-[500px]">
        {/* Notes Sidebar */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-muted" />
            <Input
              placeholder="Buscar anotações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-app-bg border-app-border text-app-text"
            />
          </div>

          {/* Notes List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            <AnimatePresence>
              {displayNotes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-app-text-muted"
                >
                  {searchQuery 
                    ? 'Nenhuma anotação encontrada'
                    : 'Nenhuma anotação criada ainda'
                  }
                </motion.div>
              ) : (
                displayNotes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    onClick={() => handleNoteClick(note.id)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all border",
                      activeNoteId === note.id 
                        ? "bg-app-accent/10 border-app-accent/30 shadow-sm" 
                        : "hover:bg-app-muted border-transparent"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-app-text truncate">
                          {note.title || 'Nota sem título'}
                        </div>
                        <div className="text-xs text-app-text-muted mt-1 line-clamp-2">
                          {note.content.substring(0, 80)}...
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-xs text-app-text-muted">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(note.updated_at), 'dd/MM', { locale: ptBR })}
                          </div>
                          {note.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Hash className="w-3 h-3 text-app-text-muted" />
                              <span className="text-xs text-app-text-muted">
                                {note.tags.length}
                              </span>
                            </div>
                          )}
                        </div>
                        {note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {note.tags.slice(0, 2).map((tag) => (
                              <Badge 
                                key={tag} 
                                variant="outline" 
                                className="text-xs px-2 py-0 h-5 text-app-text-muted border-app-border"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {note.tags.length > 2 && (
                              <Badge 
                                variant="outline" 
                                className="text-xs px-2 py-0 h-5 text-app-text-muted border-app-border"
                              >
                                +{note.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id, note.title);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-app-text-muted hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Editor Area */}
        <div className="border border-app-border rounded-xl bg-app-bg-soft">
          <AnimatePresence mode="wait">
            {isCreating ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4"
              >
                <NoteEditor
                  onSave={handleCreateNote}
                  onCancel={() => setIsCreating(false)}
                  isLoading={isCreatingNote}
                />
              </motion.div>
            ) : activeNote ? (
              <motion.div
                key={activeNote.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4"
              >
                <NoteEditor
                  note={activeNote}
                  onSave={handleUpdateNote}
                  onCancel={() => setActiveNoteId(null)}
                  onAutoSave={autoSave}
                  isLoading={isUpdating}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full min-h-[400px] text-center"
              >
                <div className="space-y-4">
                  <FileText className="w-16 h-16 text-app-text-muted mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium text-app-text mb-2">
                      Nenhuma anotação selecionada
                    </h3>
                    <p className="text-app-text-muted mb-4 max-w-sm">
                      Selecione uma anotação da lista ao lado ou crie uma nova
                    </p>
                    <Button
                      onClick={() => setIsCreating(true)}
                      className="bg-app-accent text-white hover:bg-app-accent/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar primeira anotação
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-app-bg border-app-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-app-text">
              Remover anotação
            </AlertDialogTitle>
            <AlertDialogDescription className="text-app-text-muted">
              Tem certeza que deseja remover a anotação "{deleteConfirm?.title}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-app-text border-app-border hover:bg-app-muted">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? <LoadingSpinner size="sm" /> : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};