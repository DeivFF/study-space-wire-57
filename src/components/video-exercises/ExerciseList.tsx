
import { Play, CheckCircle, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Exercise {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  completed: boolean;
  createdAt: string;
}

interface ExerciseListProps {
  exercises: Exercise[];
  onSelectExercise: (exercise: Exercise) => void;
}

const ExerciseList = ({ exercises, onSelectExercise }: ExerciseListProps) => {
  if (exercises.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum exercício adicionado</p>
        <p className="text-sm">Adicione exercícios para treinar o conteúdo deste vídeo</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {exercises.map((exercise, index) => (
        <Card key={exercise.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium mb-2">
                  Exercício {index + 1}
                  {exercise.completed && (
                    <CheckCircle className="w-4 h-4 inline ml-2 text-green-600" />
                  )}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {exercise.question}
                </p>
              </div>
              <Button
                onClick={() => onSelectExercise(exercise)}
                size="sm"
                variant={exercise.completed ? "outline" : "default"}
              >
                <Play className="w-4 h-4 mr-1" />
                {exercise.completed ? "Revisar" : "Resolver"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ExerciseList;
