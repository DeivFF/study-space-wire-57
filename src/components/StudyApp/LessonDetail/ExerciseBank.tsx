import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, Play, ArrowLeft, ArrowRight, CheckCircle, XCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useExercises } from '@/hooks/useExercises';
import { Exercise } from '@/services/studyApi';
import { toast } from '@/components/ui/enhanced-toast';

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
  const { exercises, isLoading, createExercise, attemptExercise } = useExercises(lessonId);
  const [playModal, setPlayModal] = useState<PlayModalState>({
    isOpen: false,
    currentIndex: 0,
    showAnswer: false,
    userAnswers: {},
    startTime: Date.now()
  });

  const [newExerciseModal, setNewExerciseModal] = useState(false);
  const [newExercise, setNewExercise] = useState({
    title: '',
    question_text: '',
    question_type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'essay',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    difficulty: 'medio' as 'facil' | 'medio' | 'dificil',
    tags: [] as string[]
  });

  const handleCreateExercise = async () => {
    if (!newExercise.title || !newExercise.question_text) {
      toast.error('Preencha título e pergunta');
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
        title: newExercise.title,
        question_text: newExercise.question_text,
        question_type: newExercise.question_type,
        options: processedOptions,
        correct_answer: correctAnswer,
        explanation: newExercise.explanation || undefined,
        difficulty: newExercise.difficulty,
        tags: newExercise.tags,
        points: 10
      });
      
      setNewExerciseModal(false);
      setNewExercise({
        title: '',
        question_text: '',
        question_type: 'mcq',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
        difficulty: 'medio',
        tags: []
      });
    } catch (error) {
      console.error('Error creating exercise:', error);
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
      if (currentExercise.question_type === 'mcq' || currentExercise.question_type === 'truefalse') {
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
      case 'truefalse':
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
      default: // mcq
        return (
          <div>
            <label className="text-sm font-medium text-app-text mb-2 block">Alternativas (marque a correta)</label>
            <div className="space-y-2">
              {newExercise.options.map((option, index) => (
                <label key={index} className="flex gap-2 items-start cursor-pointer">
                  <input
                    type="radio"
                    name="mcq"
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
          <DialogContent className="max-w-2xl bg-card border-app-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Novo exercício
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-app-text">Tipo</label>
                <select
                  value={newExercise.question_type}
                  onChange={(e) => {
                    const type = e.target.value as 'mcq' | 'truefalse' | 'essay';
                    setNewExercise(prev => ({ 
                      ...prev, 
                      question_type: type,
                      correct_answer: '',
                      options: type === 'mcq' ? ['', '', '', ''] : []
                    }));
                  }}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text"
                >
                  <option value="mcq">Múltipla escolha</option>
                  <option value="truefalse">Verdadeiro/Falso</option>
                  <option value="essay">Dissertativa</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-app-text">Enunciado</label>
                <textarea
                  value={newExercise.question_text}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, question_text: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text min-h-[120px]"
                  placeholder="Digite o enunciado"
                />
              </div>

              {renderFormByType()}

              <div>
                <label className="text-sm font-medium text-app-text">Explicação (opcional)</label>
                <textarea
                  value={newExercise.explanation}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, explanation: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text min-h-[100px]"
                  placeholder="Comentário / fundamentação"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNewExerciseModal(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleCreateExercise} className="btn-cta">
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Exercise List */}
      <div className="border border-app-border rounded-xl overflow-hidden divide-y divide-app-border">
        {exercises.length === 0 ? (
          <div className="p-8 text-center text-app-text-muted">
            Nenhum exercício criado ainda
          </div>
        ) : (
          exercises.map((exercise, index) => (
            <div key={exercise.id} className="flex items-center gap-3 p-3 hover:bg-app-muted transition-colors">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-app-text truncate">{exercise.question_text}</div>
              </div>
              <Button
                onClick={() => openPlayModal(index)}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Play Modal */}
      <Dialog open={playModal.isOpen} onOpenChange={(open) => !open && closePlayModal()}>
        <DialogContent className="max-w-2xl bg-card border-app-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Exercício
            </DialogTitle>
          </DialogHeader>
          
          {currentExercise && (
            <div className="space-y-4">
              <div className="text-sm font-medium text-app-text">
                {currentExercise.question_text}
              </div>

              {(currentExercise.question_type === 'mcq' || currentExercise.question_type === 'truefalse') && currentExercise.options && (
                <div className="space-y-2">
                  {currentExercise.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      className={`exercise-option w-full text-left px-3 py-2 rounded-lg border border-app-border hover:bg-app-muted transition-colors ${
                        userAnswer === index ? 'bg-app-muted' : ''
                      }`}
                    >
                      <span className="font-semibold mr-2">
                        {currentExercise.question_type === 'truefalse' 
                          ? (index === 0 ? 'V.' : 'F.')
                          : String.fromCharCode(65 + index) + '.'
                        }
                      </span>
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {currentExercise.question_type === 'essay' && (
                <div>
                  <textarea
                    value={typeof userAnswer === 'string' ? userAnswer : ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                    className="w-full min-h-[120px] p-3 rounded-lg bg-app-bg border border-app-border text-app-text"
                    placeholder="Digite sua resposta..."
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button
                  onClick={showAnswer}
                  variant="outline"
                  disabled={playModal.showAnswer}
                >
                  Mostrar gabarito
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={prevExercise}
                    variant="outline"
                    disabled={playModal.currentIndex === 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    onClick={nextExercise}
                    className="btn-cta"
                    disabled={playModal.currentIndex === exercises.length - 1}
                  >
                    Próxima
                  </Button>
                </div>
              </div>

              {playModal.showAnswer && currentExercise.explanation && (
                <div className="rounded-lg border border-app-border p-3 bg-app-bg">
                  <div className="font-semibold text-app-text mb-1">Explicação</div>
                  <div className="text-sm text-app-text-muted">{currentExercise.explanation}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};