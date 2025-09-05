import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, Play, ArrowLeft, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
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
}

export const ExerciseBank = ({ lessonId }: ExerciseBankProps) => {
  const { exercises, isLoading, createExercise, attemptExercise } = useExercises(lessonId);
  const [playModal, setPlayModal] = useState<PlayModalState>({
    isOpen: false,
    currentIndex: 0,
    showAnswer: false,
    userAnswers: {}
  });

  const [newExerciseModal, setNewExerciseModal] = useState(false);
  const [newExercise, setNewExercise] = useState({
    title: '',
    question_text: '',
    question_type: 'multiple_choice' as 'multiple_choice' | 'essay',
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
      await createExercise({
        title: newExercise.title,
        question_text: newExercise.question_text,
        question_type: newExercise.question_type,
        options: newExercise.question_type === 'multiple_choice' ? newExercise.options.filter(o => o.trim()) : undefined,
        correct_answer: newExercise.correct_answer,
        explanation: newExercise.explanation || undefined,
        difficulty: newExercise.difficulty,
        tags: newExercise.tags,
        points: 10
      });
      
      setNewExerciseModal(false);
      setNewExercise({
        title: '',
        question_text: '',
        question_type: 'multiple_choice',
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
      userAnswers: {}
    });
  };

  const closePlayModal = () => {
    setPlayModal({
      isOpen: false,
      currentIndex: 0,
      showAnswer: false,
      userAnswers: {}
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

  const showAnswer = () => {
    setPlayModal(prev => ({ ...prev, showAnswer: true }));
  };

  const nextExercise = () => {
    if (playModal.currentIndex < exercises.length - 1) {
      setPlayModal(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        showAnswer: false
      }));
    }
  };

  const prevExercise = () => {
    if (playModal.currentIndex > 0) {
      setPlayModal(prev => ({
        ...prev,
        currentIndex: prev.currentIndex - 1,
        showAnswer: false
      }));
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
                <label className="text-sm font-medium text-app-text">Título</label>
                <input
                  value={newExercise.title}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text"
                  placeholder="Ex: Princípios do Direito Constitucional"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-app-text">Pergunta</label>
                <textarea
                  value={newExercise.question_text}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, question_text: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text h-24"
                  placeholder="Digite a pergunta do exercício..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-app-text">Tipo</label>
                  <select
                    value={newExercise.question_type}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, question_type: e.target.value as 'multiple_choice' | 'essay' }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text"
                  >
                    <option value="multiple_choice">Múltipla escolha</option>
                    <option value="essay">Dissertativo</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-app-text">Dificuldade</label>
                  <select
                    value={newExercise.difficulty}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, difficulty: e.target.value as 'facil' | 'medio' | 'dificil' }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text"
                  >
                    <option value="facil">Fácil</option>
                    <option value="medio">Médio</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>
              </div>

              {newExercise.question_type === 'multiple_choice' && (
                <div>
                  <label className="text-sm font-medium text-app-text">Alternativas</label>
                  <div className="space-y-2 mt-1">
                    {newExercise.options.map((option, index) => (
                      <input
                        key={index}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newExercise.options];
                          newOptions[index] = e.target.value;
                          setNewExercise(prev => ({ ...prev, options: newOptions }));
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text"
                        placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-app-text">
                  {newExercise.question_type === 'multiple_choice' ? 'Resposta correta' : 'Pontos-chave esperados'}
                </label>
                <input
                  value={newExercise.correct_answer}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, correct_answer: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text"
                  placeholder={newExercise.question_type === 'multiple_choice' ? 'Ex: A' : 'Pontos importantes da resposta'}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-app-text">Explicação (opcional)</label>
                <textarea
                  value={newExercise.explanation}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, explanation: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text h-20"
                  placeholder="Explicação da resposta..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNewExerciseModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateExercise} className="btn-cta">
                  Criar exercício
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
            <div key={exercise.id} className="p-4 hover:bg-app-bg-soft transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-app-text">{exercise.title}</h4>
                  <p className="text-sm text-app-text-muted mt-1">{exercise.question_text.slice(0, 100)}...</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {exercise.question_type === 'multiple_choice' ? 'Múltipla escolha' : 'Dissertativo'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {exercise.difficulty}
                    </Badge>
                    {exercise.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => openPlayModal(index)}
                  variant="outline"
                  size="sm"
                  className="ml-4"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver
                </Button>
              </div>
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

              {currentExercise.question_type === 'multiple_choice' && currentExercise.options && (
                <div className="space-y-2">
                  {currentExercise.options.map((option, index) => (
                    <label
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border border-app-border hover:bg-app-bg cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="exercise-option"
                        value={index}
                        checked={userAnswer === index}
                        onChange={() => handleAnswer(index)}
                        className="text-app-accent"
                      />
                      <span className="text-sm text-app-text">
                        {String.fromCharCode(65 + index)}) {option}
                      </span>
                    </label>
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
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Anterior
                  </Button>
                  <Button
                    onClick={nextExercise}
                    className="btn-cta"
                    disabled={playModal.currentIndex === exercises.length - 1}
                  >
                    Próxima
                    <ArrowRight className="w-4 h-4 ml-2" />
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