import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, RotateCcw, Check, X, Plus, Brain, Clock, 
  Target, Zap, TrendingUp, Eye, EyeOff, SkipForward,
  Award, Lightbulb, Filter, Search, Trash2, Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useFlashcards } from '@/hooks/useFlashcards';
import { LoadingSpinner, FlashcardSkeleton } from '@/components/ui/advanced-loading';
import { Flashcard } from '@/services/studyApi';
import { cn } from '@/lib/utils';
import { FlashcardMigration } from '../FlashcardMigration';

interface FlashcardsTabProps {
  lessonId: string;
}

interface FlashcardFormProps {
  card?: Flashcard;
  onSave: (data: { front_content: string; back_content: string; tags: string[] }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const FlashcardForm = ({ card, onSave, onCancel, isLoading = false }: FlashcardFormProps) => {
  const [frontContent, setFrontContent] = useState(card?.front_content || '');
  const [backContent, setBackContent] = useState(card?.back_content || '');
  const [tagsInput, setTagsInput] = useState(card?.tags.join(', ') || '');

  const handleSave = () => {
    if (!frontContent.trim() || !backContent.trim()) return;
    
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
      
    onSave({ front_content: frontContent, back_content: backContent, tags });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-app-text">Frente do card *</label>
        <Textarea
          placeholder="Pergunta ou conceito a ser estudado..."
          value={frontContent}
          onChange={(e) => setFrontContent(e.target.value)}
          className="bg-app-bg border-app-border text-app-text resize-none"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-app-text">Verso do card *</label>
        <Textarea
          placeholder="Resposta ou explicação..."
          value={backContent}
          onChange={(e) => setBackContent(e.target.value)}
          className="bg-app-bg border-app-border text-app-text resize-none"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-app-text">Tags (separadas por vírgula)</label>
        <Input
          placeholder="Ex: importante, fórmula, conceito"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="bg-app-bg border-app-border text-app-text"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          onClick={handleSave}
          disabled={isLoading || !frontContent.trim() || !backContent.trim()}
          className="flex-1 bg-app-accent text-white hover:bg-app-accent/90"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : card ? 'Atualizar' : 'Criar'}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 text-app-text border-app-border hover:bg-app-muted"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
};

interface StudySessionProps {
  lessonId: string;
  currentSession: any;
  getCurrentCard: () => Flashcard | null;
  getSessionProgress: () => { current: number; total: number; percentage: number };
  showAnswer: boolean;
  setShowAnswer: (show: boolean) => void;
  reviewCard: (cardId: string, quality: number) => Promise<void>;
  endSession: () => void;
  isReviewing: boolean;
}

const StudySession = ({
  currentSession,
  getCurrentCard,
  getSessionProgress,
  showAnswer,
  setShowAnswer,
  reviewCard,
  endSession,
  isReviewing
}: StudySessionProps) => {
  const currentCard = getCurrentCard();
  const progress = getSessionProgress();
  
  if (!currentCard) {
    return (
      <div className="text-center py-8">
        <div className="text-app-text-muted mb-4">Sessão finalizada!</div>
        <Button onClick={endSession} className="bg-app-accent text-white hover:bg-app-accent/90">
          Encerrar sessão
        </Button>
      </div>
    );
  }

  const handleReview = async (quality: number) => {
    await reviewCard(currentCard.id, quality);
  };

  const qualityButtons = [
    { quality: 0, label: 'Muito difícil', color: 'bg-red-600 hover:bg-red-700', icon: '😰' },
    { quality: 1, label: 'Difícil', color: 'bg-orange-600 hover:bg-orange-700', icon: '😕' },
    { quality: 2, label: 'Normal', color: 'bg-yellow-600 hover:bg-yellow-700', icon: '😐' },
    { quality: 3, label: 'Fácil', color: 'bg-blue-600 hover:bg-blue-700', icon: '😊' },
    { quality: 4, label: 'Muito fácil', color: 'bg-green-600 hover:bg-green-700', icon: '😄' },
    { quality: 5, label: 'Perfeito', color: 'bg-purple-600 hover:bg-purple-700', icon: '🎯' },
  ];

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-app-text">Progresso da sessão</span>
          <span className="text-app-text-muted">
            {progress.current} de {progress.total}
          </span>
        </div>
        <Progress value={progress.percentage} className="h-2" />
      </div>

      {/* Session Stats */}
      <div className="flex items-center justify-center gap-6 text-center">
        <div className="space-y-1">
          <div className="text-2xl font-bold text-green-600">
            {currentSession.stats.correct}
          </div>
          <div className="text-xs text-app-text-muted">Acertos</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-app-text">
            {currentSession.stats.total}
          </div>
          <div className="text-xs text-app-text-muted">Total</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-app-accent">
            {currentSession.stats.total > 0 ? Math.round(currentSession.stats.accuracy) : 0}%
          </div>
          <div className="text-xs text-app-text-muted">Precisão</div>
        </div>
      </div>

      {/* Card */}
      <motion.div
        key={currentCard.id}
        initial={{ opacity: 0, rotateY: 0 }}
        animate={{ opacity: 1, rotateY: showAnswer ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        className="relative min-h-[300px]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div 
          className={cn(
            "absolute inset-0 backface-hidden border border-app-border rounded-xl p-6 bg-app-bg flex items-center justify-center",
            showAnswer && "opacity-0"
          )}
        >
          <div className="text-center space-y-4">
            <Brain className="w-12 h-12 text-app-accent mx-auto" />
            <div className="text-lg font-medium text-app-text leading-relaxed">
              {currentCard.front_content}
            </div>
            {currentCard.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center">
                {currentCard.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Back */}
        <div 
          className={cn(
            "absolute inset-0 backface-hidden border border-app-border rounded-xl p-6 bg-app-bg-soft flex items-center justify-center",
            !showAnswer && "opacity-0"
          )}
          style={{ transform: 'rotateY(180deg)' }}
        >
          <div className="text-center space-y-4">
            <Lightbulb className="w-12 h-12 text-yellow-500 mx-auto" />
            <div className="text-lg text-app-text leading-relaxed">
              {currentCard.back_content}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {!showAnswer ? (
          <Button
            onClick={() => setShowAnswer(true)}
            size="lg"
            className="bg-app-accent text-white hover:bg-app-accent/90 min-w-[200px]"
          >
            <Eye className="w-5 h-5 mr-2" />
            Mostrar resposta
          </Button>
        ) : (
          <div className="space-y-4 w-full max-w-2xl">
            <div className="text-center text-sm text-app-text-muted mb-4">
              Como foi a dificuldade desta revisão?
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {qualityButtons.map((button) => (
                <Button
                  key={button.quality}
                  onClick={() => handleReview(button.quality)}
                  disabled={isReviewing}
                  className={`${button.color} text-white text-sm py-3`}
                >
                  <span className="mr-2">{button.icon}</span>
                  {button.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Session Actions */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={endSession}
          className="text-app-text border-app-border hover:bg-app-muted"
        >
          <X className="w-4 h-4 mr-2" />
          Encerrar sessão
        </Button>
      </div>
    </div>
  );
};

export const FlashcardsTab = ({ lessonId }: FlashcardsTabProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; front: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'due' | 'new' | 'mastered'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMigration, setShowMigration] = useState(true);

  const {
    allCards,
    dueCards,
    statistics,
    totalCards,
    dueCount,
    isLoading,
    createCard,
    updateCard,
    deleteCard,
    isCreating: isCreatingCard,
    isUpdating,
    isDeleting,
    currentSession,
    getCurrentCard,
    getSessionProgress,
    showAnswer,
    setShowAnswer,
    startSession,
    endSession,
    reviewCard,
    isReviewing,
  } = useFlashcards(lessonId);

  const handleCreateCard = (data: { front_content: string; back_content: string; tags: string[] }) => {
    createCard(data);
    setIsCreating(false);
  };

  const handleUpdateCard = (data: { front_content: string; back_content: string; tags: string[] }) => {
    if (editingCard) {
      updateCard({ cardId: editingCard.id, data });
      setEditingCard(null);
    }
  };

  const handleDeleteCard = (cardId: string, frontContent: string) => {
    setDeleteConfirm({ id: cardId, front: frontContent.substring(0, 50) });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteCard(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const filteredCards = allCards.filter(card => {
    const matchesFilter = filter === 'all' || card.status === filter;
    const matchesSearch = searchTerm === '' || 
      card.front_content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.back_content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  if (isLoading) {
    return <FlashcardSkeleton count={3} />;
  }

  // Study Session View
  if (currentSession) {
    return (
      <StudySession
        lessonId={lessonId}
        currentSession={currentSession}
        getCurrentCard={getCurrentCard}
        getSessionProgress={getSessionProgress}
        showAnswer={showAnswer}
        setShowAnswer={setShowAnswer}
        reviewCard={reviewCard}
        endSession={endSession}
        isReviewing={isReviewing}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Migration Component */}
      {showMigration && (
        <FlashcardMigration 
          lessonId={lessonId} 
          onComplete={() => setShowMigration(false)} 
        />
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-app-text">
            Flashcards da aula
          </h3>
          <p className="text-sm text-app-text-muted">
            Sistema de repetição espaçada para memorização eficiente
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-app-accent text-white hover:bg-app-accent/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo flashcard
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-app-bg border border-app-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-app-text mb-1">{totalCards}</div>
          <div className="text-xs text-app-text-muted">Total</div>
        </div>
        <div className="bg-app-bg border border-app-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-600 mb-1">{dueCount}</div>
          <div className="text-xs text-app-text-muted">Devidos</div>
        </div>
        <div className="bg-app-bg border border-app-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {statistics?.correct_reviews || 0}
          </div>
          <div className="text-xs text-app-text-muted">Acertos</div>
        </div>
        <div className="bg-app-bg border border-app-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-app-accent mb-1">
            {statistics?.avg_ease_factor ? statistics.avg_ease_factor.toFixed(1) : '2.5'}
          </div>
          <div className="text-xs text-app-text-muted">Facilidade</div>
        </div>
      </div>

      {/* Study Action */}
      <div className="bg-gradient-to-r from-app-accent/10 to-app-accent/5 border border-app-accent/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-app-text flex items-center gap-2">
              <Brain className="w-5 h-5 text-app-accent" />
              Sessão de estudos
            </h4>
            <p className="text-app-text-muted">
              {dueCount > 0 
                ? `Você tem ${dueCount} flashcard${dueCount > 1 ? 's' : ''} para revisar hoje`
                : 'Todos os flashcards estão em dia! 🎉'
              }
            </p>
          </div>
          <Button
            onClick={() => startSession()}
            disabled={dueCount === 0}
            size="lg"
            className="bg-app-accent text-white hover:bg-app-accent/90"
          >
            <Play className="w-5 h-5 mr-2" />
            {dueCount > 0 ? 'Iniciar sessão' : 'Nada para revisar'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-muted" />
          <Input
            placeholder="Buscar flashcards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-app-bg border-app-border text-app-text"
          />
        </div>
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-48 bg-app-bg border-app-border text-app-text">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-app-bg border-app-border">
            <SelectItem value="all">Todos os cards</SelectItem>
            <SelectItem value="due">Devidos</SelectItem>
            <SelectItem value="new">Novos</SelectItem>
            <SelectItem value="mastered">Dominados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Flashcards List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredCards.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 text-app-text-muted"
            >
              {totalCards === 0 
                ? 'Nenhum flashcard criado ainda'
                : 'Nenhum flashcard encontrado com os filtros aplicados'
              }
            </motion.div>
          ) : (
            filteredCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="border border-app-border rounded-xl p-4 bg-app-bg hover:bg-app-bg-soft transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-app-text">
                        {card.front_content}
                      </div>
                      <div className="text-sm text-app-text-muted">
                        {card.back_content}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-app-text-muted">
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {card.status === 'due' ? 'Devido' : 
                         card.status === 'new' ? 'Novo' :
                         card.status === 'mastered' ? 'Dominado' : 'Em aprendizado'}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {card.correct_reviews}/{card.total_reviews} acertos
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Facilidade: {card.ease_factor.toFixed(1)}
                      </div>
                    </div>

                    {card.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {card.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCard(card)}
                      className="text-app-text-muted hover:text-app-text hover:bg-app-muted"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCard(card.id, card.front_content)}
                      className="text-app-text-muted hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || !!editingCard} onOpenChange={() => {
        setIsCreating(false);
        setEditingCard(null);
      }}>
        <DialogContent className="bg-app-bg border-app-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-app-text">
              {editingCard ? 'Editar flashcard' : 'Novo flashcard'}
            </DialogTitle>
          </DialogHeader>
          <FlashcardForm
            card={editingCard || undefined}
            onSave={editingCard ? handleUpdateCard : handleCreateCard}
            onCancel={() => {
              setIsCreating(false);
              setEditingCard(null);
            }}
            isLoading={isCreatingCard || isUpdating}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-app-bg border-app-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-app-text">
              Remover flashcard
            </AlertDialogTitle>
            <AlertDialogDescription className="text-app-text-muted">
              Tem certeza que deseja remover este flashcard? 
              Todo o progresso de estudo será perdido. Esta ação não pode ser desfeita.
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