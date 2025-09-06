import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, Play, ArrowLeft, ArrowRight, CheckCircle, XCircle, X, Trash2, PencilRuler, MoreVertical, Star, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useExercises } from '@/hooks/useExercises';
import { Exercise } from '@/services/studyApi';
import { toast } from '@/components/ui/enhanced-toast';
import { cn } from '@/lib/utils';

interface ExerciseBankProps {
  lessonId: string;
}

interface PlayModalState {
  isOpen: boolean;
  currentIndex: number;
  showAnswer: boolean;
  userAnswers: Record<string, string | number>;
  startTime: number;
}

export const ExerciseBank = ({ lessonId }: ExerciseBankProps) => {
  const { exercises, isLoading, createExercise, deleteExercise, attemptExercise, isDeleting } = useExercises(lessonId);
  const [playModal, setPlayModal] = useState<PlayModalState>({
    isOpen: false,
    currentIndex: 0,
    showAnswer: false,
    userAnswers: {},
    startTime: Date.now()
  });

  const [newExerciseModal, setNewExerciseModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [favoriteExercises, setFavoriteExercises] = useState<Set<string>>(new Set());
  const [newExercise, setNewExercise] = useState({
    question_text: '',
    question_type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'essay',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    difficulty: 'medio' as 'facil' | 'medio' | 'dificil',
    tags: [] as string[],
  });

  const handleCreateExercise = async () => {
    if (!newExercise.question_text) {
      toast.error('Preencha o enunciado da questão');
      return;
    }

    try {
      let processedOptions = undefined;
      let correctAnswer = newExercise.correct_answer;

      if (newExercise.question_type === 'multiple_choice') {
        processedOptions = newExercise.options.filter(o => o.trim());
        if (processedOptions.length < 2) {
          toast.error('Informe pelo menos duas alternativas');
          return;
        }
      } else if (newExercise.question_type === 'true_false') {
        processedOptions = ['Verdadeiro', 'Falso'];
        // Convert to 0/1 format
        correctAnswer = correctAnswer === 'Verdadeiro' || correctAnswer === '0' ? '0' : '1';
      }

      await createExercise({
        lesson_id: lessonId,
        title: newExercise.question_text.substring(0, 50) + '...',
        question_text: newExercise.question_text,
        question_type: newExercise.question_type,
        options: processedOptions,
        correct_answer: correctAnswer,
        explanation: newExercise.explanation || undefined,
        difficulty: newExercise.difficulty,
        tags: newExercise.tags,
      });
      
      setNewExerciseModal(false);
      setWizardStep(1);
      setNewExercise({
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
        difficulty: 'medio',
        tags: [],
          });
    } catch (error) {
      console.error('Error creating exercise:', error);
    }
  };

  const handleDeleteExercise = async (exerciseId: string, exerciseTitle: string) => {
    try {
      await deleteExercise(exerciseId);
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };

  const handleToggleFavorite = (exerciseId: string) => {
    setFavoriteExercises(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(exerciseId)) {
        newFavorites.delete(exerciseId);
        toast.success('Exercício removido dos favoritos');
      } else {
        newFavorites.add(exerciseId);
        toast.success('Exercício adicionado aos favoritos');
      }
      return newFavorites;
    });
  };

  const nextWizardStep = () => {
    if (wizardStep < 3) {
      setWizardStep(wizardStep + 1);
    }
  };

  const prevWizardStep = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
    }
  };

  const canProceedToNext = () => {
    switch (wizardStep) {
      case 1:
        return newExercise.question_text.trim() !== '';
      case 2:
        if (newExercise.question_type === 'multiple_choice') {
          return newExercise.options.some(opt => opt.trim() !== '') && newExercise.correct_answer !== '';
        }
        if (newExercise.question_type === 'true_false') {
          return newExercise.correct_answer !== '';
        }
        return true; // essay doesn't need validation at step 2
      case 3:
        return true;
      default:
        return false;
    }
  };

  const openPlayModal = (startIndex: number = 0) => {
    setPlayModal({
      isOpen: true,
      currentIndex: startIndex,
      showAnswer: false,
      userAnswers: {},
      startTime: Date.now()
    });
  };

  const closePlayModal = () => {
    setPlayModal({
      isOpen: false,
      currentIndex: 0,
      showAnswer: false,
      userAnswers: {},
      startTime: Date.now()
    });
  };

  const currentExercise = exercises[playModal.currentIndex];

  const handleAnswer = (answer: string | number) => {
    setPlayModal(prev => ({
      ...prev,
      userAnswers: {
        ...prev.userAnswers,
        [currentExercise.id]: answer
      }
    }));
  };

  const showAnswer = async () => {
    if (!currentExercise) return;
    
    const userAnswer = playModal.userAnswers[currentExercise.id];
    if (userAnswer === undefined || userAnswer === '') {
      toast.error('Selecione uma resposta primeiro');
      return;
    }

    // Calculate time spent
    const timeSpent = Math.round((Date.now() - playModal.startTime) / 1000);

    try {
      // Submit answer to backend
      await attemptExercise({
        exerciseId: currentExercise.id,
        userAnswer: String(userAnswer),
        timeSpent
      });

      setPlayModal(prev => ({ ...prev, showAnswer: true }));
      
      // Visual feedback for MCQ/TrueFalse
      if (currentExercise.question_type === 'multiple_choice' || currentExercise.question_type === 'true_false' || currentExercise.question_type === 'truefalse') {
        const correctIndex = parseInt(currentExercise.correct_answer || '0');
        const userIndex = parseInt(String(userAnswer));
        
        setTimeout(() => {
          const options = document.querySelectorAll('.exercise-option');
          options.forEach((option, index) => {
            if (index === correctIndex) {
              option.classList.add('border-green-500', 'bg-green-50');
            }
            if (index === userIndex && userIndex !== correctIndex) {
              option.classList.add('border-red-500', 'bg-red-50');
            }
          });
        }, 100);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const nextExercise = () => {
    if (playModal.currentIndex < exercises.length - 1) {
      setPlayModal(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        showAnswer: false,
        startTime: Date.now()
      }));
    }
  };

  const prevExercise = () => {
    if (playModal.currentIndex > 0) {
      setPlayModal(prev => ({
        ...prev,
        currentIndex: prev.currentIndex - 1,
        showAnswer: false,
        startTime: Date.now()
      }));
    }
  };

  const renderFormByType = () => {
    switch (newExercise.question_type) {
      case 'essay':
        return null;
      case 'true_false':
        return (
          <div>
            <label className="text-sm font-medium text-app-text mb-2 block">Gabarito</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tf"
                  value="0"
                  checked={newExercise.correct_answer === '0'}
                  onChange={() => setNewExercise(prev => ({ ...prev, correct_answer: '0' }))}
                  className="accent-app-accent"
                />
                Verdadeiro
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tf"
                  value="1"
                  checked={newExercise.correct_answer === '1'}
                  onChange={() => setNewExercise(prev => ({ ...prev, correct_answer: '1' }))}
                  className="accent-app-accent"
                />
                Falso
              </label>
            </div>
          </div>
        );
      default: // multiple_choice
        return (
          <div>
            <label className="text-sm font-medium text-app-text mb-2 block">Alternativas (marque a correta)</label>
            <div className="space-y-2">
              {newExercise.options.map((option, index) => (
                <label key={index} className="flex gap-2 items-start cursor-pointer">
                  <input
                    type="radio"
                    name="multiple_choice"
                    value={index}
                    checked={newExercise.correct_answer === String(index)}
                    onChange={() => setNewExercise(prev => ({ ...prev, correct_answer: String(index) }))}
                    className="mt-1 accent-app-accent"
                  />
                  <input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...newExercise.options];
                      newOptions[index] = e.target.value;
                      setNewExercise(prev => ({ ...prev, options: newOptions }));
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text"
                    placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                  />
                </label>
              ))}
            </div>
          </div>
        );
    }
  };

  const userAnswer = playModal.userAnswers[currentExercise?.id];

  if (isLoading) {
    return <div className="text-center py-8 text-app-text-muted">Carregando exercícios...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-app-text">Banco de exercícios</h3>
        <Dialog open={newExerciseModal} onOpenChange={setNewExerciseModal}>
          <DialogTrigger asChild>
            <Button className="btn-cta">
              <Plus className="w-4 h-4 mr-2" />
              Novo exercício
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl bg-card border-app-border">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Novo exercício - Etapa {wizardStep} de 3
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNewExerciseModal(false);
                    setWizardStep(1);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-app-text-muted">Progresso</span>
                  <span className="text-app-text-muted">{Math.round((wizardStep / 3) * 100)}%</span>
                </div>
                <div className="w-full bg-app-muted rounded-full h-2">
                  <div 
                    className="bg-app-accent h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(wizardStep / 3) * 100}%` }}
                  />
                </div>
              </div>

              {/* Step 1: Basic Info */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-app-text mb-2">Informações básicas</h3>
                    <p className="text-app-text-muted">Configure o tipo e enunciado da questão</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-app-text mb-2 block">Tipo de questão</label>
                    <select
                      value={newExercise.question_type}
                      onChange={(e) => {
                        const type = e.target.value as 'multiple_choice' | 'true_false' | 'essay';
                        setNewExercise(prev => ({ 
                          ...prev, 
                          question_type: type,
                          correct_answer: '',
                          options: type === 'multiple_choice' ? ['', '', '', ''] : type === 'true_false' ? ['Verdadeiro', 'Falso'] : []
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text focus:border-app-accent focus:outline-none"
                    >
                      <option value="multiple_choice">Múltipla escolha</option>
                      <option value="true_false">Verdadeiro/Falso</option>
                      <option value="essay">Dissertativo</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-app-text mb-2 block">Enunciado da questão</label>
                    <textarea
                      value={newExercise.question_text}
                      onChange={(e) => {
                        const textarea = e.target;
                        textarea.style.height = 'auto';
                        textarea.style.height = textarea.scrollHeight + 'px';
                        setNewExercise(prev => ({ ...prev, question_text: e.target.value }));
                      }}
                      onInput={(e) => {
                        const textarea = e.target as HTMLTextAreaElement;
                        textarea.style.height = 'auto';
                        textarea.style.height = textarea.scrollHeight + 'px';
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text focus:border-app-accent focus:outline-none resize-none overflow-hidden"
                      style={{ minHeight: '60px' }}
                      placeholder="Digite o enunciado da questão..."
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-app-text mb-2 block">Dificuldade</label>
                    <select
                      value={newExercise.difficulty}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, difficulty: e.target.value as 'facil' | 'medio' | 'dificil' }))}
                      className="w-full px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text focus:border-app-accent focus:outline-none"
                    >
                      <option value="facil">Fácil</option>
                      <option value="medio">Médio</option>
                      <option value="dificil">Difícil</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Question Content */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-app-text mb-2">Conteúdo da questão</h3>
                    <p className="text-app-text-muted">
                      {newExercise.question_type === 'multiple_choice' ? 'Configure as alternativas e marque a correta' :
                       newExercise.question_type === 'true_false' ? 'Selecione a resposta correta' :
                       'Questões dissertativas não precisam de gabarito específico'}
                    </p>
                  </div>

                  {newExercise.question_type === 'multiple_choice' && (
                    <div>
                      <label className="text-sm font-medium text-app-text mb-3 block">Alternativas (marque a correta)</label>
                      <div className="space-y-3">
                        {newExercise.options.map((option, index) => (
                          <label key={index} className="flex items-center gap-3 p-3 border border-app-border rounded-lg hover:bg-app-muted transition-colors">
                            <input
                              type="radio"
                              name="correct_answer"
                              value={index}
                              checked={newExercise.correct_answer === String(index)}
                              onChange={() => setNewExercise(prev => ({ ...prev, correct_answer: String(index) }))}
                              className="accent-app-accent"
                            />
                            <div className="w-6 h-6 rounded-full bg-app-accent text-white flex items-center justify-center text-sm font-semibold">
                              {String.fromCharCode(65 + index)}
                            </div>
                            <input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...newExercise.options];
                                newOptions[index] = e.target.value;
                                setNewExercise(prev => ({ ...prev, options: newOptions }));
                              }}
                              className="flex-1 px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text focus:border-app-accent focus:outline-none"
                              placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {newExercise.question_type === 'true_false' && (
                    <div>
                      <label className="text-sm font-medium text-app-text mb-3 block">Resposta correta</label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 border border-app-border rounded-lg hover:bg-app-muted transition-colors">
                          <input
                            type="radio"
                            name="tf_answer"
                            value="0"
                            checked={newExercise.correct_answer === '0'}
                            onChange={() => setNewExercise(prev => ({ ...prev, correct_answer: '0' }))}
                            className="accent-app-accent"
                          />
                          <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-semibold">V</div>
                          <span className="text-app-text">Verdadeiro</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-app-border rounded-lg hover:bg-app-muted transition-colors">
                          <input
                            type="radio"
                            name="tf_answer"
                            value="1"
                            checked={newExercise.correct_answer === '1'}
                            onChange={() => setNewExercise(prev => ({ ...prev, correct_answer: '1' }))}
                            className="accent-app-accent"
                          />
                          <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-semibold">F</div>
                          <span className="text-app-text">Falso</span>
                        </label>
                      </div>
                    </div>
                  )}


                  {newExercise.question_type === 'essay' && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PencilRuler className="w-8 h-8 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-medium text-app-text mb-2">Questão dissertativa</h4>
                      <p className="text-app-text-muted">
                        As questões dissertativas não precisam de alternativas.<br/>
                        Avance para a próxima etapa para adicionar explicações.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Additional Info */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-app-text mb-2">Informações adicionais</h3>
                    <p className="text-app-text-muted">Configure tags e explicação</p>
                  </div>


                  <div>
                    <label className="text-sm font-medium text-app-text mb-2 block">
                      Tags (opcional) - máximo 20
                    </label>
                    <p className="text-xs text-app-text-muted mb-3">
                      Digite as tags separadas por vírgula. Máximo 50 caracteres por tag.
                    </p>
                    <input
                      type="text"
                      value={newExercise.tags.join(', ')}
                      onChange={(e) => {
                        const tagsString = e.target.value;
                        const tags = tagsString
                          .split(',')
                          .map(tag => tag.trim())
                          .filter(tag => tag.length > 0)
                          .slice(0, 20)
                          .map(tag => tag.slice(0, 50));
                        setNewExercise(prev => ({ ...prev, tags }));
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text focus:border-app-accent focus:outline-none"
                      placeholder="matemática, álgebra, equações..."
                    />
                    {newExercise.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {newExercise.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-app-accent/10 text-app-accent rounded-md text-xs border"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-app-text mb-2 block">Explicação (opcional)</label>
                    <textarea
                      value={newExercise.explanation}
                      onChange={(e) => {
                        const textarea = e.target;
                        textarea.style.height = 'auto';
                        textarea.style.height = textarea.scrollHeight + 'px';
                        setNewExercise(prev => ({ ...prev, explanation: e.target.value }));
                      }}
                      onInput={(e) => {
                        const textarea = e.target as HTMLTextAreaElement;
                        textarea.style.height = 'auto';
                        textarea.style.height = textarea.scrollHeight + 'px';
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text focus:border-app-accent focus:outline-none resize-none overflow-hidden"
                      style={{ minHeight: '60px' }}
                      placeholder="Comentário ou fundamentação da resposta..."
                    />
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-app-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevWizardStep}
                  disabled={wizardStep === 1}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-app-text-muted">
                    Etapa {wizardStep} de 3
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {wizardStep < 3 ? (
                    <Button
                      type="button"
                      onClick={nextWizardStep}
                      disabled={!canProceedToNext()}
                      className="bg-app-accent text-white hover:bg-app-accent/90 flex items-center gap-2"
                    >
                      Próximo
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleCreateExercise}
                      className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Criar exercício
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Exercise List */}
      <div>
        {exercises.length === 0 ? (
          <div className="p-8 text-center text-app-text-muted">
            Nenhum exercício criado ainda
          </div>
        ) : (
          <div>
            {/* Desktop view - Table format */}
            <div className="hidden lg:block">
              <div className="border border-app-border rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center px-3 py-2.5 text-xs text-app-text-secondary bg-app-muted border-b border-app-border">
                  <div className="flex-1 min-w-0">Exercício</div>
                  <div className="w-[120px] text-center">Tipo</div>
                  <div className="w-[100px] text-center">Dificuldade</div>
                  <div className="w-[100px] text-center">Atualizado</div>
                  <div className="w-[140px] text-center">Ações</div>
                </div>
                
                {exercises.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className="flex items-center px-3 py-3 hover:bg-app-bg-soft transition-colors border-b border-app-border last:border-b-0"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm text-app-text line-clamp-2 mb-1">
                        {exercise.question_text}
                      </p>
                      {exercise.tags && exercise.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {exercise.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {exercise.tags.length > 2 && (
                            <span className="text-xs text-app-text-muted">+{exercise.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="w-[120px] text-center text-sm text-app-text">
                      {exercise.question_type === 'multiple_choice' ? 'Múltipla escolha' :
                       exercise.question_type === 'essay' ? 'Dissertativo' :
                       exercise.question_type === 'true_false' ? 'Verdadeiro/Falso' :
                       exercise.question_type === 'truefalse' ? 'Verdadeiro/Falso' :
                       'Questão'}
                    </div>
                    <div className="w-[100px] text-center">
                      <Badge 
                        className={cn(
                          "text-xs",
                          exercise.difficulty === 'facil' ? 'bg-green-500/20 text-green-600 border-green-500/30' :
                          exercise.difficulty === 'medio' ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' :
                          'bg-red-500/20 text-red-600 border-red-500/30'
                        )}
                      >
                        {exercise.difficulty === 'facil' ? 'Fácil' :
                         exercise.difficulty === 'medio' ? 'Médio' : 'Difícil'}
                      </Badge>
                    </div>
                    <div className="w-[100px] text-center text-sm text-app-text-secondary">
                      {new Date().toLocaleDateString()}
                    </div>
                    <div className="w-[140px] flex justify-center gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-app-text border-app-border hover:bg-app-muted p-2"
                        onClick={() => openPlayModal(index)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-app-text border-app-border hover:bg-app-muted p-2"
                        onClick={() => {/* TODO: Edit exercise */}}
                      >
                        <Pencil className="w-4 h-4" />
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
                          <DropdownMenuItem onClick={() => handleToggleFavorite(exercise.id)}>
                            <Star className={`w-4 h-4 mr-2 ${favoriteExercises.has(exercise.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                            {favoriteExercises.has(exercise.id) ? 'Desfavoritar' : 'Favoritar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteExercise(exercise.id, exercise.question_text)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {isDeleting ? 'Excluindo...' : 'Excluir'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile view - Card format */}
            <div className="block lg:hidden space-y-3">
              {exercises.map((exercise, index) => (
                <div key={exercise.id} className="border border-app-border rounded-xl p-4 bg-app-bg hover:bg-app-bg-soft transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm text-app-text-muted line-clamp-3">
                              {exercise.question_text}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            className={cn(
                              "text-xs",
                              exercise.difficulty === 'facil' ? 'bg-green-500/20 text-green-600 border-green-500/30' :
                              exercise.difficulty === 'medio' ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' :
                              'bg-red-500/20 text-red-600 border-red-500/30'
                            )}
                          >
                            {exercise.difficulty === 'facil' ? 'Fácil' :
                             exercise.difficulty === 'medio' ? 'Médio' : 'Difícil'}
                          </Badge>
                          
                          <Badge variant="outline" className="text-xs">
                            {exercise.question_type === 'multiple_choice' ? 'Múltipla escolha' :
                             exercise.question_type === 'essay' ? 'Dissertativo' :
                             exercise.question_type === 'true_false' ? 'Verdadeiro/Falso' :
                             exercise.question_type === 'truefalse' ? 'Verdadeiro/Falso' :
                             'Questão'}
                          </Badge>

                          {exercise.tags && exercise.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPlayModal(index)}
                        className="text-app-text border-app-border hover:bg-app-muted p-2"
                      >
                        <Eye className="w-4 h-4" />
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
                          <DropdownMenuItem onClick={() => handleToggleFavorite(exercise.id)}>
                            <Star className={`w-4 h-4 mr-2 ${favoriteExercises.has(exercise.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                            {favoriteExercises.has(exercise.id) ? 'Desfavoritar' : 'Favoritar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {/* TODO: Edit exercise */}}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteExercise(exercise.id, exercise.question_text)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {isDeleting ? 'Excluindo...' : 'Excluir'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Play Modal - Wizard Format */}
      <Dialog open={playModal.isOpen} onOpenChange={(open) => !open && closePlayModal()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Exercício {playModal.currentIndex + 1} de {exercises.length}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closePlayModal}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {currentExercise && (
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="text-muted-foreground">
                    {Math.round(((playModal.currentIndex + 1) / exercises.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${((playModal.currentIndex + 1) / exercises.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question and Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Questão {playModal.currentIndex + 1}</h3>
                <p className="text-lg mb-4">{currentExercise.question_text}</p>
                
                {/* Options */}
                {(currentExercise.question_type === 'multiple_choice' || currentExercise.question_type === 'true_false' || currentExercise.question_type === 'truefalse') && currentExercise.options && (
                  <div className="space-y-3 mb-4">
                    {(Array.isArray(currentExercise.options) ? currentExercise.options : JSON.parse(currentExercise.options || '[]')).map((option, index) => {
                      const isSelected = userAnswer === index;
                      const isAnswered = playModal.showAnswer;
                      const isCorrect = index === parseInt(currentExercise.correct_answer || '0');
                      const isWrong = isAnswered && userAnswer === index && !isCorrect;
                      
                      return (
                        <label
                          key={index}
                          className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            isAnswered
                              ? isCorrect
                                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                : isWrong
                                ? 'border-red-500 bg-red-50 dark:bg-red-950'
                                : 'border-border bg-muted'
                              : isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                              : 'border-border hover:bg-muted'
                          }`}
                          onClick={() => handleAnswer(index)}
                        >
                          <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-semibold text-sm ${
                            isAnswered
                              ? isCorrect
                                ? 'border-green-500 bg-green-100 dark:bg-green-900'
                                : isWrong
                                ? 'border-red-500 bg-red-100 dark:bg-red-900'
                                : 'border-border bg-background'
                              : isSelected
                              ? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
                              : 'border-border bg-background'
                          }`}>
                            {(currentExercise.question_type === 'true_false' || currentExercise.question_type === 'truefalse') 
                              ? (index === 0 ? 'V' : 'F')
                              : String.fromCharCode(65 + index)
                            }
                          </div>
                          <span className="flex-1">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {currentExercise.question_type === 'essay' && (
                  <div className="mb-4">
                    <textarea
                      value={typeof userAnswer === 'string' ? userAnswer : ''}
                      onChange={(e) => handleAnswer(e.target.value)}
                      className="w-full min-h-[120px] p-4 rounded-lg border focus:border-primary focus:outline-none resize-none"
                      placeholder="Digite sua resposta aqui..."
                    />
                    <div className="text-sm text-muted-foreground mt-2">
                      {typeof userAnswer === 'string' ? userAnswer.length : 0} caracteres
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={prevExercise}
                    variant="outline"
                    disabled={playModal.currentIndex === 0}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  
                  {!playModal.showAnswer ? (
                    <Button
                      onClick={showAnswer}
                      variant="default"
                    >
                      Verificar resposta
                    </Button>
                  ) : (
                    playModal.currentIndex < exercises.length - 1 && (
                      <Button
                        onClick={nextExercise}
                        variant="default"
                        className="flex items-center gap-2"
                      >
                        Próxima questão
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )
                  )}
                </div>
                
                <Button
                  onClick={nextExercise}
                  variant="outline"
                  disabled={playModal.currentIndex === exercises.length - 1}
                  className="flex items-center gap-2"
                >
                  Próxima
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};