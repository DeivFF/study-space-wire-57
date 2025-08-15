import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, FileText, Headphones, Link as LinkIcon, Layers, PencilRuler, NotebookPen, Eye, Check, MoreHorizontal, Trash2, Pause, Play, Download, Subtitles, Globe, ExternalLink, Edit, Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FlashcardTable from './FlashcardTable';
import { QuestionList } from './QuestionList';
import { LessonNotesView } from './LessonNotesView';

// --- Prop Types ---
interface Document { id: string; title: string; file_name: string; file_path: string; }
interface LessonFlashcard { id: string; lesson_id: string; frente: string; verso: string; dica?: string; created_at: string; updated_at: string; }
interface Question { id: string; question: string; options: string[]; correct_answer: number; explanation?: string; }
interface AudioState {
  currentAudio: HTMLAudioElement | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentAudioPath: string | null;
}
interface AudioHandlers {
  play: (path: string) => void;
  pause: () => void;
  resume: () => void;
  seek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatTime: (time: number) => string;
}

interface LessonDetailViewProps {
  lesson: any;
  documents: Document[];
  flashcards: LessonFlashcard[];
  questions: Question[];
  audioState: AudioState;
  audioHandlers: AudioHandlers;
  onBack: () => void;
  // Handlers from Resumos
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'audio' | 'html') => void;
  openWebsiteDialog: (lessonId: string) => void;
  setShowBulkFlashcards: (show: boolean) => void;
  setShowBulkQuestions: (show: boolean) => void;
  setShowLessonNotes: (show: boolean) => void; // This might need to change if notes are inline
  getDocumentUrl: (path: string) => string;
  deleteDocument: (id: string) => void;
  deleteAudio: (id: string) => void;
  deleteHtml: (id: string) => void;
  handleMarkDocumentAsStudied: (id: string, title: string) => void;
  handleMarkAudioAsStudied: (id: string, title: string) => void;
  handleMarkHtmlAsStudied: (id: string, title: string) => void;
  handleMarkWebsiteAsStudied: (id: string, title: string) => void;
  isResourceStudied: (id: string, type: string) => boolean;
  onFlashcardUpdated: () => void;
  handleViewHtml: (path: string) => void;
  openWebsite: (url: string) => void;
  setShowAudioTranscription: (show: boolean) => void;
  handleDownloadAudio: (path: string, name: string) => void;
}

