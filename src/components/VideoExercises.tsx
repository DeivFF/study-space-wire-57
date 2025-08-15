
import { useState, useEffect } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ExerciseModal from './ExerciseModal';
import ExerciseForm from './video-exercises/ExerciseForm';
import ExerciseList from './video-exercises/ExerciseList';

interface Exercise {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  completed: boolean;
  createdAt: string;
}

interface VideoExercisesProps {
  videoId: string;
  videoTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const VideoExercises = ({ videoId, videoTitle, isOpen, onClose }: VideoExercisesProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [newExercise, setNewExercise] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadExercises();
    }
  }, [isOpen, videoId]);

  const loadExercises = () => {
    const saved = localStorage.getItem(`video-exercises-${videoId}`);
    if (saved) {
      setExercises(JSON.parse(saved));
    }
  };

  const saveExercises = (updatedExercises: Exercise[]) => {
    localStorage.setItem(`video-exercises-${videoId}`, JSON.stringify(updatedExercises));
    setExercises(updatedExercises);
  };

  const addExercise = () => {
    if (!newExercise.question.trim() || newExercise.options.some(opt => !opt.trim())) {
      return;
    }

    const exercise: Exercise = {
      id: Date.now().toString(),
      question: newExercise.question.trim(),
      options: newExercise.options.map(opt => opt.trim()),
      correctAnswer: newExercise.correctAnswer,
      explanation: newExercise.explanation.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    const updated = [...exercises, exercise];
    saveExercises(updated);
    
    setNewExercise({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    });
    setIsAddingExercise(false);
  };

  const markAsCompleted = (exerciseId: string, correct: boolean) => {
    const updated = exercises.map(ex => 
      ex.id === exerciseId 
        ? { ...ex, completed: true }
        : ex
    );
    saveExercises(updated);
    setSelectedExercise(null);
  };

  const handleRandomQuestion = (categoryId?: string) => {
    const availableExercises = exercises.filter(ex => !ex.completed);
    if (availableExercises.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableExercises.length);
      setSelectedExercise(availableExercises[randomIndex]);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <span>Exercícios - {videoTitle}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {!isAddingExercise && (
              <Button onClick={() => setIsAddingExercise(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Novo Exercício
              </Button>
            )}

            {isAddingExercise && (
              <ExerciseForm
                newExercise={newExercise}
                setNewExercise={setNewExercise}
                onAddExercise={addExercise}
                onCancel={() => setIsAddingExercise(false)}
              />
            )}

            <ExerciseList
              exercises={exercises}
              onSelectExercise={setSelectedExercise}
            />
          </div>
        </DialogContent>
      </Dialog>

      {selectedExercise && (
        <ExerciseModal
          exercise={selectedExercise}
          isOpen={!!selectedExercise}
          onClose={() => setSelectedExercise(null)}
          onComplete={markAsCompleted}
          onNextRandom={handleRandomQuestion}
        />
      )}
    </>
  );
};

export default VideoExercises;
