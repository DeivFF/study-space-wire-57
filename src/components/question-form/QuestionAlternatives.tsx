
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface QuestionAlternativesProps {
  alternativas: string[];
  respostaCorreta: string;
  onAlternativaChange: (index: number, value: string) => void;
  onRespostaCorretaChange: (value: string) => void;
  onAddAlternativa: () => void;
  onRemoveAlternativa: (index: number) => void;
  disabled?: boolean;
}

const QuestionAlternatives = ({
  alternativas,
  respostaCorreta,
  onAlternativaChange,
  onRespostaCorretaChange,
  onAddAlternativa,
  onRemoveAlternativa,
  disabled = false
}: QuestionAlternativesProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Alternativas</Label>
        <Button
          onClick={onAddAlternativa}
          size="sm"
          variant="outline"
          disabled={disabled || alternativas.length >= 6}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </div>
      
      <RadioGroup value={respostaCorreta} onValueChange={onRespostaCorretaChange}>
        {alternativas.map((alternativa, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
            <RadioGroupItem value={index.toString()} id={`alternativa-${index}`} />
            <div className="flex-1">
              <Input
                placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                value={alternativa}
                onChange={(e) => onAlternativaChange(index, e.target.value)}
                disabled={disabled}
              />
            </div>
            {alternativas.length > 2 && (
              <Button
                onClick={() => onRemoveAlternativa(index)}
                size="sm"
                variant="outline"
                disabled={disabled}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </RadioGroup>
      <p className="text-xs text-gray-500">
        Selecione a alternativa correta marcando o círculo ao lado
      </p>
    </div>
  );
};

export default QuestionAlternatives;
