
import { useState, useEffect } from 'react';
import { ChevronLeft, Edit, Trash2, Plus, FileText, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseLessonQuestions } from '@/hooks/useSupabaseLessonQuestions';
import { useToast } from '@/hooks/use-toast';

interface QuestionManagerProps {
  lessonId: string;
  lessonTitle: string;
  onBack: () => void;
}

const QuestionManager = ({ lessonId, lessonTitle, onBack }: QuestionManagerProps) => {
  const { questions, carregarQuestoes, excluirQuestao, criarQuestao } = useSupabaseLessonQuestions();
  const { toast } = useToast();
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCommentaryDialog, setShowCommentaryDialog] = useState(false);
  const [commentaryQuestion, setCommentaryQuestion] = useState<any>(null);

  const [editForm, setEditForm] = useState({
    question: '',
    options: ['', '', '', '', ''],
    correct_answer: 0,
    explanation: ''
  });

  const lessonQuestions = questions.filter(q => q.lesson_id === lessonId);

  useEffect(() => {
    carregarQuestoes(lessonId);
  }, [lessonId, carregarQuestoes]);

  const handleEdit = (question: any) => {
    setEditingQuestion(question);
    setEditForm({
      question: question.question,
      options: [...question.options],
      correct_answer: question.correct_answer,
      explanation: question.explanation || ''
    });
    setShowEditDialog(true);
  };

  const handleDelete = async (questionId: string) => {
    if (confirm('Tem certeza que deseja excluir esta questão?')) {
      await excluirQuestao(questionId);
      toast({
        title: "Questão excluída",
        description: "A questão foi removida com sucesso"
      });
    }
  };

  const handleSaveEdit = async () => {
    // Como não temos função de editar, vamos excluir e criar uma nova
    if (editingQuestion) {
      await excluirQuestao(editingQuestion.id);
      await criarQuestao(
        lessonId,
        editForm.question,
        editForm.options,
        editForm.correct_answer,
        editForm.explanation
      );
      setShowEditDialog(false);
      setEditingQuestion(null);
      toast({
        title: "Questão atualizada",
        description: "A questão foi atualizada com sucesso"
      });
    }
  };

  const handleShowCommentary = (question: any) => {
    setCommentaryQuestion(question);
    setShowCommentaryDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button onClick={onBack} variant="outline">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Exercícios</h1>
          <p className="text-gray-600">{lessonTitle}</p>
        </div>
      </div>

      {lessonQuestions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum exercício encontrado</p>
              <p className="text-sm">Crie exercícios para esta aula primeiro</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {lessonQuestions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Questão {index + 1}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleShowCommentary(question)}
                      size="sm"
                      variant="outline"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Gabarito
                    </Button>
                    <Button
                      onClick={() => handleEdit(question)}
                      size="sm"
                      variant="outline"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDelete(question.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="font-medium">{question.question}</p>
                  <div className="space-y-2">
                    {question.options.map((option: string, optionIndex: number) => (
                      <div
                        key={optionIndex}
                        className={`p-3 rounded-lg border ${
                          optionIndex === question.correct_answer
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <span className="font-medium mr-2">
                          {String.fromCharCode(65 + optionIndex)})
                        </span>
                        {option}
                        {optionIndex === question.correct_answer && (
                          <span className="ml-2 text-green-600 font-medium">
                            ✓ Correta
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {question.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-700">
                        <strong>Explicação:</strong> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Questão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Pergunta</Label>
              <Textarea
                id="question"
                value={editForm.question}
                onChange={(e) => setEditForm(prev => ({ ...prev, question: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Alternativas</Label>
              {editForm.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="w-8">{String.fromCharCode(65 + index)})</span>
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...editForm.options];
                      newOptions[index] = e.target.value;
                      setEditForm(prev => ({ ...prev, options: newOptions }));
                    }}
                    placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                  />
                  <input
                    type="radio"
                    name="correct"
                    checked={editForm.correct_answer === index}
                    onChange={() => setEditForm(prev => ({ ...prev, correct_answer: index }))}
                  />
                </div>
              ))}
            </div>

            <div>
              <Label htmlFor="explanation">Explicação</Label>
              <Textarea
                id="explanation"
                value={editForm.explanation}
                onChange={(e) => setEditForm(prev => ({ ...prev, explanation: e.target.value }))}
                rows={3}
                placeholder="Explicação da resposta correta"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Gabarito Comentado */}
      <Dialog open={showCommentaryDialog} onOpenChange={setShowCommentaryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gabarito Comentado</DialogTitle>
          </DialogHeader>
          {commentaryQuestion && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium mb-3">{commentaryQuestion.question}</p>
                <div className="space-y-2">
                  {commentaryQuestion.options.map((option: string, index: number) => (
                    <div
                      key={index}
                      className={`p-2 rounded ${
                        index === commentaryQuestion.correct_answer
                          ? 'bg-green-100 border border-green-300'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <span className="font-medium mr-2">
                        {String.fromCharCode(65 + index)})
                      </span>
                      {option}
                      {index === commentaryQuestion.correct_answer && (
                        <span className="ml-2 text-green-600 font-bold">
                          ✓ CORRETA
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {commentaryQuestion.explanation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Explicação:</h4>
                  <p className="text-blue-700">{commentaryQuestion.explanation}</p>
                </div>
              )}
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Resposta:</h4>
                <p className="text-green-700">
                  A alternativa correta é a <strong>{String.fromCharCode(65 + commentaryQuestion.correct_answer)}</strong>: 
                  "{commentaryQuestion.options[commentaryQuestion.correct_answer]}"
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionManager;
