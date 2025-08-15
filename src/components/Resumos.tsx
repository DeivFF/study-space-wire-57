import { useState, useEffect, useMemo } from 'react';
import { Brain, FileText, Plus, Upload, Trash2, Edit, Eye, ExternalLink, Globe, ChevronDown, ChevronRight, CheckCircle, Star, Play, Settings, FileAudio, Link, Volume2, Pause, Check, Pencil, Download, Archive, ArchiveRestore, Eye as EyeOff, Subtitles, MoreHorizontal, Share2, Inbox, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useSupabaseLessons } from '@/hooks/useSupabaseLessons';
import { useSupabaseLessonDocuments } from '@/hooks/useSupabaseLessonDocuments';
import { useSupabaseLessonFiles } from '@/hooks/useSupabaseLessonFiles';
import { useSupabaseLessonFlashcards } from '@/hooks/useSupabaseLessonFlashcards';
import { useSupabaseLessonQuestions } from '@/hooks/useSupabaseLessonQuestions';
import { useStudySessions } from '@/hooks/useStudySessions';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseLessonPerformance } from '@/hooks/useSupabaseLessonPerformance';
import LessonPerformanceModal from './LessonPerformanceModal';
import { Progress } from '@/components/ui/progress';
import LessonFlashcardWizard from './LessonFlashcardWizard';
import LessonQuestionWizard from './LessonQuestionWizard';
import LessonQuestionExecution from './LessonQuestionExecution';
import BulkFlashcardForm from './BulkFlashcardForm';
import BulkQuestionForm from './BulkQuestionForm';
import CategoryStats from './CategoryStats';
import QuestionManager from './QuestionManager';
import LessonTextUpload from './LessonTextUpload';
import LessonNotes from './LessonNotes';
import { LessonEditModal } from './LessonEditModal';
import { BulkLessonForm } from './BulkLessonForm';
import AudioTranscription from './AudioTranscription';
import AudioSubtitles from './AudioSubtitles';
import HTMLViewer from './HTMLViewer';
import ResumosFilters from './ResumosFilters';
import CategoryEditModal from './CategoryEditModal';
import { StudyTimer } from './StudyTimer';
import { ShareContentModal } from './ShareContentModal';
import { SharedContentManager } from './SharedContentManager';
import { ImportManagementModal } from './ImportManagementModal';
import { CategoryCard } from './CategoryCard';
import { LessonDetailView } from './LessonDetailView';
import { useContentSharing } from '@/hooks/useContentSharing';

