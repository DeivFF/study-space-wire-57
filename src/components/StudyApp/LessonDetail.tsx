import { ArrowLeft, Play, Check, Eye, Download, FileText, Headphones, Code, Globe, Upload, Paperclip, Plus, Save, X, Trash2, RotateCcw, ChevronRight, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useStudyApp } from '@/contexts/StudyAppContext';

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

  const selectedCategory = state.categories.find(cat => cat.id === state.selectedCategoryId);
  const selectedLesson = selectedCategory?.lessons.find(lesson => lesson.id === state.selectedLessonId);

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
            <div className="border-2 border-dashed border-app-border rounded-xl p-8 text-center bg-app-bg">
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-8 h-8 text-app-text-muted" />
                <div className="text-app-text-muted">Arraste e solte arquivos aqui, ou</div>
                <Button variant="outline" className="text-app-text border-app-border hover:bg-app-muted">
                  <Paperclip className="w-4 h-4" />
                  Selecionar arquivos
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-app-text">Arquivos anexados</h3>
              <div className="flex items-center gap-3">
                <Input 
                  placeholder="Filtrar..." 
                  className="w-48 bg-app-bg border-app-border text-app-text"
                />
                <span className="text-sm text-app-text-muted">{selectedLesson.resources.length} itens</span>
              </div>
            </div>

            <div className="space-y-2">
              {selectedLesson.resources.map((resource) => {
                const Icon = resourceIcons[resource.type];
                return (
                  <div key={resource.id} className="flex items-center gap-3 p-3 border border-app-border rounded-xl bg-app-bg">
                    <Icon className="w-5 h-5 text-app-text" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-app-text truncate flex items-center gap-2">
                        {resource.name}
                        {resource.primary && (
                          <Badge className="bg-app-accent/20 text-app-accent border-app-accent/30 text-xs">
                            Principal
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-app-text-muted">
                        {resource.size || resource.duration || '—'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-app-text border-app-border hover:bg-app-muted">
                        <Eye className="w-4 h-4" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" className="text-app-text border-app-border hover:bg-app-muted">
                        <Download className="w-4 h-4" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="p-4 mt-0 space-y-4">
            <div className="flex items-center gap-3">
              <Button className="bg-app-accent text-white hover:bg-app-accent/90">
                <Plus className="w-4 h-4" />
                Nova anotação
              </Button>
              <Input 
                placeholder="Buscar anotações..." 
                className="flex-1 bg-app-bg border-app-border text-app-text"
              />
            </div>

            <div className="border border-app-border rounded-xl p-4 bg-app-bg">
              <Textarea
                placeholder="Escreva anotações em Markdown…"
                value={selectedLesson.notes || ''}
                className="min-h-[300px] border-0 bg-transparent text-app-text resize-none focus-visible:ring-0"
              />
            </div>
          </TabsContent>

          <TabsContent value="flashcards" className="p-4 mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-app-text">Gerenciar flashcards</h3>
              <div className="flex items-center gap-3">
                <Input 
                  placeholder="Buscar cartões..." 
                  className="w-48 bg-app-bg border-app-border text-app-text"
                />
                <Button variant="outline" className="text-app-text border-app-border hover:bg-app-muted">
                  <Plus className="w-4 h-4" />
                  Novo cartão
                </Button>
              </div>
            </div>

            <div className="border-t border-app-border pt-4">
              <h4 className="text-lg font-semibold text-app-text mb-3">Realizar flashcards</h4>
              <div className="flex items-center gap-3 mb-4">
                <Button className="bg-app-accent text-white hover:bg-app-accent/90">
                  <Play className="w-4 h-4" />
                  Iniciar sessão
                </Button>
                <span className="text-sm text-app-text-muted">
                  Você tem <span className="font-semibold">{selectedLesson.flashcardsDue}</span> cards para hoje.
                </span>
              </div>

              <div className="border border-dashed border-app-border rounded-xl p-8 text-center bg-app-bg min-h-[160px] flex items-center justify-center">
                <div className="text-app-text-muted">Nenhuma sessão ativa.</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="exercises" className="p-4 mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-app-text">Banco de exercícios</h3>
              <div className="flex items-center gap-3">
                <select className="px-3 py-2 border border-app-border rounded-lg bg-app-bg text-app-text">
                  <option value="all">Todos</option>
                  <option value="mcq">Múltipla escolha</option>
                  <option value="essay">Dissertativo</option>
                </select>
                <Input 
                  placeholder="Buscar exercícios..." 
                  className="w-48 bg-app-bg border-app-border text-app-text"
                />
                <Button variant="outline" className="text-app-text border-app-border hover:bg-app-muted">
                  <Plus className="w-4 h-4" />
                  Novo exercício
                </Button>
              </div>
            </div>

            <div className="border border-app-border rounded-xl p-4 bg-app-bg">
              <div className="text-sm text-app-text-muted text-center py-8">
                Desempenho e prática (placeholder)
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="p-4 mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-app-text">Linha do tempo da aula</h3>
              <div className="flex items-center gap-3">
                <select className="px-3 py-2 border border-app-border rounded-lg bg-app-bg text-app-text">
                  <option value="all">Todos</option>
                  <option value="file">Arquivos</option>
                  <option value="note">Anotações</option>
                  <option value="flashcard">Flashcards</option>
                  <option value="exercise">Exercícios</option>
                  <option value="audio">Áudio</option>
                </select>
                <Button variant="outline" className="text-app-text border-app-border hover:bg-app-muted">
                  <Trash2 className="w-4 h-4" />
                  Limpar (local)
                </Button>
              </div>
            </div>

            <div className="border border-app-border rounded-xl p-4 bg-app-bg">
              <div className="text-sm text-app-text-muted text-center py-8">
                Log de atividade (placeholder)
              </div>
            </div>
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
                    <span className="text-app-text">1</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}