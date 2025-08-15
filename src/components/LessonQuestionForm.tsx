
import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSupabaseLessonQuestions } from '@/hooks/useSupabaseLessonQuestions';

interface LessonQuestionFormProps {
  lessonId: string;
  lessonTitle: string;
  onBack: () => void;
  onQuestionCreated: () => void;
}

const LessonQuestionForm = ({ lessonId, lessonTitle, onBack, onQuestionCreated }: LessonQuestionFormProps) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('0');
  const [explanation, setExplanation] = useState('');
  const [saving, setSaving] = useState(false);

  const { criarQuestao } = useSupabaseLessonQuestions();

  const updateOption = (index: number, value: string) => {
    setOptions(prev => prev.map((opt, i) => i === index ? value : opt));
  };

  const addOption = () => {
    setOptions(prev => [...prev, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(prev => prev.filter((_, i) => i !== index));
      // Ajustar resposta correta se necessário
      const currentCorrect = parseInt(correctAnswer);
      if (currentCorrect === index) {
        setCorrectAnswer('0');
      } else if (currentCorrect > index) {
        setCorrectAnswer((currentCorrect - 1).toString());
      }
    }
  };

  const handleSave = async () => {
    if (!question.trim()) {
      alert('Digite a pergunta');
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      alert('Adicione pelo menos 2 alternativas');
      return;
    }

    const correctIndex = parseInt(correctAnswer);
    if (correctIndex >= validOptions.length) {
      alert('Selecione uma alternativa correta válida');
      return;
    }

    setSaving(true);
    
    try {
      await criarQuestao(
        lessonId,
        question.trim(),
        validOptions,
        correctIndex,
        explanation.trim() || undefined
      );
      
      onQuestionCreated();
    } catch (error) {
      console.error('Erro ao salvar questão:', error);
      alert('Erro ao salvar questão');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Questão</h1>
          <p className="text-gray-600">{lessonTitle}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criar Questão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="question">Pergunta</Label>
            <Textarea
              id="question"
              placeholder="Digite sua pergunta aqui..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Alternativas</Label>
              <Button
                onClick={addOption}
                size="sm"
                variant="outline"
                disabled={saving || options.length >= 6}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
            
            <RadioGroup value={correctAnswer} onValueChange={setCorrectAnswer}>
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <div className="flex-1">
                    <Input
                      placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  {options.length > 2 && (
                    <Button
                      onClick={() => removeOption(index)}
                      size="sm"
                      variant="outline"
                      disabled={saving}
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

          <div className="space-y-2">
            <Label htmlFor="explanation">Explicação (opcional)</Label>
            <Textarea
              id="explanation"
              placeholder="Explique por que esta é a resposta correta..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button onClick={onBack} variant="outline" disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Questão
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LessonQuestionForm;
