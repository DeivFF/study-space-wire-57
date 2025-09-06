import { ArrowLeft, Play, Check, Eye, Download, FileText, Headphones, Code, Globe, Upload, Paperclip, Plus, Save, X, Trash2, RotateCcw, ChevronRight, Edit3, File, Hash, HardDrive, Calendar, Book, PlayCircle, Package, MoreVertical, Star, Pencil, Bold, Italic, List, ListOrdered, Quote, Link, Table, Edit } from 'lucide-react';
import { useCallback, useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/enhanced-toast';
import { useStudyApp } from '@/contexts/StudyAppContext';
import { useFiles } from '@/hooks/useFiles';
import { useAuth } from '@/contexts/AuthContext';
import { studyAPI, type LessonNote } from '@/services/studyApi';
import FlashcardManager from './FlashcardManager';
import { ExerciseBank } from './LessonDetail/ExerciseBank';
import { HistoryTimeline } from './LessonDetail/HistoryTimeline';

const resourceIcons = {
  pdf: FileText,
  audio: Headphones,
  html: Code,
  site: Globe
};

const tabs = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'files', label: 'Arquivos' },
  { id: 'notes', label: 'Anotações' },
  { id: 'cards', label: 'Flashcards' },
  { id: 'exercises', label: 'Exercícios' },
  { id: 'activity', label: 'Atividade' }
];