const Resumos = () => {
  const { sendShareRequest } = useContentSharing();
  const {
    categories,
    allCategories,
    lessons,
    loading,
    showArchived,
    setShowArchived,
    criarCategoria,
    editarCategoria,
    criarAula,
    criarAulasEmLote,
    arquivarCategoria,
    atualizarWebsiteUrl,
    marcarAulaAssistida,
    editarAula,
    excluirAula,
    excluirCategoria
  } = useSupabaseLessons();
  const {
    documents,
    uploadDocument,
    deleteDocument,
    getDocumentUrl
  } = useSupabaseLessonDocuments();
  const {
    uploadAudioFile,
    uploadHtmlFile,
    deleteAudio,
    getFileUrl,
    downloadFileAsBlob
  } = useSupabaseLessonFiles();
  const {
    flashcards,
    carregarFlashcards
  } = useSupabaseLessonFlashcards();
  const {
    questions,
    attempts,
    carregarQuestoes
  } = useSupabaseLessonQuestions();
  const {
    criarSessao,
    marcarConcluida,
    criarEMarcarConcluida,
    sessions
  } = useStudySessions();
  const {
    toast
  } = useToast();
  const {
    addOrUpdatePerformance,
    getPerformanceByLesson
  } = useSupabaseLessonPerformance();
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [performanceLessonId, setPerformanceLessonId] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [showBulkLessons, setShowBulkLessons] = useState(false);
  const [selectedCategoryForBulk, setSelectedCategoryForBulk] = useState('');
  const [showFlashcardWizard, setShowFlashcardWizard] = useState(false);
  const [showQuestionWizard, setShowQuestionWizard] = useState(false);
  const [showBulkFlashcards, setShowBulkFlashcards] = useState(false);
  const [showBulkQuestions, setShowBulkQuestions] = useState(false);
  const [showWebsiteDialog, setShowWebsiteDialog] = useState(false);
  const [showFlashcardExecution, setShowFlashcardExecution] = useState(false);
  const [showQuestionExecution, setShowQuestionExecution] = useState(false);
  const [showQuestionManager, setShowQuestionManager] = useState(false);
  const [showTextUpload, setShowTextUpload] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteEditingLessonId, setWebsiteEditingLessonId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentAudioPath, setCurrentAudioPath] = useState<string | null>(null);
  const [showLessonNotes, setShowLessonNotes] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [showAudioTranscription, setShowAudioTranscription] = useState(false);
  const [showHtmlViewer, setShowHtmlViewer] = useState(false);
  const [htmlViewerData, setHtmlViewerData] = useState<{
    url: string;
    fileName: string;
  } | null>(null);
  const [showCategoryEdit, setShowCategoryEdit] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    difficulty: 'all',
    watchedStatus: 'all'
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newLessonName, setNewLessonName] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState('');
  const [newLessonCategory, setNewLessonCategory] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSharedContentManager, setShowSharedContentManager] = useState(false);
  const [showImportManager, setShowImportManager] = useState(false);

  // Inicializar categorias expandidas apenas uma vez
  useEffect(() => {
    if (categories.length > 0 && Object.keys(expandedCategories).length === 0) {
      const initialExpanded: Record<string, boolean> = {};
      categories.forEach(category => {
        initialExpanded[category.id] = false;
      });
      setExpandedCategories(initialExpanded);
    }
  }, [categories, expandedCategories]);

  // Carregar flashcards e questões quando uma aula for selecionada
  useEffect(() => {
    if (selectedLesson) {
      carregarFlashcards(selectedLesson);
      carregarQuestoes(selectedLesson);
    }
  }, [selectedLesson, carregarFlashcards, carregarQuestoes]);

  // Carregar questões e tentativas para todas as aulas para calcular progresso
  useEffect(() => {
    carregarQuestoes();
  }, [carregarQuestoes]);

  // Limpar áudio ao trocar de aula selecionada
  useEffect(() => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setCurrentAudioPath(null);
    }
  }, [selectedLesson, currentAudio]);

  // Função para extrair o número do início do nome da aula
  const extractLessonNumber = (lessonName: string): number => {
    const match = lessonName.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Função para ordenar aulas numericamente
  const sortLessonsNumerically = (lessons: any[]) => {
    return lessons.sort((a, b) => {
      const numA = extractLessonNumber(a.name);
      const numB = extractLessonNumber(b.name);

      // Se ambas têm números, ordenar por número
      if (numA > 0 && numB > 0) {
        return numA - numB;
      }

      // Se apenas uma tem número, a com número vem primeiro
      if (numA > 0 && numB === 0) return -1;
      if (numA === 0 && numB > 0) return 1;

      // Se nenhuma tem número, ordenar alfabeticamente
      return a.name.localeCompare(b.name);
    });
  };

  // Função para filtrar aulas baseado nos filtros ativos
  const filterLessons = (lessonsToFilter: any[]) => {
    return lessonsToFilter.filter(lesson => {
      // Filtro de busca
      if (filters.search && !lesson.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Filtro de dificuldade
      if (filters.difficulty !== 'all') {
        if (filters.difficulty === 'unrated' && lesson.rating !== null) {
          return false;
        } else if (filters.difficulty === 'hard' && (lesson.rating === null || lesson.rating > 2)) {
          return false;
        } else if (filters.difficulty === 'medium' && lesson.rating !== 3) {
          return false;
        } else if (filters.difficulty === 'easy' && (lesson.rating === null || lesson.rating < 4)) {
          return false;
        }
      }

      // Filtro de status assistido
      if (filters.watchedStatus === 'watched' && !lesson.watched) {
        return false;
      } else if (filters.watchedStatus === 'unwatched' && lesson.watched) {
        return false;
      }
      return true;
    });
  };

  // Função para editar categoria
  const handleEditCategory = (category: {
    id: string;
    name: string;
  }) => {
    setEditingCategory(category);
    setShowCategoryEdit(true);
  };
  const handleSaveCategory = async (categoryId: string, newName: string) => {
    await editarCategoria(categoryId, newName);
    setShowCategoryEdit(false);
    setEditingCategory(null);
  };
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  const handleCreateCategory = async () => {
    if (newCategoryName.trim()) {
      await criarCategoria(newCategoryName.trim());
      setNewCategoryName('');
      setShowCreateCategory(false);
    }
  };
  const handleCreateLesson = async () => {
    if (newLessonName.trim() && newLessonDuration && newLessonCategory) {
      await criarAula(newLessonCategory, newLessonName.trim(), parseInt(newLessonDuration));
      setNewLessonName('');
      setNewLessonDuration('');
      setNewLessonCategory('');
      setShowCreateLesson(false);
    }
  };
  const handleBulkLessonsSubmit = async (lessonsData: {
    name: string;
    duration_minutes: number;
  }[]) => {
    if (!selectedCategoryForBulk) return;
    const success = await criarAulasEmLote(selectedCategoryForBulk, lessonsData);
    if (success) {
      setShowBulkLessons(false);
      setSelectedCategoryForBulk('');
    }
  };
  const handleOpenBulkLessons = (categoryId: string) => {
    setSelectedCategoryForBulk(categoryId);
    setShowBulkLessons(true);
  };

  const handleOpenNewLessonDialog = (categoryId: string) => {
    setNewLessonCategory(categoryId);
    setShowCreateLesson(true);
  };
  const handleEditarAula = async (lessonId: string, name: string, duration: number) => {
    console.log('Editando aula:', lessonId, name, duration);
    return await editarAula(lessonId, name, duration);
  };
  const handleExcluirAula = async (lessonId: string, lessonName: string) => {
    console.log('Tentando excluir aula:', lessonId, lessonName);
    if (window.confirm(`Tem certeza que deseja excluir a aula "${lessonName}"?`)) {
      await excluirAula(lessonId);
    }
  };
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'audio' | 'html') => {
    const file = event.target.files?.[0];
    if (!file || !selectedLesson) return;
    try {
      if (type === 'pdf') {
        await uploadDocument(selectedLesson, file);
      } else if (type === 'audio') {
        await uploadAudioFile(selectedLesson, file);
      } else if (type === 'html') {
        await uploadHtmlFile(selectedLesson, file);
      }
      toast({
        title: "Arquivo enviado!",
        description: `${type === 'pdf' ? 'Documento' : type === 'audio' ? 'Áudio' : 'HTML'} foi enviado com sucesso`
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo",
        variant: "destructive"
      });
    }
  };
  const handleWebsiteSubmit = async () => {
    if (websiteEditingLessonId && websiteUrl.trim()) {
      // Converter URL do Google Drive para formato embed
      let processedUrl = websiteUrl.trim();

      // Verificar se é um link do Google Drive e converter para embed
      const driveMatch = processedUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (driveMatch) {
        processedUrl = `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
      }
      const success = await atualizarWebsiteUrl(websiteEditingLessonId, processedUrl);
      if (success) {
        setShowWebsiteDialog(false);
        setWebsiteUrl('');
        setWebsiteEditingLessonId(null);
        toast({
          title: "Link do vídeo salvo!",
          description: "O link foi convertido para formato de embed e está pronto para reprodução na seção Aulas"
        });
      }
    }
  };
  const openWebsiteDialog = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    setWebsiteEditingLessonId(lessonId);
    setWebsiteUrl(lesson?.website_url || '');
    setShowWebsiteDialog(true);
  };
  const openWebsite = (url: string) => {
    if (url) {
      window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
    }
  };
  const handleMarkAsWatched = async (lessonId: string, watched: boolean) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (watched && lesson) {
      // Criar sessão de estudo e marcar como concluída com a duração da aula
      await criarEMarcarConcluida('livro', lessonId, lesson.name, lesson.duration_minutes);
    }
    await marcarAulaAssistida(lessonId, watched);
  };
  const handlePlayAudio = (audioPath: string) => {
    // Parar qualquer áudio atual antes de iniciar novo
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setCurrentAudioPath(null);
    }
    try {
      const audioUrl = getFileUrl(audioPath);
      console.log('Audio URL:', audioUrl);
      const audio = new Audio(audioUrl);
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setCurrentAudioPath(null);
        setCurrentAudio(null);
      });
      audio.addEventListener('error', e => {
        console.error('Erro ao carregar áudio:', e);
        toast({
          title: "Erro no áudio",
          description: "Não foi possível carregar o arquivo de áudio",
          variant: "destructive"
        });
      });
      audio.play();
      setCurrentAudio(audio);
      setIsPlaying(true);
      setCurrentAudioPath(audioPath);
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      toast({
        title: "Erro no áudio",
        description: "Não foi possível reproduzir o áudio",
        variant: "destructive"
      });
    }
  };
  const handlePauseAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
    }
  };
  const handleResumeAudio = () => {
    if (currentAudio) {
      currentAudio.play();
      setIsPlaying(true);
    }
  };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (currentAudio) {
      currentAudio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  const handleViewDocument = (documentPath: string) => {
    try {
      const url = getDocumentUrl(documentPath);
      console.log('Document URL:', url);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Erro ao abrir documento:', error);
    }
  };
  const handleMarkDocumentAsStudied = async (documentId: string, documentTitle: string) => {
    try {
      // Estimar 30 minutos para leitura de documento
      const estimatedTime = 30;
      await criarEMarcarConcluida('livro', documentId, documentTitle, estimatedTime);
      toast({
        title: "Documento marcado como estudado!",
        description: `${documentTitle} foi marcado como estudado`
      });
    } catch (error) {
      console.error('Erro ao marcar documento como estudado:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar o documento como estudado",
        variant: "destructive"
      });
    }
  };
  const handleMarkAudioAsStudied = async (lessonId: string, lessonTitle: string) => {
    try {
      const lesson = lessons.find(l => l.id === lessonId);
      const duration = lesson ? lesson.duration_minutes : 45; // Default para 45 minutos se não encontrar
      await criarEMarcarConcluida('audio', lessonId, `Áudio - ${lessonTitle}`, duration);
      toast({
        title: "Áudio marcado como estudado!",
        description: `Áudio de ${lessonTitle} foi marcado como estudado`
      });
    } catch (error) {
      console.error('Erro ao marcar áudio como estudado:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar o áudio como estudado",
        variant: "destructive"
      });
    }
  };
  const handleMarkWebsiteAsStudied = async (lessonId: string, lessonTitle: string) => {
    try {
      // Estimar 20 minutos para leitura de website
      const estimatedTime = 20;
      await criarEMarcarConcluida('website', lessonId, `Website - ${lessonTitle}`, estimatedTime);
      toast({
        title: "Website marcado como estudado!",
        description: `Website de ${lessonTitle} foi marcado como estudado`
      });
    } catch (error) {
      console.error('Erro ao marcar website como estudado:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar o website como estudado",
        variant: "destructive"
      });
    }
  };
  const handleViewHtml = (htmlPath: string) => {
    try {
      const url = getFileUrl(htmlPath);
      const fileName = htmlPath.split('/').pop() || 'documento.html';
      setHtmlViewerData({
        url,
        fileName
      });
      setShowHtmlViewer(true);
    } catch (error) {
      console.error('Erro ao abrir HTML:', error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir o arquivo HTML",
        variant: "destructive"
      });
    }
  };
  const handleMarkHtmlAsStudied = async (lessonId: string, lessonTitle: string) => {
    try {
      // Estimar 25 minutos para leitura de HTML
      const estimatedTime = 25;
      await criarEMarcarConcluida('livro', lessonId, `HTML - ${lessonTitle}`, estimatedTime);
      toast({
        title: "HTML marcado como estudado!",
        description: `HTML de ${lessonTitle} foi marcado como estudado`
      });
    } catch (error) {
      console.error('Erro ao marcar HTML como estudado:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar o HTML como estudado",
        variant: "destructive"
      });
    }
  };
  const deleteHtml = async (lessonId: string) => {
    try {
      // Primeiro, obter o caminho do arquivo
      const {
        data: lesson,
        error: fetchError
      } = await supabase.from('lessons').select('html_file_path').eq('id', lessonId).single();
      if (fetchError || !lesson?.html_file_path) {
        throw new Error('Arquivo HTML não encontrado');
      }

      // Remover do storage
      const {
        error: deleteError
      } = await supabase.storage.from('lesson-files').remove([lesson.html_file_path]);
      if (deleteError) {
        console.error('Delete error:', deleteError);
      }

      // Remover referência da tabela lessons
      const {
        error: updateError
      } = await supabase.from('lessons').update({
        html_file_path: null
      }).eq('id', lessonId);
      if (updateError) {
        throw new Error(`Erro ao atualizar aula: ${updateError.message}`);
      }
      toast({
        title: "HTML removido",
        description: "O arquivo HTML foi excluído com sucesso"
      });
    } catch (error: any) {
      console.error('Erro ao excluir HTML:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
    }
  };
  const handleDownloadAudio = async (audioPath: string, lessonName: string) => {
    try {
      const blob = await downloadFileAsBlob(audioPath);
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audio_${lessonName.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download iniciado",
        description: "O download do áudio foi iniciado."
      });
    } catch (error) {
      console.error('Erro ao fazer download do áudio:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível fazer o download do áudio.",
        variant: "destructive"
      });
    }
  };
  const isResourceStudied = (resourceId: string, studyType: string) => {
    return sessions.some(session => session.resource_id === resourceId && session.study_type === studyType && session.is_completed);
  };
  const getCategoryStats = (categoryId: string) => {
    const categoryLessons = lessons.filter(lesson => lesson.category_id === categoryId);
    const watchedLessons = categoryLessons.filter(lesson => lesson.watched);
    const totalHours = categoryLessons.reduce((acc, lesson) => acc + lesson.duration_minutes, 0);
    const watchedHours = watchedLessons.reduce((acc, lesson) => acc + lesson.duration_minutes, 0);
    return {
      totalLessons: categoryLessons.length,
      watchedLessons: watchedLessons.length,
      totalHours,
      watchedHours
    };
  };
  const selectedLessonData = lessons.find(l => l.id === selectedLesson);
  const selectedLessonDocuments = documents.filter(d => d.lesson_id === selectedLesson);
  const selectedLessonHasAudio = selectedLessonData?.audio_file_path;
  const selectedLessonHasHtml = selectedLessonData?.html_file_path;
  const selectedLessonWebsite = selectedLessonData?.website_url;
  const selectedLessonFlashcards = flashcards.filter(f => f.lesson_id === selectedLesson);
  const selectedLessonQuestions = questions.filter(q => q.lesson_id === selectedLesson);
  const handleArquivarCategoria = async (categoryId: string, isArchived: boolean) => {
    const action = isArchived ? "desarquivar" : "arquivar";
    const categoria = allCategories.find(cat => cat.id === categoryId);
    if (window.confirm(`Tem certeza que deseja ${action} a categoria "${categoria?.name}"?`)) {
      await arquivarCategoria(categoryId, !isArchived);
    }
  };
  const handleExcluirCategoria = async (categoryId: string) => {
    const categoria = allCategories.find(cat => cat.id === categoryId);
    const categoryLessons = lessons.filter(lesson => lesson.category_id === categoryId);
    const confirmMessage = categoryLessons.length > 0 ? `Tem certeza que deseja excluir a categoria "${categoria?.name}"? Esta ação também excluirá ${categoryLessons.length} aula(s) e não pode ser desfeita.` : `Tem certeza que deseja excluir a categoria "${categoria?.name}"?`;
    if (window.confirm(confirmMessage)) {
      await excluirCategoria(categoryId);
    }
  };
  const handleOpenPerformanceModal = (lessonId: string) => {
    setPerformanceLessonId(lessonId);
    setShowPerformanceModal(true);
  };
  const handleSavePerformance = async (correct: number, incorrect: number) => {
    if (performanceLessonId) {
      await addOrUpdatePerformance(performanceLessonId, correct, incorrect);
      setPerformanceLessonId(null);
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando resumos...</p>
        </div>
      </div>;
  }
  if (showFlashcardWizard && selectedLesson) {
    return <LessonFlashcardWizard lessonId={selectedLesson} lessonTitle={selectedLessonData?.name || ''} onBack={() => {
      setShowFlashcardWizard(false);
      toast({
        title: "Flashcard criado!",
        description: "Novo flashcard foi adicionado à aula"
      });
    }} />;
  }
  if (showQuestionWizard && selectedLesson) {
    return <LessonQuestionWizard lessonId={selectedLesson} lessonTitle={selectedLessonData?.name || ''} onBack={() => {
      setShowQuestionWizard(false);
      toast({
        title: "Exercício criado!",
        description: "Novo exercício foi adicionado à aula"
      });
    }} />;
  }
  if (showFlashcardExecution && selectedLesson) {
    return <LessonFlashcardWizard lessonId={selectedLesson} lessonTitle={selectedLessonData?.name || ''} onBack={() => setShowFlashcardExecution(false)} />;
  }
  if (showQuestionExecution && selectedLesson) {
    return <LessonQuestionExecution lessonId={selectedLesson} lessonTitle={selectedLessonData?.name || ''} onBack={() => setShowQuestionExecution(false)} />;
  }
  if (showBulkFlashcards && selectedLesson) {
    return <BulkFlashcardForm lessonId={selectedLesson} lessonTitle={selectedLessonData?.name || ''} onBack={() => setShowBulkFlashcards(false)} onFlashcardsCreated={() => {
      setShowBulkFlashcards(false);
      carregarFlashcards(selectedLesson);
      toast({
        title: "Flashcards criados!",
        description: "Flashcards foram adicionados à aula"
      });
    }} />;
  }
  if (showBulkQuestions && selectedLesson) {
    return <BulkQuestionForm lessonId={selectedLesson} lessonTitle={selectedLessonData?.name || ''} onBack={() => setShowBulkQuestions(false)} onQuestionsCreated={() => {
      setShowBulkQuestions(false);
      carregarQuestoes(selectedLesson);
      toast({
        title: "Exercícios criados!",
        description: "Exercícios foram adicionados à aula"
      });
    }} />;
  }
  if (showQuestionManager && selectedLesson) {
    return <QuestionManager lessonId={selectedLesson} lessonTitle={selectedLessonData?.name || ''} onBack={() => {
      setShowQuestionManager(false);
      carregarQuestoes(selectedLesson);
    }} />;
  }
  if (showTextUpload && selectedLesson) {
    return <LessonTextUpload lessonId={selectedLesson} lessonTitle={selectedLessonData?.name || ''} onBack={() => setShowTextUpload(false)} onUploadComplete={() => {
      setShowTextUpload(false);
      toast({
        title: "Arquivo TXT adicionado!",
        description: "Arquivo de texto foi adicionado à aula"
      });
    }} />;
  }
  return <div className="space-y-6 px-[15px] py-[15px] mx-[8px] my-[8px]">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Resumos</h1>
        <div className="flex gap-2">
          {/* Botão de Visibilidade */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Visibilidade
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setShowArchived(!showArchived)}>
                {showArchived ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                <span>{showArchived ? 'Ocultar Arquivadas' : 'Mostrar Arquivadas'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Botão de Compartilhamento */}
          <Button variant="outline" onClick={() => setShowShareModal(true)}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar Conteúdo
          </Button>

          {/* Botão de Criação */}
          <Button onClick={() => setShowCreateCategory(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>

          {/* Dialogs for creating content - they are now triggered from the dropdown */}
          <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Categoria</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="categoryName">Nome da Categoria</Label>
                  <Input id="categoryName" placeholder="Ex: Matemática, Português, etc." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleCreateCategory()} />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateCategory(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
                    Criar Categoria
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateLesson} onOpenChange={setShowCreateLesson}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Aula</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="lessonCategory">Categoria</Label>
                  <select id="lessonCategory" value={newLessonCategory} onChange={e => setNewLessonCategory(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">Selecione uma categoria</option>
                    {categories.map(category => <option key={category.id} value={category.id}>
                        {category.name}
                      </option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="lessonName">Nome da Aula</Label>
                  <Input id="lessonName" placeholder="Ex: Introdução à Álgebra" value={newLessonName} onChange={e => setNewLessonName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="lessonDuration">Duração (minutos)</Label>
                  <Input id="lessonDuration" type="number" placeholder="Ex: 45" value={newLessonDuration} onChange={e => setNewLessonDuration(e.target.value)} />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateLesson(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateLesson} disabled={!newLessonName.trim() || !newLessonDuration || !newLessonCategory}>
                    Criar Aula
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Dialog para Link do Vídeo */}
      <Dialog open={showWebsiteDialog} onOpenChange={setShowWebsiteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Link do Vídeo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="websiteUrl">URL do Vídeo</Label>
              <Input id="websiteUrl" placeholder="Cole o link do Google Drive ou outro serviço de vídeo" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleWebsiteSubmit()} />
              <p className="text-xs text-gray-500 mt-1">
                Suporte para Google Drive, YouTube, Vimeo e outros serviços de vídeo
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowWebsiteDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleWebsiteSubmit} disabled={!websiteUrl.trim()}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Performance Modal */}
      <LessonPerformanceModal isOpen={showPerformanceModal} onClose={() => {
      setShowPerformanceModal(false);
      setPerformanceLessonId(null);
    }} lessonTitle={performanceLessonId ? lessons.find(l => l.id === performanceLessonId)?.name || '' : ''} lessonId={performanceLessonId || ''} />

      {/* Modal de Anotações */}
      <LessonNotes lessonId={selectedLesson || ''} lessonTitle={selectedLessonData?.name || ''} isOpen={showLessonNotes} onClose={() => setShowLessonNotes(false)} />

      {/* Modal de Transcrição de Áudio */}
      <AudioTranscription lessonId={selectedLesson || ''} lessonTitle={selectedLessonData?.name || ''} currentTime={currentTime} isOpen={showAudioTranscription} onClose={() => setShowAudioTranscription(false)} />

      {/* Bulk Lessons Modal */}
      {showBulkLessons && <BulkLessonForm
        isOpen={showBulkLessons}
        onClose={() => {
            setShowBulkLessons(false);
            setSelectedCategoryForBulk('');
        }}
        onSubmit={handleBulkLessonsSubmit}
        categoryId={selectedCategoryForBulk}
      />}

      {/* Filtros - só aparece quando não há aula selecionada */}
      {!selectedLesson && <ResumosFilters onFilterChange={setFilters} />}

      {selectedLesson ? (
        <LessonDetailView
          lesson={selectedLessonData}
          documents={selectedLessonDocuments}
          flashcards={selectedLessonFlashcards}
          questions={selectedLessonQuestions}
          audioState={{ currentAudio, isPlaying, currentTime, duration, currentAudioPath }}
          audioHandlers={{ play: handlePlayAudio, pause: handlePauseAudio, resume: handleResumeAudio, seek: handleSeek, formatTime }}
          onBack={() => setSelectedLesson(null)}
          // Handlers for LessonDetailView
          handleFileUpload={handleFileUpload}
          openWebsiteDialog={openWebsiteDialog}
          setShowBulkFlashcards={setShowBulkFlashcards}
          setShowBulkQuestions={setShowBulkQuestions}
          setShowLessonNotes={setShowLessonNotes}
          getDocumentUrl={getDocumentUrl}
          deleteDocument={deleteDocument}
          deleteAudio={(lessonId) => deleteAudio(lessonId)}
          deleteHtml={deleteHtml}
          handleMarkDocumentAsStudied={handleMarkDocumentAsStudied}
          handleMarkAudioAsStudied={handleMarkAudioAsStudied}
          handleMarkHtmlAsStudied={handleMarkHtmlAsStudied}
          handleMarkWebsiteAsStudied={handleMarkWebsiteAsStudied}
          isResourceStudied={isResourceStudied}
          onFlashcardUpdated={() => carregarFlashcards(selectedLesson)}
          handleViewHtml={handleViewHtml}
          openWebsite={openWebsite}
          setShowAudioTranscription={setShowAudioTranscription}
          handleDownloadAudio={handleDownloadAudio}
        />
      ) : (
        <div className="grid gap-4">
          {categories.length === 0 && !showArchived ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma categoria criada ainda</p>
                  <p className="text-sm">Clique em "Adicionar" para começar</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            categories.map(category => {
              const allCategoryLessons = lessons.filter(
                lesson => lesson.category_id === category.id
              );
              const filteredCategoryLessons = filterLessons(allCategoryLessons);
              const sortedCategoryLessons = sortLessonsNumerically(
                filteredCategoryLessons
              ).map(lesson => {
                const lessonQuestions = questions.filter(
                  q => q.lesson_id === lesson.id
                );
                const lessonAttempts = attempts.filter(attempt =>
                  lessonQuestions.some(q => q.id === attempt.question_id)
                );
                const lessonDocuments = documents.filter(
                  d => d.lesson_id === lesson.id
                );
                return {
                  ...lesson,
                  questions: lessonQuestions,
                  attempts: lessonAttempts,
                  documents: lessonDocuments,
                };
              });

              return (
                <CategoryCard
                  key={category.id}
                  category={category}
                  lessons={sortedCategoryLessons}
                  isExpanded={expandedCategories[category.id]}
                  onToggle={() => toggleCategory(category.id)}
                  onEdit={() => handleEditCategory(category)}
                  onArchive={handleArquivarCategoria}
                  onDelete={handleExcluirCategoria}
                  onLessonClick={setSelectedLesson}
                  onEditLesson={setEditingLesson}
                  onDeleteLesson={handleExcluirAula}
                  onMarkLessonAsWatched={handleMarkAsWatched}
                  onAddLesson={handleOpenNewLessonDialog}
                  onAddBulkLessons={handleOpenBulkLessons}
                />
              );
            })
          )}
        </div>
      )}

      <LessonEditModal lesson={editingLesson} isOpen={!!editingLesson} onClose={() => setEditingLesson(null)} onSave={handleEditarAula} />

      {/* Category Edit Modal */}
      <CategoryEditModal isOpen={showCategoryEdit} onClose={() => {
      setShowCategoryEdit(false);
      setEditingCategory(null);
    }} category={editingCategory} onSave={handleSaveCategory} />

      {/* HTML Viewer */}
      {showHtmlViewer && htmlViewerData && <HTMLViewer htmlUrl={htmlViewerData.url} fileName={htmlViewerData.fileName} onClose={() => {
      setShowHtmlViewer(false);
      setHtmlViewerData(null);
    }} />}

      {/* Share Content Modal */}
      <ShareContentModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        categories={categories}
        lessons={lessons}
        sendShareRequest={sendShareRequest}
      />

      {/* Shared Content Manager */}
      <SharedContentManager 
        isOpen={showSharedContentManager}
        onClose={() => setShowSharedContentManager(false)}
      />

      {/* Import Management Modal */}
      <ImportManagementModal 
        isOpen={showImportManager}
        onClose={() => setShowImportManager(false)}
      />
    </div>;
};
export default Resumos;