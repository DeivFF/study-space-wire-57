
import { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseQuestoes } from '@/hooks/useSupabaseQuestoes';
import QuestionBasicInfo from './question-form/QuestionBasicInfo';
import QuestionAlternatives from './question-form/QuestionAlternatives';

interface StandaloneQuestionFormProps {
  onBack: () => void;
  onQuestionCreated: () => void;
}

const StandaloneQuestionForm = ({ onBack, onQuestionCreated }: StandaloneQuestionFormProps) => {
  const [enunciado, setEnunciado] = useState('');
  const [alternativas, setAlternativas] = useState(['', '', '', '']);
  const [respostaCorreta, setRespostaCorreta] = useState('0');
  const [explicacao, setExplicacao] = useState('');
  const [materia, setMateria] = useState('');
  const [assunto, setAssunto] = useState('');
  const [saving, setSaving] = useState(false);

  const { adicionarQuestao } = useSupabaseQuestoes();

  const updateAlternativa = (index: number, value: string) => {
    setAlternativas(prev => prev.map((alt, i) => i === index ? value : alt));
  };

  const addAlternativa = () => {
    setAlternativas(prev => [...prev, '']);
  };

  const removeAlternativa = (index: number) => {
    if (alternativas.length > 2) {
      setAlternativas(prev => prev.filter((_, i) => i !== index));
      const currentCorrect = parseInt(respostaCorreta);
      if (currentCorrect === index) {
        setRespostaCorreta('0');
      } else if (currentCorrect > index) {
        setRespostaCorreta((currentCorrect - 1).toString());
      }
    }
  };

  const handleSave = async () => {
    if (!enunciado.trim()) {
      alert('Digite o enunciado da questão');
      return;
    }

    if (!materia.trim()) {
      alert('Digite a matéria');
      return;
    }

    if (!assunto.trim()) {
      alert('Digite o assunto');
      return;
    }

    const validAlternativas = alternativas.filter(alt => alt.trim());
    if (validAlternativas.length < 2) {
      alert('Adicione pelo menos 2 alternativas');
      return;
    }

    const correctIndex = parseInt(respostaCorreta);
    if (correctIndex >= validAlternativas.length) {
      alert('Selecione uma alternativa correta válida');
      return;
    }

    setSaving(true);
    
    try {
      await adicionarQuestao({
        enunciado: enunciado.trim(),
        alternativas: validAlternativas,
        resposta_correta: correctIndex,
        explicacao: explicacao.trim() || '',
        materia: materia.trim(),
        assunto: assunto.trim(),
        banca: 'Não informado',
        ano: 2024,
        dificuldade: 'medio' as 'facil' | 'medio' | 'dificil'
      });
      
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
          <p className="text-gray-600">Criar questão de estudo</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criar Questão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <QuestionBasicInfo
            materia={materia}
            assunto={assunto}
            enunciado={enunciado}
            onMateriaChange={setMateria}
            onAssuntoChange={setAssunto}
            onEnunciadoChange={setEnunciado}
            disabled={saving}
          />

          <QuestionAlternatives
            alternativas={alternativas}
            respostaCorreta={respostaCorreta}
            onAlternativaChange={updateAlternativa}
            onRespostaCorretaChange={setRespostaCorreta}
            onAddAlternativa={addAlternativa}
            onRemoveAlternativa={removeAlternativa}
            disabled={saving}
          />

          <div className="space-y-2">
            <Label htmlFor="explicacao">Explicação (opcional)</Label>
            <Textarea
              id="explicacao"
              placeholder="Explique por que esta é a resposta correta..."
              value={explicacao}
              onChange={(e) => setExplicacao(e.target.value)}
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

export default StandaloneQuestionForm;
