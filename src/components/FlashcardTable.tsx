
import { useState } from 'react';
import { Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSupabaseLessonFlashcards } from '@/hooks/useSupabaseLessonFlashcards';

interface LessonFlashcard {
  id: string;
  lesson_id: string;
  frente: string;
  verso: string;
  dica?: string;
  created_at: string;
  updated_at: string;
}

interface FlashcardTableProps {
  flashcards: LessonFlashcard[];
  lessonId: string;
  onFlashcardUpdated: () => void;
}

const FlashcardTable = ({ flashcards, lessonId, onFlashcardUpdated }: FlashcardTableProps) => {
  const { atualizarFlashcard, excluirFlashcard, loading } = useSupabaseLessonFlashcards();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    frente: '',
    verso: '',
    dica: ''
  });

  const handleEdit = (flashcard: LessonFlashcard) => {
    setEditingId(flashcard.id);
    setEditData({
      frente: flashcard.frente,
      verso: flashcard.verso,
      dica: flashcard.dica || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({ frente: '', verso: '', dica: '' });
  };

  const handleSave = async (id: string) => {
    if (!editData.frente.trim() || !editData.verso.trim()) {
      alert('Frente e verso são obrigatórios');
      return;
    }

    const result = await atualizarFlashcard(id, {
      frente: editData.frente.trim(),
      verso: editData.verso.trim(),
      dica: editData.dica.trim() || undefined
    });

    if (result) {
      setEditingId(null);
      setEditData({ frente: '', verso: '', dica: '' });
      onFlashcardUpdated();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este flashcard?')) {
      const success = await excluirFlashcard(id);
      if (success) {
        onFlashcardUpdated();
      }
    }
  };

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhum flashcard encontrado para esta aula.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Flashcards Criados ({flashcards.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Frente</TableHead>
              <TableHead className="w-1/3">Verso</TableHead>
              <TableHead className="w-1/4">Dica</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flashcards.map((flashcard) => (
              <TableRow key={flashcard.id}>
                <TableCell>
                  {editingId === flashcard.id ? (
                    <Textarea
                      value={editData.frente}
                      onChange={(e) => setEditData({ ...editData, frente: e.target.value })}
                      className="min-h-[60px]"
                      placeholder="Frente do flashcard"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">{flashcard.frente}</div>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === flashcard.id ? (
                    <Textarea
                      value={editData.verso}
                      onChange={(e) => setEditData({ ...editData, verso: e.target.value })}
                      className="min-h-[60px]"
                      placeholder="Verso do flashcard"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">{flashcard.verso}</div>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === flashcard.id ? (
                    <Input
                      value={editData.dica}
                      onChange={(e) => setEditData({ ...editData, dica: e.target.value })}
                      placeholder="Dica (opcional)"
                    />
                  ) : (
                    <div className="text-gray-600">{flashcard.dica || '-'}</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {editingId === flashcard.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSave(flashcard.id)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={loading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(flashcard)}
                          disabled={loading}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(flashcard.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FlashcardTable;
