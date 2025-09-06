import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Brain, Play } from 'lucide-react';

interface SessionConfigDialogProps {
  type: 'flashcards' | 'exercises';
  totalItems: number;
  onStart: (limit: number) => void;
  onCancel: () => void;
}

export const SessionConfigDialog: React.FC<SessionConfigDialogProps> = ({
  type,
  totalItems,
  onStart,
  onCancel,
}) => {
  const [limit, setLimit] = useState([Math.min(10, totalItems)]);

  const handleStart = () => {
    onStart(limit[0]);
  };

  if (totalItems === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {type === 'flashcards' ? (
                <Brain className="w-12 h-12 text-muted-foreground" />
              ) : (
                <BookOpen className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <CardTitle>Nenhum {type === 'flashcards' ? 'flashcard' : 'exercício'} disponível</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Esta aula não possui {type === 'flashcards' ? 'flashcards' : 'exercícios'} para praticar.
            </p>
            <Button onClick={onCancel} variant="outline">
              Fechar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {type === 'flashcards' ? (
              <Brain className="w-12 h-12 text-primary" />
            ) : (
              <BookOpen className="w-12 h-12 text-primary" />
            )}
          </div>
          <CardTitle>
            Configurar Sessão de {type === 'flashcards' ? 'Flashcards' : 'Exercícios'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Available Items */}
          <div className="text-center">
            <Badge variant="secondary" className="text-base px-3 py-1">
              {totalItems} {type === 'flashcards' ? 'flashcards' : 'exercícios'} disponíveis
            </Badge>
          </div>

          {/* Limit Selector */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">
                Quantidade para praticar
              </label>
              <span className="text-lg font-semibold text-primary">
                {limit[0]}
              </span>
            </div>
            
            <Slider
              value={limit}
              onValueChange={setLimit}
              max={totalItems}
              min={1}
              step={1}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>{totalItems}</span>
            </div>
          </div>

          {/* Quick Options */}
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 20].filter(val => val <= totalItems).map((value) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => setLimit([value])}
                className={limit[0] === value ? 'ring-2 ring-primary' : ''}
              >
                {value}
              </Button>
            ))}
            {totalItems > 20 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLimit([totalItems])}
                className={limit[0] === totalItems ? 'ring-2 ring-primary' : ''}
              >
                Todos
              </Button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={onCancel} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleStart} className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              Iniciar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};