export function LessonDetail() {
  const { state, dispatch } = useStudyApp();
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [editFileName, setEditFileName] = useState('');
  
  // Notes state
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [viewMode, setViewMode] = useState('editor'); // 'editor' or 'preview'
  const [autosaveState, setAutosaveState] = useState('Salvo');
  const [searchNotes, setSearchNotes] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const notesTextareaRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  
  // Table modal state
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableData, setTableData] = useState([]);
  const [tableStep, setTableStep] = useState('config'); // 'config' or 'fill'

  const selectedCategory = state.categories.find(cat => cat.id === state.selectedCategoryId);
  const selectedLesson = selectedCategory?.lessons.find(lesson => lesson.id === state.selectedLessonId);

  // Get files using the useFiles hook
  const {
    files,
    isLoading: isLoadingFiles,
    uploadFiles,
    deleteFile,
    markAsPrimary,
    markAsStudied,
    renameFile,
    downloadFile,
    isUploading,
    isRenaming,
    uploadProgress
  } = useFiles(state.selectedLessonId?.toString() || '');

  const handlePreviewFile = (file: any) => {
    setSelectedFile(file);
    setShowPreview(true);
  };

  const handleFavoriteFile = (file: any) => {
    markAsPrimary(file.id);
  };

  const handleEditFile = (file: any) => {
    setEditingFile(file);
    setEditFileName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension for editing
  };

  const handleSaveEdit = () => {
    if (!editingFile || !editFileName.trim()) return;
    
    // Add file extension back
    const fileExtension = editingFile.name.split('.').pop();
    const newFileName = editFileName.trim() + '.' + fileExtension;
    
    // Use the hook function
    renameFile({ fileId: editingFile.id, fileName: newFileName });
    
    setEditingFile(null);
    setEditFileName('');
  };

  const handleDeleteFile = (fileId: string) => {
    deleteFile(fileId);
  };

  // Notes management functions
  const loadNotes = async () => {
    if (!state.selectedLessonId) return;
    
    setNotesLoading(true);
    try {
      // Try to load from backend first
      const backendNotes = await studyAPI.getLessonNotes(state.selectedLessonId.toString());
      
      if (backendNotes && backendNotes.length > 0) {
        // Convert backend format to frontend format
        const convertedNotes = backendNotes.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          updated_at: note.updated_at,
          createdAt: new Date(note.updated_at).getTime(),
          updatedAt: new Date(note.updated_at).getTime(),
          tags: note.tags || [],
          fromBackend: true // Mark as loaded from backend
        }));
        
        setNotes(convertedNotes);
        setCurrentNoteId(convertedNotes[0].id);
        setNoteTitle(convertedNotes[0].title);
        setNoteContent(convertedNotes[0].content);
        
        // Clear localStorage after loading from backend to avoid duplicates
        const storageKey = `lesson-notes-${state.selectedLessonId}`;
        localStorage.removeItem(storageKey);
      } else {
        // If no notes in backend, try localStorage
        const storageKey = `lesson-notes-${state.selectedLessonId}`;
        const savedNotes = localStorage.getItem(storageKey);
        
        if (savedNotes) {
          const parsedNotes = JSON.parse(savedNotes);
          setNotes(parsedNotes);
          if (parsedNotes.length > 0) {
            setCurrentNoteId(parsedNotes[0].id);
            setNoteTitle(parsedNotes[0].title);
            setNoteContent(parsedNotes[0].content);
          }
        } else {
          // Create initial note if no notes exist anywhere
          const defaultContent = '# Minhas Anotações\n\nEscreva suas anotações aqui...\n\n- Use Markdown para formatar\n- **Negrito** e *itálico*\n- Listas e checklists\n- Códigos e citações';
          
          const newNote = await studyAPI.createNote(state.selectedLessonId.toString(), {
            title: 'Minhas Anotações',
            content: defaultContent,
            tags: []
          });
          
          const convertedNote = {
            id: newNote.id,
            title: newNote.title,
            content: newNote.content,
            updated_at: newNote.updated_at,
            createdAt: new Date(newNote.updated_at).getTime(),
            updatedAt: new Date(newNote.updated_at).getTime(),
            tags: newNote.tags || [],
            fromBackend: true // Mark as from backend since it was successfully created
          };
          
          setNotes([convertedNote]);
          setCurrentNoteId(convertedNote.id);
          setNoteTitle(convertedNote.title);
          setNoteContent(convertedNote.content);
        }
      }
    } catch (error) {
      console.error('Failed to load notes from backend:', error);
      // Fallback to localStorage
      const storageKey = `lesson-notes-${state.selectedLessonId}`;
      const savedNotes = localStorage.getItem(storageKey);
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes);
        setNotes(parsedNotes);
        if (parsedNotes.length > 0) {
          setCurrentNoteId(parsedNotes[0].id);
          setNoteTitle(parsedNotes[0].title);
          setNoteContent(parsedNotes[0].content);
        }
      }
    } finally {
      setNotesLoading(false);
    }
  };

  const saveNotesToStorage = (notesToSave = notes) => {
    const storageKey = `lesson-notes-${state.selectedLessonId}`;
    localStorage.setItem(storageKey, JSON.stringify(notesToSave));
  };

  const saveCurrentNote = async () => {
    if (!currentNoteId) return;
    
    setAutosaveState('Salvando…');
    
    try {
      const currentNote = notes.find(n => n.id === currentNoteId);
      if (!currentNote) {
        setAutosaveState('Erro');
        return;
      }

      // Check if this is a local-only note by checking if it was loaded from backend
      const isLocalNote = !currentNote.fromBackend;
      
      if (isLocalNote) {
        // Try to create a new note in the backend
        try {
          const newNote = await studyAPI.createNote(state.selectedLessonId.toString(), {
            title: noteTitle,
            content: noteContent,
            tags: currentNote.tags || []
          });
          
          // Replace the local note with the backend note
          const convertedNote = {
            id: newNote.id,
            title: newNote.title,
            content: newNote.content,
            createdAt: new Date(newNote.updated_at).getTime(),
            updatedAt: new Date(newNote.updated_at).getTime(),
            tags: newNote.tags || [],
            fromBackend: true // Mark as from backend after conversion
          };
          
          // Update notes list, replacing the local note with the backend one
          const updatedNotes = notes.map(note => 
            note.id === currentNoteId ? convertedNote : note
          );
          
          setNotes(updatedNotes as any);
          setCurrentNoteId(convertedNote.id); // Update current note ID to the backend ID
          saveNotesToStorage(updatedNotes as any);
          setAutosaveState('Salvo');
          
        } catch (createError) {
          console.error('Failed to create note in backend:', createError);
          // Just save locally if backend fails
          const updatedNotes = notes.map(note => 
            note.id === currentNoteId 
              ? { ...note, title: noteTitle, content: noteContent, updatedAt: Date.now() }
              : note
          );
          
          setNotes(updatedNotes);
          saveNotesToStorage(updatedNotes);
          setAutosaveState('Salvo (local)');
        }
      } else {
        // Update existing backend note
        await studyAPI.updateNote(currentNoteId, {
          title: noteTitle,
          content: noteContent
        });
        
        // Update local state
        const updatedNotes = notes.map(note => 
          note.id === currentNoteId 
            ? { ...note, title: noteTitle, content: noteContent, updatedAt: Date.now(), fromBackend: true }
            : note
        );
        
        setNotes(updatedNotes);
        saveNotesToStorage(updatedNotes);
        setAutosaveState('Salvo');
        toast.note.updated();
      }
      
    } catch (error) {
      console.error('Failed to save note to backend:', error);
      // Fallback to localStorage only
      const updatedNotes = notes.map(note => 
        note.id === currentNoteId 
          ? { ...note, title: noteTitle, content: noteContent, updatedAt: Date.now() }
          : note
      );
      
      setNotes(updatedNotes);
      saveNotesToStorage(updatedNotes);
      setAutosaveState('Erro ao salvar');
      
      toast.error("Erro ao salvar", {
        description: "Não foi possível salvar no servidor. Salvo localmente apenas."
      });
    }
  };

  const createNewNote = async () => {
    if (!state.selectedLessonId) return;
    
    try {
      // Try to create in backend first
      const newNote = await studyAPI.createNote(state.selectedLessonId.toString(), {
        title: 'Nova Anotação',
        content: '',
        tags: []
      });
      
      // Convert to frontend format
      const convertedNote = {
        id: newNote.id,
        title: newNote.title,
        content: newNote.content,
        updated_at: newNote.updated_at,
        createdAt: new Date(newNote.updated_at).getTime(),
        updatedAt: new Date(newNote.updated_at).getTime(),
        tags: newNote.tags || [],
        fromBackend: true // Mark as from backend since it was successfully created
      };
      
      const updatedNotes = [...notes, convertedNote];
      setNotes(updatedNotes);
      saveNotesToStorage(updatedNotes);
      await switchToNote(convertedNote.id);
      toast.note.created();
      
    } catch (error) {
      console.error('Failed to create note in backend:', error);
      // Fallback to local creation with UUID
      const newNote = {
        id: crypto.randomUUID(),
        title: 'Nova Anotação',
        content: '',
        updated_at: new Date().toISOString(),
        createdAt: Date.now(),
          updatedAt: Date.now(),
          updated_at: new Date().toISOString(),
          tags: []
      };
      
      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
      saveNotesToStorage(updatedNotes);
      await switchToNote(newNote.id);
      
      toast.warning("Aviso", {
        description: "Anotação criada localmente. Será sincronizada quando salvar."
      });
    }
  };

  const switchToNote = async (noteId: string) => {
    // Save current note first if there is one and content has changed
    if (currentNoteId && (noteTitle || noteContent)) {
      await saveCurrentNote();
    }
    
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setCurrentNoteId(noteId);
      setNoteTitle(note.title);
      setNoteContent(note.content);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (notes.length <= 1) {
      toast.error("Erro", {
        description: "Você precisa ter pelo menos uma anotação."
      });
      return;
    }

    try {
      // Delete from backend
      await studyAPI.deleteNote(noteId);
      
      // Update local state
      const updatedNotes = notes.filter(n => n.id !== noteId);
      setNotes(updatedNotes);
      saveNotesToStorage(updatedNotes);

      // If we deleted the current note, switch to the first one
      if (currentNoteId === noteId) {
        const firstNote = updatedNotes[0];
        setCurrentNoteId(firstNote.id);
        setNoteTitle(firstNote.title);
        setNoteContent(firstNote.content);
      }

      toast.note.deleted();
      
    } catch (error) {
      console.error('Failed to delete note from backend:', error);
      
      toast.error("Erro", {
        description: "Não foi possível excluir a anotação do servidor."
      });
    }
  };

  const handleNoteContentChange = (value: string) => {
    setNoteContent(value);
    setAutosaveState('Salvando…');
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveCurrentNote();
    }, 1000);
  };

  const handleNoteTitleChange = (value: string) => {
    setNoteTitle(value);
    setAutosaveState('Salvando…');
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveCurrentNote();
    }, 1000);
  };

  const applyMarkdownAction = (action: string) => {
    const textarea = notesTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = noteContent.slice(start, end) || 'texto';
    let replacement = selectedText;

    switch (action) {
      case 'bold':
        replacement = `**${selectedText}**`;
        break;
      case 'italic':
        replacement = `*${selectedText}*`;
        break;
      case 'h1':
        replacement = `# ${selectedText}`;
        break;
      case 'h2':
        replacement = `## ${selectedText}`;
        break;
      case 'h3':
        replacement = `### ${selectedText}`;
        break;
      case 'ul':
        replacement = `- ${selectedText}`;
        break;
      case 'ol':
        replacement = `1. ${selectedText}`;
        break;
      case 'check':
        replacement = `- [ ] ${selectedText}`;
        break;
      case 'code':
        replacement = `\`${selectedText}\``;
        break;
      case 'quote':
        replacement = `> ${selectedText}`;
        break;
      case 'link':
        replacement = `[${selectedText}](url)`;
        break;
      case 'table':
        replacement = `| ${selectedText} |\n| --- |\n| Cell |`;
        break;
    }

    const newContent = noteContent.slice(0, start) + replacement + noteContent.slice(end);
    setNoteContent(newContent);
    handleNoteContentChange(newContent);

    // Update cursor position
    setTimeout(() => {
      if (action === 'link') {
        textarea.setSelectionRange(start + replacement.length - 4, start + replacement.length - 1);
      } else {
        textarea.setSelectionRange(start + replacement.length, start + replacement.length);
      }
      textarea.focus();
    }, 0);
  };

  // Table functions
  const initializeTableData = () => {
    const data = [];
    for (let i = 0; i < tableRows; i++) {
      const row = [];
      for (let j = 0; j < tableCols; j++) {
        row.push('');
      }
      data.push(row);
    }
    setTableData(data);
  };

  const handleTableCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...tableData];
    newData[rowIndex][colIndex] = value;
    setTableData(newData);
  };

  const generateMarkdownTable = () => {
    if (tableData.length === 0) return '';
    
    let markdown = '';
    
    // Header row
    markdown += '| ' + tableData[0].map(cell => cell || ' ').join(' | ') + ' |\n';
    
    // Separator row
    markdown += '| ' + Array(tableCols).fill('---').join(' | ') + ' |\n';
    
    // Data rows
    for (let i = 1; i < tableData.length; i++) {
      markdown += '| ' + tableData[i].map(cell => cell || ' ').join(' | ') + ' |\n';
    }
    
    return markdown;
  };

  const insertTable = () => {
    const tableMarkdown = generateMarkdownTable();
    const textarea = notesTextareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const newContent = noteContent.slice(0, cursorPos) + '\n' + tableMarkdown + '\n' + noteContent.slice(cursorPos);
    setNoteContent(newContent);
    handleNoteContentChange(newContent);
    
    // Close modal and reset state
    setShowTableModal(false);
    setTableStep('config');
    setTableData([]);
    
    // Focus back to textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos + tableMarkdown.length + 2, cursorPos + tableMarkdown.length + 2);
    }, 0);
  };

  const exportNotes = () => {
    const blob = new Blob([noteContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${noteTitle || 'anotacoes'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderMarkdownPreview = () => {
    try {
      return { __html: marked(noteContent) };
    } catch (error) {
      return { __html: '<p>Erro ao renderizar markdown</p>' };
    }
  };

  // Load notes when lesson changes
  useEffect(() => {
    if (state.selectedLessonId) {
      loadNotes();
    }
  }, [state.selectedLessonId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // File upload functionality
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      console.log('Arquivos selecionados:', acceptedFiles);
      uploadFiles(acceptedFiles);
    }
  }, [uploadFiles]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'audio/*': ['.mp3', '.m4a', '.wav', '.ogg'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024, // 50MB
    noClick: true, // Disable click on dropzone area
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(rejection => {
        const errors = rejection.errors.map(e => e.message).join(', ');
        console.error(`Arquivo rejeitado: ${rejection.file.name}`, errors);
        alert(`Arquivo rejeitado: ${rejection.file.name} - ${errors}`);
      });
    },
  });

  const handleBackToList = () => {
    dispatch({ type: 'SET_APP_MODE', payload: 'browse' });
    dispatch({ type: 'SET_SELECTED_LESSON', payload: null });
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'facil': return 'Fácil';
      case 'medio': return 'Médio';
      case 'dificil': return 'Difícil';
      default: return difficulty;
    }
  };

  if (!selectedLesson) {
    return (
      <div className="bg-app-bg-soft border border-app-border rounded-2xl p-5">
        <div className="text-app-text">Selecione uma aula.</div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (state.drawerTab) {
      case 'overview':
        return (
          <div className="bg-app-bg-soft border border-app-border rounded-2xl">
            <div className="p-3">
              <p className="text-sm text-app-text-muted mb-3">
                Resumo da aula e próximos passos.
              </p>
              <div className="flex gap-2">
              </div>
            </div>
          </div>
        );

      case 'files':
        return (
          <div className="bg-app-bg-soft border border-app-border rounded-2xl">
            <div className="p-3 space-y-2">
              {selectedLesson.resources.map((resource) => {
                const Icon = resourceIcons[resource.type];
                return (
                  <div key={resource.id} className="flex items-center gap-3 p-3 border border-app-border rounded-xl">
                    <Icon className="w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-app-text truncate flex items-center gap-2">
                        {resource.name}
                        {resource.primary && (
                          <Badge className="bg-app-success/20 text-app-success border-app-success/30">
                            Principal
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-app-text-muted">
                        {resource.size || resource.duration || '—'}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-app-text-muted hover:text-app-text hover:bg-app-muted"
                        onClick={() => handlePreviewFile({
                          id: resource.id,
                          name: resource.name,
                          type: resource.type,
                          url: (resource as any).uploadDate || '',
                          size: resource.size,
                          uploadDate: new Date().toISOString(),
                          primary: resource.primary || false,
                          studied: false
                        })}
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-app-text-muted hover:text-app-text hover:bg-app-muted"
                      >
                        <Download className="w-4 h-4" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="bg-app-bg-soft border border-app-border rounded-2xl overflow-hidden">
            <Textarea
              placeholder="Escreva anotações em Markdown…"
              value={selectedLesson.notes || ''}
              className="min-h-[240px] border-0 bg-transparent text-app-text resize-none focus-visible:ring-0"
            />
          </div>
        );

      case 'cards':
        return (
          <div className="bg-app-bg-soft border border-app-border rounded-2xl">
            <div className="p-3">
              <div className="text-sm text-app-text mb-2">
                Você tem <span className="font-semibold">{selectedLesson.flashcardsDue}</span> cards para hoje.
              </div>
              <Button className="bg-app-bg border border-app-border text-app-text hover:bg-app-muted">
                <Play className="w-4 h-4" />
                Praticar
              </Button>
            </div>
          </div>
        );

      case 'exercises':
        return (
          <div className="bg-app-bg-soft border border-app-border rounded-2xl">
            <div className="p-3 text-sm text-app-text-muted">
              Desempenho e prática (placeholder)
            </div>
          </div>
        );

      case 'activity':
        return (
          <div className="bg-app-bg-soft border border-app-border rounded-2xl">
            <div className="p-3 text-sm text-app-text-muted">
              Log de atividade (placeholder)
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-4 px-3">
        <Button 
          variant="outline"
          onClick={handleBackToList}
          className="text-app-text border-app-border hover:bg-app-muted"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div className="text-lg font-semibold text-app-text">{selectedLesson.title}</div>
        <div className="flex-1" />
        <div className="text-sm text-app-text-muted">
          <span className="capitalize">{getDifficultyText(selectedLesson.difficulty)}</span> • 
          Progresso {selectedLesson.progress}% • 
          Acerto {selectedLesson.accuracy}%
        </div>
      </div>

      <div className="bg-app-bg-soft border border-app-border rounded-2xl shadow-sm">
        <Tabs defaultValue="files" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-app-border rounded-none h-auto p-0 gap-1">
            <TabsTrigger 
              value="files" 
              className="px-4 py-3 rounded-t-xl border border-b-0 border-app-border bg-app-bg data-[state=active]:bg-app-bg-soft data-[state=active]:text-app-text data-[state=active]:font-semibold text-app-text-muted"
            >
              Arquivos
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              className="px-4 py-3 rounded-t-xl border border-b-0 border-app-border bg-app-bg data-[state=active]:bg-app-bg-soft data-[state=active]:text-app-text data-[state=active]:font-semibold text-app-text-muted"
            >
              Anotações
            </TabsTrigger>
            <TabsTrigger 
              value="flashcards" 
              className="px-4 py-3 rounded-t-xl border border-b-0 border-app-border bg-app-bg data-[state=active]:bg-app-bg-soft data-[state=active]:text-app-text data-[state=active]:font-semibold text-app-text-muted"
            >
              Flashcards
            </TabsTrigger>
            <TabsTrigger 
              value="exercises" 
              className="px-4 py-3 rounded-t-xl border border-b-0 border-app-border bg-app-bg data-[state=active]:bg-app-bg-soft data-[state=active]:text-app-text data-[state=active]:font-semibold text-app-text-muted"
            >
              Exercícios
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="px-4 py-3 rounded-t-xl border border-b-0 border-app-border bg-app-bg data-[state=active]:bg-app-bg-soft data-[state=active]:text-app-text data-[state=active]:font-semibold text-app-text-muted"
            >
              Histórico
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="px-4 py-3 rounded-t-xl border border-b-0 border-app-border bg-app-bg data-[state=active]:bg-app-bg-soft data-[state=active]:text-app-text data-[state=active]:font-semibold text-app-text-muted"
            >
              Estatísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="p-4 mt-0 space-y-4">
            <div 
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragActive 
                  ? 'border-blue-400 bg-blue-50 scale-105' 
                  : 'border-app-border bg-app-bg hover:border-blue-400 hover:bg-blue-50/50'
              } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <div className="text-lg font-medium text-app-text">Enviando arquivos...</div>
                  {Object.entries(uploadProgress).length > 0 && (
                    <div className="space-y-2 w-full max-w-md">
                      {Object.entries(uploadProgress).map(([fileName, progress]) => (
                        <div key={fileName} className="space-y-1">
                          <div className="text-sm text-app-text-muted">{fileName.split('-')[0]}</div>
                          <div className="w-full bg-app-muted rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-right text-app-text-muted">{progress}%</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className={`w-8 h-8 transition-colors ${
                    isDragActive ? 'text-blue-600' : 'text-app-text-muted'
                  }`} />
                  <div className={`transition-colors ${
                    isDragActive ? 'text-blue-600' : 'text-app-text-muted'
                  }`}>
                    {isDragActive ? 'Solte os arquivos aqui...' : 'Arraste e solte arquivos aqui, ou'}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={open}
                    className="text-app-text border-app-border hover:bg-app-muted"
                    disabled={isUploading}
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    Selecionar arquivos
                  </Button>
                  <div className="text-xs text-app-text-muted">
                    Suporte: PDF, MP3, M4A, WAV, PNG, JPG (máx. 50MB)
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-app-text">Arquivos anexados</h3>
              <div className="flex items-center gap-3">
                <Input 
                  placeholder="Filtrar..." 
                  className="w-48 bg-app-bg border-app-border text-app-text"
                />
                <span className="text-sm text-app-text-muted">{files.length} itens</span>
              </div>
            </div>

            <div className="space-y-2">
              {isLoadingFiles ? (
                <div className="text-center py-8 text-app-text-muted">
                  Carregando arquivos...
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8 text-app-text-muted">
                  Nenhum arquivo anexado ainda
                </div>
              ) : (
                <div>
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
                      
                      {files.map((file) => {
                        const Icon = resourceIcons[file.type] || FileText;
                        const getTypeLabel = (type: string) => {
                          const labels = {
                            pdf: 'PDF',
                            audio: 'Áudio', 
                            image: 'Imagem',
                            html: 'HTML',
                            site: 'Site'
                          };
                          return labels[type] || type.toUpperCase();
                        };
                        
                        return (
                          <div 
                            key={file.id}
                            className="flex items-center px-3 py-2.5 border-b border-app-border hover:bg-app-muted"
                          >
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              <Icon className="w-4 h-4 flex-shrink-0 text-app-text" />
                              <div className="font-semibold truncate text-app-text flex items-center gap-2">
                                {file.name}
                                {file.primary && (
                                  <Badge className="bg-app-accent/20 text-app-accent border-app-accent/30 text-xs">
                                    Principal
                                  </Badge>
                                )}
                                {file.studied && (
                                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                                    <Check className="w-3 h-3 mr-1" />
                                    Estudado
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="w-[100px] text-center text-sm text-app-text">{getTypeLabel(file.type)}</div>
                            <div className="w-[120px] text-center text-sm text-app-text">{state.ui?.selectedDiscipline || 'Geral'}</div>
                            <div className="w-[100px] text-center text-sm text-app-text-secondary">{new Date(file.uploadDate).toLocaleDateString()}</div>
                            <div className="w-[80px] text-center text-sm text-app-text-secondary">{file.size || '-'}</div>
                            <div className="w-[140px] flex justify-center gap-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-app-text border-app-border hover:bg-app-muted p-2"
                                onClick={() => handlePreviewFile(file)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-app-text border-app-border hover:bg-app-muted p-2"
                                onClick={() => downloadFile(file.id)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-app-text border-app-border hover:bg-app-muted p-2"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleFavoriteFile(file)}>
                                    <Star className="w-4 h-4 mr-2" />
                                    Favoritar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditFile(file)}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteFile(file.id)}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile/Tablet view - Hidden on desktop */}
                  <div className="lg:hidden">
                    <div className="border-t border-app-border">
                      {files.map((file) => {
                        const Icon = resourceIcons[file.type] || FileText;
                        const getTypeLabel = (type: string) => {
                          const labels = {
                            pdf: 'PDF',
                            audio: 'Áudio', 
                            image: 'Imagem',
                            html: 'HTML',
                            site: 'Site'
                          };
                          return labels[type] || type.toUpperCase();
                        };
                        
                        return (
                          <div 
                            key={file.id}
                            className="px-3 py-3 border-b border-app-border hover:bg-app-muted"
                          >
                            <div className="flex items-start gap-3">
                              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-app-text" />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm leading-tight mb-1 text-app-text flex items-center gap-2">
                                  {file.name}
                                  {file.primary && (
                                    <Badge className="bg-app-accent/20 text-app-accent border-app-accent/30 text-xs">
                                      Principal
                                    </Badge>
                                  )}
                                  {file.studied && (
                                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                                      <Check className="w-3 h-3 mr-1" />
                                      Estudado
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <Badge variant="secondary" className="text-xs bg-app-accent text-app-text">
                                    {getTypeLabel(file.type)}
                                  </Badge>
                                  <span className="text-xs text-app-text-secondary">{state.ui?.selectedDiscipline || 'Geral'}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2 text-xs text-app-text-secondary">
                                  <div className="flex items-center gap-2">
                                    <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
                                    {file.size && <span>• {file.size}</span>}
                                    {file.duration && <span>• {file.duration}</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3 ml-8">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-app-text border-app-border hover:bg-app-muted"
                                onClick={() => handlePreviewFile(file)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Preview
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-app-text border-app-border hover:bg-app-muted"
                                onClick={() => downloadFile(file.id)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Baixar
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-app-text border-app-border hover:bg-app-muted"
                                  >
                                    <MoreVertical className="w-4 h-4 mr-1" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleFavoriteFile(file)}>
                                    <Star className="w-4 h-4 mr-2" />
                                    Favoritar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditFile(file)}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteFile(file.id)}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="p-4 mt-0 space-y-4">
            <div className="flex items-center gap-3">
              <Button 
                className="bg-app-accent text-white hover:bg-app-accent/90"
                onClick={createNewNote}
              >
                <Plus className="w-4 h-4" />
                Nova anotação
              </Button>
              <Input 
                placeholder="Buscar anotações..." 
                className="flex-1 bg-app-bg border-app-border text-app-text"
                value={searchNotes}
                onChange={(e) => setSearchNotes(e.target.value)}
              />
            </div>

            {/* Notes tabs */}
            <div className="flex overflow-x-auto whitespace-nowrap border-b border-app-border">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 cursor-pointer transition-colors ${
                    note.id === currentNoteId 
                      ? 'border-app-accent bg-app-bg-soft text-app-text font-semibold' 
                      : 'border-transparent bg-app-bg text-app-text-muted hover:bg-app-muted'
                  }`}
                  onClick={() => switchToNote(note.id)}
                >
                  <span className="truncate max-w-[120px]">{note.title}</span>
                  {notes.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 text-app-text-muted hover:text-app-text"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Note editor container */}
            <div className="border border-app-border rounded-xl bg-app-bg overflow-hidden">
              {/* Note title */}
              <Input
                value={noteTitle}
                onChange={(e) => handleNoteTitleChange(e.target.value)}
                placeholder="Título da anotação"
                className="border-0 bg-transparent text-lg font-semibold text-app-text focus-visible:ring-0 border-b border-app-border rounded-none"
              />
              
              {/* Toolbar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-app-border bg-app-muted">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 py-1 h-8 text-xs font-bold hover:bg-app-bg"
                    onClick={() => applyMarkdownAction('h1')}
                    title="Título H1"
                  >
                    H1
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 py-1 h-8 text-xs font-semibold hover:bg-app-bg"
                    onClick={() => applyMarkdownAction('h2')}
                    title="Título H2"
                  >
                    H2
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 py-1 h-8 text-xs font-medium hover:bg-app-bg"
                    onClick={() => applyMarkdownAction('h3')}
                    title="Título H3"
                  >
                    H3
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 py-1 h-8 hover:bg-app-bg"
                    onClick={() => applyMarkdownAction('bold')}
                    title="Negrito"
                  >
                    <Bold className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 py-1 h-8 hover:bg-app-bg"
                    onClick={() => applyMarkdownAction('italic')}
                    title="Itálico"
                  >
                    <Italic className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 py-1 h-8 text-xs hover:bg-app-bg"
                    onClick={() => applyMarkdownAction('ul')}
                    title="Lista não ordenada"
                  >
                    <List className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 py-1 h-8 text-xs hover:bg-app-bg"
                    onClick={() => applyMarkdownAction('ol')}
                    title="Lista ordenada"
                  >
                    <ListOrdered className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 py-1 h-8 text-xs hover:bg-app-bg"
                    onClick={() => applyMarkdownAction('check')}
                    title="Checklist"
                  >
                    ☑︎
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 py-1 h-8 hover:bg-app-bg"
                    onClick={() => applyMarkdownAction('quote')}
                    title="Citação"
                  >
                    <Quote className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 py-1 h-8 text-xs hover:bg-app-bg"
                    onClick={() => applyMarkdownAction('code')}
                    title="Código"
                  >
                    &lt;/&gt;
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 py-1 h-8 hover:bg-app-bg"
                    onClick={() => applyMarkdownAction('link')}
                    title="Link"
                  >
                    <Link className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 py-1 h-8 hover:bg-app-bg"
                    onClick={() => setShowTableModal(true)}
                    title="Tabela"
                  >
                    <Table className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-xs text-app-text-muted">{autosaveState}</div>
                  <div className="flex border border-app-border rounded-md overflow-hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`px-2 py-1 text-sm rounded-none ${
                        viewMode === 'editor' 
                          ? 'bg-app-accent text-white' 
                          : 'bg-app-bg text-app-text-muted'
                      }`}
                      onClick={() => setViewMode('editor')}
                    >
                      Editor
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`px-2 py-1 text-sm rounded-none ${
                        viewMode === 'preview' 
                          ? 'bg-app-accent text-white' 
                          : 'bg-app-bg text-app-text-muted'
                      }`}
                      onClick={() => setViewMode('preview')}
                    >
                      Preview
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Editor/Preview content */}
              {viewMode === 'editor' ? (
                <Textarea
                  ref={notesTextareaRef}
                  value={noteContent}
                  onChange={(e) => handleNoteContentChange(e.target.value)}
                  placeholder="Escreva anotações em Markdown…"
                  className="w-full min-h-[320px] p-4 border-0 bg-transparent text-app-text resize-none focus-visible:ring-0"
                />
              ) : (
                <div 
                  className="min-h-[320px] p-4 prose prose-sm max-w-none 
                           prose-headings:text-app-text prose-p:text-app-text 
                           prose-li:text-app-text prose-strong:text-app-text
                           prose-em:text-app-text prose-code:text-app-text
                           prose-code:bg-app-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                           prose-pre:bg-app-muted prose-pre:border prose-pre:border-app-border
                           prose-blockquote:text-app-text-muted prose-blockquote:border-l-app-border
                           prose-th:text-app-text prose-td:text-app-text 
                           prose-th:border-app-border prose-td:border-app-border
                           prose-hr:border-app-border prose-a:text-app-accent"
                  dangerouslySetInnerHTML={renderMarkdownPreview()}
                />
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  className="text-app-text border-app-border hover:bg-app-muted"
                  onClick={() => deleteNote(currentNoteId)}
                  disabled={notes.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  className="text-app-text border-app-border hover:bg-app-muted"
                  onClick={exportNotes}
                >
                  <Download className="w-4 h-4" />
                  Exportar .md
                </Button>
                <Button 
                  className="bg-app-accent text-white hover:bg-app-accent/90"
                  onClick={saveCurrentNote}
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="flashcards" className="p-4 mt-0">
            <FlashcardManager lessonId={state.selectedLessonId?.toString() || ''} />
          </TabsContent>

          <TabsContent value="exercises" className="p-4 mt-0">
            <ExerciseBank lessonId={state.selectedLessonId?.toString() || ''} />
          </TabsContent>

          <TabsContent value="history" className="p-4 mt-0">
            <HistoryTimeline lessonId={state.selectedLessonId?.toString() || ''} />
          </TabsContent>

          <TabsContent value="stats" className="p-4 mt-0 space-y-4">
            <div className="flex items-baseline gap-3">
              <h3 className="text-lg font-semibold text-app-text">Estatísticas da aula</h3>
              <span className="text-sm text-app-text-muted">consolidadas do histórico</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border border-app-border rounded-xl p-4 bg-app-bg">
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-5 h-5 text-app-text" />
                  <span className="font-semibold text-app-text">Exercícios</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-app-text-muted">Feitos</span>
                    <span className="font-semibold text-app-text">0</span>
                  </div>
                  <div className="w-full bg-app-muted rounded-full h-2">
                    <div className="bg-gradient-to-r from-app-accent to-app-accent-2 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-app-text-muted">Acertos</span>
                    <span className="text-app-text">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-app-text-muted">Erros</span>
                    <span className="text-app-text">0</span>
                  </div>
                </div>
              </div>

              <div className="border border-app-border rounded-xl p-4 bg-app-bg">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-app-text" />
                  <span className="font-semibold text-app-text">Flashcards</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-app-text-muted">Feitos</span>
                    <span className="font-semibold text-app-text">0</span>
                  </div>
                  <div className="w-full bg-app-muted rounded-full h-2">
                    <div className="bg-gradient-to-r from-app-accent to-app-accent-2 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-app-text-muted">Acertos</span>
                    <span className="text-app-text">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-app-text-muted">Erros</span>
                    <span className="text-app-text">0</span>
                  </div>
                </div>
              </div>

              <div className="border border-app-border rounded-xl p-4 bg-app-bg">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-5 h-5 text-app-text" />
                  <span className="font-semibold text-app-text">Outras métricas</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-app-text-muted">Arquivos anexados</span>
                    <span className="text-app-text">{selectedLesson.resources.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-app-text-muted">Áudios reproduzidos</span>
                    <span className="text-app-text">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-app-text-muted">Anotações criadas</span>
                    <span className="text-app-text">{notes.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="w-[95vw] sm:w-[90vw] max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 pr-8">
              {selectedFile && (
                <>
                  {(() => {
                    const Icon = resourceIcons[selectedFile.type] || FileText;
                    return <Icon className="w-5 h-5 flex-shrink-0" />;
                  })()}
                  <span className="truncate text-sm sm:text-base">{selectedFile.name}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedFile && <PreviewContent file={selectedFile} />}
        </DialogContent>
      </Dialog>

      {/* Edit File Modal */}
      <Dialog open={!!editingFile} onOpenChange={() => { setEditingFile(null); setEditFileName(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar nome do arquivo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="fileName" className="block text-sm font-medium text-app-text mb-2">
                Nome do arquivo
              </label>
              <Input
                id="fileName"
                value={editFileName}
                onChange={(e) => setEditFileName(e.target.value)}
                placeholder="Digite o novo nome"
                className="w-full"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
              />
              {editingFile && (
                <p className="text-xs text-app-text-secondary mt-1">
                  Extensão: .{editingFile.name.split('.').pop()}
                </p>
              )}
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => { setEditingFile(null); setEditFileName(''); }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={!editFileName.trim() || isRenaming}
                className="bg-app-accent text-white hover:bg-app-accent/90"
              >
                {isRenaming ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table Modal */}
      <Dialog open={showTableModal} onOpenChange={setShowTableModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Tabela</DialogTitle>
          </DialogHeader>
          
          {tableStep === 'config' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Número de linhas:</label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={tableRows}
                    onChange={(e) => setTableRows(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Número de colunas:</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={tableCols}
                    onChange={(e) => setTableCols(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowTableModal(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    initializeTableData();
                    setTableStep('fill');
                  }}
                >
                  Próximo
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-app-text-muted">
                Preencha os campos da tabela ({tableRows} linhas × {tableCols} colunas):
              </p>
              
              <div className="space-y-3">
                {tableData.map((row, rowIndex) => (
                  <div key={rowIndex} className="space-y-2">
                    <div className="text-xs font-medium text-app-text-muted">
                      {rowIndex === 0 ? 'Cabeçalho' : `Linha ${rowIndex}`}
                    </div>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${tableCols}, 1fr)` }}>
                      {row.map((cell, colIndex) => (
                        <Input
                          key={`${rowIndex}-${colIndex}`}
                          placeholder={rowIndex === 0 ? `Coluna ${colIndex + 1}` : `Célula ${colIndex + 1}`}
                          value={cell}
                          onChange={(e) => handleTableCellChange(rowIndex, colIndex, e.target.value)}
                          className="text-sm"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setTableStep('config')}
                >
                  Voltar
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowTableModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={insertTable}>
                    Inserir Tabela
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Preview Content Component
function PreviewContent({ file }: { file: any }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const loadFile = async () => {
      if (!file.url.startsWith('/api/files/')) {
        // For non-API files, use the URL directly
        setBlobUrl(file.url);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`http://localhost:3002${file.url}?preview=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load file');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (err) {
        console.error('Error loading file:', err);
        setError('Erro ao carregar o arquivo');
      } finally {
        setLoading(false);
      }
    };

    if (file.type === 'pdf' || file.type === 'audio' || file.type === 'image') {
      loadFile();
    }

    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [file, token]);

  let previewContent;
  
  if (file.type === 'pdf') {
    previewContent = (
      <div className="border border-app-border rounded-xl overflow-hidden bg-app-muted">
        <div className="p-4 bg-app-panel">
          <div className="font-semibold mb-3 text-app-text">Preview do PDF</div>
          {loading && (
            <div className="bg-white border border-app-border rounded-lg p-8 text-center">
              <div className="text-app-text-secondary">Carregando PDF...</div>
            </div>
          )}
          {error && (
            <div className="bg-white border border-app-border rounded-lg p-8 text-center">
              <div className="text-red-600">{error}</div>
            </div>
          )}
          {blobUrl && !loading && (
            <div className="bg-white border border-app-border rounded-lg overflow-hidden">
              <iframe 
                src={`${blobUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-[600px] sm:h-[700px] border-0"
                title={`Preview: ${file.name}`}
                style={{ minHeight: '600px' }}
              />
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <Button
              onClick={() => {
                if (blobUrl) {
                  const link = document.createElement('a');
                  link.href = blobUrl;
                  link.download = file.name;
                  link.click();
                }
              }}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-app-accent text-white rounded-lg hover:bg-app-accent/90"
              disabled={!blobUrl || loading}
            >
              <Download className="w-4 h-4" />
              Baixar arquivo
            </Button>
          </div>
        </div>
      </div>
    );
  } else if (file.type === 'audio') {
    previewContent = (
      <div className="border border-app-border rounded-xl overflow-hidden bg-app-muted">
        <div className="p-4 bg-app-panel">
          <div className="font-semibold mb-3 text-app-text">Preview de Áudio</div>
          {loading && (
            <div className="p-8 text-center">
              <div className="text-app-text-secondary">Carregando áudio...</div>
            </div>
          )}
          {error && (
            <div className="p-8 text-center">
              <div className="text-red-600">{error}</div>
            </div>
          )}
          {blobUrl && !loading && (
            <audio controls src={blobUrl} className="w-full" />
          )}
        </div>
      </div>
    );
  } else if (file.type === 'image') {
    previewContent = (
      <div className="border border-app-border rounded-xl overflow-hidden bg-app-muted">
        {loading && (
          <div className="p-8 text-center">
            <div className="text-app-text-secondary">Carregando imagem...</div>
          </div>
        )}
        {error && (
          <div className="p-8 text-center">
            <div className="text-red-600">{error}</div>
          </div>
        )}
        {blobUrl && !loading && (
          <img src={blobUrl} alt={file.name} className="w-full max-h-[400px] object-contain" />
        )}
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

  const formatSize = (size: string | number | null) => {
    if (!size) return '-';
    if (typeof size === 'string') return size;
    
    const bytes = size;
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {previewContent}
      
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-app-border bg-app-bg text-app-text">
          <HardDrive className="w-3 h-3" />
          {formatSize(file.size)}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-app-border bg-app-bg text-app-text">
          <Calendar className="w-3 h-3" />
          {new Date(file.uploadDate).toLocaleDateString()}
        </span>
        {file.primary && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-app-border bg-app-accent/20 text-app-accent">
            <Book className="w-3 h-3" />
            Principal
          </span>
        )}
        {file.studied && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-app-border bg-green-500/20 text-green-600">
            <Check className="w-3 h-3" />
            Estudado
          </span>
        )}
      </div>
    </div>
  );
}