export const LessonDetailView = (props: LessonDetailViewProps) => {
  const {
    lesson, documents, flashcards, questions, audioState, audioHandlers,
    onBack, handleFileUpload, openWebsiteDialog, setShowBulkFlashcards, setShowBulkQuestions, setShowLessonNotes,
    getDocumentUrl, deleteDocument, deleteAudio, deleteHtml,
    handleMarkDocumentAsStudied, handleMarkAudioAsStudied, handleMarkHtmlAsStudied, handleMarkWebsiteAsStudied,
    isResourceStudied, onFlashcardUpdated, handleViewHtml, openWebsite,
    setShowAudioTranscription, handleDownloadAudio
  } = props;

  const [viewingPdfUrl, setViewingPdfUrl] = useState<string | null>(null);

  // Refs for hidden file inputs
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const htmlInputRef = useRef<HTMLInputElement>(null);

  if (!lesson) return null;

  const handleViewDocument = (documentPath: string) => {
    try {
      const url = getDocumentUrl(documentPath);
      setViewingPdfUrl(url);
    } catch (error) {
      console.error('Erro ao abrir documento:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input type="file" accept=".pdf" ref={pdfInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'pdf')} />
      <input type="file" accept=".mp3,.wav,.m4a" ref={audioInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'audio')} />
      <input type="file" accept=".html" ref={htmlInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'html')} />

      {/* Header */}
      <div>
        <Button variant="outline" onClick={() => { setViewingPdfUrl(null); onBack(); }} className="mb-4">
          ← Voltar para a lista
        </Button>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-gray-900">{lesson.name}</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Adicionar</Button></DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Conteúdo</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => pdfInputRef.current?.click()}><FileText className="mr-2 h-4 w-4" /><span>Adicionar documento PDF</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => audioInputRef.current?.click()}><Headphones className="mr-2 h-4 w-4" /><span>Adicionar arquivo de áudio</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => openWebsiteDialog(lesson.id)}><LinkIcon className="mr-2 h-4 w-4" /><span>Adicionar link de website</span></DropdownMenuItem>
                 <DropdownMenuItem onClick={() => htmlInputRef.current?.click()}><FileText className="mr-2 h-4 w-4" /><span>Adicionar arquivo HTML</span></DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Recursos de Estudo</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setShowBulkFlashcards(true)}><Layers className="mr-2 h-4 w-4" /><span>Criar múltiplos flashcards</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowBulkQuestions(true)}><PencilRuler className="mr-2 h-4 w-4" /><span>Criar múltiplos exercícios</span></DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Pessoal</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setShowLessonNotes(true)}><NotebookPen className="mr-2 h-4 w-4" /><span>Adicionar nova anotação</span></DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        <Tabs defaultValue="arquivos" className="w-full">
           <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
            <TabsTrigger value="exercicios">Exercícios</TabsTrigger>
            <TabsTrigger value="anotacoes">Anotações</TabsTrigger>
          </TabsList>

          <TabsContent value="arquivos">
            <Card className="mt-2">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  {documents.map(doc => ( <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"><div className="flex items-center space-x-3"><FileText className="w-5 h-5 text-red-600" /><div><span className="font-medium">{doc.title}</span><p className="text-sm text-gray-600">PDF • {doc.file_name}</p></div></div><DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleViewDocument(doc.file_path)}><Eye className="w-4 h-4 mr-2" />Visualizar</DropdownMenuItem><DropdownMenuItem onClick={() => handleMarkDocumentAsStudied(doc.id, doc.title)} disabled={isResourceStudied(doc.id, 'livro')}><Check className="w-4 h-4 mr-2" />{isResourceStudied(doc.id, 'livro') ? 'Estudado' : 'Marcar como Estudado'}</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => deleteDocument(doc.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>))}
                  {lesson.audio_file_path && (<div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"><div className="flex items-center space-x-3"><Headphones className="w-5 h-5 text-blue-600" /><div><span className="font-medium">Áudio da Aula</span><p className="text-sm text-gray-600">MP3 • Arquivo de áudio</p></div></div><DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => audioState.currentAudioPath === lesson.audio_file_path && audioState.isPlaying ? audioHandlers.pause() : audioHandlers.play(lesson.audio_file_path)}>{audioState.currentAudioPath === lesson.audio_file_path && audioState.isPlaying ? <><Pause className="w-4 h-4 mr-2" />Pausar</> : <><Play className="w-4 h-4 mr-2" />Ouvir</>}</DropdownMenuItem><DropdownMenuItem onClick={() => setShowAudioTranscription(true)}><Subtitles className="w-4 h-4 mr-2" />Transcrição</DropdownMenuItem><DropdownMenuItem onClick={() => handleDownloadAudio(lesson.audio_file_path, lesson.name)}><Download className="w-4 h-4 mr-2" />Baixar</DropdownMenuItem><DropdownMenuItem onClick={() => handleMarkAudioAsStudied(lesson.id, lesson.name)} disabled={isResourceStudied(lesson.id, 'audio')}><Check className="w-4 h-4 mr-2" />{isResourceStudied(lesson.id, 'audio') ? 'Estudado' : 'Marcar como Estudado'}</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => deleteAudio(lesson.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>)}
                  {lesson.html_file_path && (<div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"><div className="flex items-center space-x-3"><FileText className="w-5 h-5 text-orange-600" /><div><span className="font-medium">Documento HTML</span><p className="text-sm text-gray-600">HTML • Documento web</p></div></div><div className="flex items-center space-x-2"><Button size="sm" variant="outline" onClick={() => handleViewHtml(lesson.html_file_path)}><Eye className="w-4 h-4 mr-1" />Visualizar</Button><Button size="sm" variant="outline" onClick={() => handleMarkHtmlAsStudied(lesson.id, lesson.name)} disabled={isResourceStudied(lesson.id, 'livro')}><Check className="w-4 h-4 mr-1" />{isResourceStudied(lesson.id, 'livro') ? 'Estudado' : 'Estudado'}</Button><Button size="sm" variant="outline" onClick={() => deleteHtml(lesson.id)}><Trash2 className="w-4 h-4" /></Button></div></div>)}
                  {lesson.website_url && (<div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"><div className="flex items-center space-x-3"><Globe className="w-5 h-5 text-green-600" /><div><span className="font-medium">Website</span><p className="text-sm text-gray-600 truncate max-w-md">{lesson.website_url}</p></div></div><div className="flex items-center space-x-2"><Button size="sm" variant="outline" onClick={() => openWebsite(lesson.website_url)}><ExternalLink className="w-4 h-4 mr-1" />Abrir</Button><Button size="sm" variant="outline" onClick={() => handleMarkWebsiteAsStudied(lesson.id, lesson.name)} disabled={isResourceStudied(lesson.id, 'website')}><Check className="w-4 h-4 mr-1" />{isResourceStudied(lesson.id, 'website') ? 'Estudado' : 'Estudado'}</Button><Button size="sm" variant="outline" onClick={() => openWebsiteDialog(lesson.id)}><Edit className="w-4 h-4" /></Button></div></div>)}
                </div>
                {viewingPdfUrl && (<div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center mb-2"><h3 className="text-lg font-semibold">Visualizador de PDF</h3><Button variant="outline" size="sm" onClick={() => setViewingPdfUrl(null)}>Fechar Visualizador</Button></div><div className="w-full h-[600px] border rounded-lg overflow-hidden bg-gray-200"><iframe src={viewingPdfUrl} className="w-full h-full" title="PDF Viewer" /></div></div>)}
                {audioState.currentAudio && (<Card className="mt-4"><CardHeader><CardTitle className="flex items-center space-x-2"><Volume2 className="w-5 h-5" /><span>Player de Áudio</span></CardTitle></CardHeader><CardContent><div className="flex items-center space-x-4"><Button onClick={audioState.isPlaying ? audioHandlers.pause : audioHandlers.resume} size="sm" variant="outline">{audioState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</Button><div className="flex-1"><input type="range" min="0" max={audioState.duration} value={audioState.currentTime} onChange={audioHandlers.seek} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" /></div><div className="text-sm text-gray-600 min-w-[80px]">{audioHandlers.formatTime(audioState.currentTime)} / {audioHandlers.formatTime(audioState.duration)}</div></div></CardContent></Card>)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flashcards"><div className="mt-2"><FlashcardTable flashcards={flashcards} lessonId={lesson.id} onFlashcardUpdated={onFlashcardUpdated}/></div></TabsContent>
          <TabsContent value="exercicios"><div className="mt-2"><QuestionList questions={questions} /></div></TabsContent>
          <TabsContent value="anotacoes"><div className="p-4 border rounded-lg mt-2"><LessonNotesView lessonId={lesson.id} /></div></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
