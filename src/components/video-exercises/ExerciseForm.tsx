
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface NewExercise {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface ExerciseFormProps {
  newExercise: NewExercise;
  setNewExercise: (exercise: NewExercise) => void;
  onAddExercise: () => void;
  onCancel: () => void;
}

const ExerciseForm = ({ newExercise, setNewExercise, onAddExercise, onCancel }: ExerciseFormProps) => {
  const updateNewExerciseOption = (index: number, value: string) => {
    const newOptions = [...newExercise.options];
    newOptions[index] = value;
    setNewExercise({ ...newExercise, options: newOptions });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Novo Exercício</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Pergunta</label>
          <Textarea
            value={newExercise.question}
            onChange={(e) => setNewExercise({ ...newExercise, question: e.target.value })}
            placeholder="Digite a pergunta..."
            className="mt-1"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Alternativas</label>
          <div className="space-y-2 mt-1">
            {newExercise.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={newExercise.correctAnswer === index}
                  onChange={() => setNewExercise({ ...newExercise, correctAnswer: index })}
                  className="flex-shrink-0"
                />
                <Input
                  value={option}
                  onChange={(e) => updateNewExerciseOption(index, e.target.value)}
                  placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                />
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">Explicação (opcional)</label>
          <Textarea
            value={newExercise.explanation}
            onChange={(e) => setNewExercise({ ...newExercise, explanation: e.target.value })}
            placeholder="Explicação da resposta correta..."
            className="mt-1"
          />
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={onAddExercise}>
            Adicionar Exercício
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExerciseForm;
