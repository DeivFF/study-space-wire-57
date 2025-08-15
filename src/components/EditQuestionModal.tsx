
import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Questao {
  id: string;
  enunciado: string;
  alternativas: string[];
  resposta_correta: number;
  explicacao: string;
  materia: string;
  assunto: string;
  banca: string;
  ano: number;
  dificuldade: 'facil' | 'medio' | 'dificil';
  respondida: boolean;
  acertou?: boolean;
  tempo_resposta?: number;
  created_at: string;
}

interface EditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  questao: Questao | null;
  onSave: (id: string, updates: Partial<Questao>) => Promise<void>;
}

const EditQuestionModal = ({ isOpen, onClose, questao, onSave }: EditQuestionModalProps) => {
  const [formData, setFormData] = useState({
    enunciado: '',
    alternativas: ['', '', '', ''],
    resposta_correta: 0,
    explicacao: '',
    materia: '',
    assunto: '',
    banca: '',
    ano: 2024,
    dificuldade: 'medio' as 'facil' | 'medio' | 'dificil'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (questao) {
      setFormData({
        enunciado: questao.enunciado,
        alternativas: [...questao.alternativas],
        resposta_correta: questao.resposta_correta,
        explicacao: questao.explicacao || '',
        materia: questao.materia,
        assunto: questao.assunto,
        banca: questao.banca,
        ano: questao.ano,
        dificuldade: questao.dificuldade
      });
    }
  }, [questao]);

  const updateAlternativa = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      alternativas: prev.alternativas.map((alt, i) => i === index ? value : alt)
    }));
  };

  const addAlternativa = () => {
    setFormData(prev => ({
      ...prev,
      alternativas: [...prev.alternativas, '']
    }));
  };

  const removeAlternativa = (index: number) => {
    if (formData.alternativas.length > 2) {
      setFormData(prev => {
        const newAlternativas = prev.alternativas.filter((_, i) => i !== index);
        const newRespostaCorreta = prev.resposta_correta >= index && prev.resposta_correta > 0 
          ? prev.resposta_correta - 1 
          : prev.resposta_correta;
        
        return {
          ...prev,
          alternativas: newAlternativas,
          resposta_correta: newRespostaCorreta >= newAlternativas.length ? 0 : newRespostaCorreta
        };
      });
    }
  };

  const handleSave = async () => {
    if (!questao) return;

    if (!formData.enunciado.trim() || !formData.materia.trim() || !formData.assunto.trim()) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const validAlternativas = formData.alternativas.filter(alt => alt.trim());
    if (validAlternativas.length < 2) {
      alert('Adicione pelo menos 2 alternativas');
      return;
    }

    if (formData.resposta_correta >= validAlternativas.length) {
      alert('Selecione uma alternativa correta válida');
      return;
    }

    setSaving(true);
    try {
      await onSave(questao.id, {
        enunciado: formData.enunciado.trim(),
        alternativas: validAlternativas,
        resposta_correta: formData.resposta_correta,
        explicacao: formData.explicacao.trim(),
        materia: formData.materia.trim(),
        assunto: formData.assunto.trim(),
        banca: formData.banca.trim(),
        ano: formData.ano,
        dificuldade: formData.dificuldade
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar questão:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Questão</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="materia">Matéria *</Label>
              <Input
                id="materia"
                value={formData.materia}
                onChange={(e) => setFormData(prev => ({ ...prev, materia: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assunto">Assunto *</Label>
              <Input
                id="assunto"
                value={formData.assunto}
                onChange={(e) => setFormData(prev => ({ ...prev, assunto: e.target.value }))}
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="banca">Banca</Label>
              <Input
                id="banca"
                value={formData.banca}
                onChange={(e) => setFormData(prev => ({ ...prev, banca: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ano">Ano</Label>
              <Input
                id="ano"
                type="number"
                value={formData.ano}
                onChange={(e) => setFormData(prev => ({ ...prev, ano: parseInt(e.target.value) || 2024 }))}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dificuldade">Dificuldade</Label>
              <select
                id="dificuldade"
                value={formData.dificuldade}
                onChange={(e) => setFormData(prev => ({ ...prev, dificuldade: e.target.value as 'facil' | 'medio' | 'dificil' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={saving}
              >
                <option value="facil">Fácil</option>
                <option value="medio">Médio</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="enunciado">Enunciado *</Label>
            <Textarea
              id="enunciado"
              value={formData.enunciado}
              onChange={(e) => setFormData(prev => ({ ...prev, enunciado: e.target.value }))}
              rows={4}
              disabled={saving}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Alternativas *</Label>
              <Button
                onClick={addAlternativa}
                size="sm"
                variant="outline"
                disabled={saving || formData.alternativas.length >= 6}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
            
            <RadioGroup 
              value={formData.resposta_correta.toString()} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, resposta_correta: parseInt(value) }))}
            >
              {formData.alternativas.map((alternativa, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value={index.toString()} id={`alternativa-${index}`} />
                  <div className="flex-1">
                    <Input
                      placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                      value={alternativa}
                      onChange={(e) => updateAlternativa(index, e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  {formData.alternativas.length > 2 && (
                    <Button
                      onClick={() => removeAlternativa(index)}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="explicacao">Explicação</Label>
            <Textarea
              id="explicacao"
              value={formData.explicacao}
              onChange={(e) => setFormData(prev => ({ ...prev, explicacao: e.target.value }))}
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button onClick={onClose} variant="outline" disabled={saving}>
              <X className="w-4 h-4 mr-2" />
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
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditQuestionModal;
