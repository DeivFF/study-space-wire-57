import { useState } from 'react';
import { FileText, Plus, Edit, Trash2, Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabaseLessonNotes } from '@/hooks/useSupabaseLessonNotes';

interface LessonNotesViewProps {
  lessonId: string;
}

export const LessonNotesView = ({ lessonId }: LessonNotesViewProps) => {
  const { notes, isLoading, createNote, updateNote, deleteNote } = useSupabaseLessonNotes(lessonId);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newContent, setNewContent] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleCreateNote = async () => {
    if (!newContent.trim()) return;
    const success = await createNote(newContent);
    if (success) {
      setNewContent('');
      setIsCreating(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!editContent.trim() || !editingId) return;
    const success = await updateNote(editingId, editContent);
    if (success) {
      setEditingId(null);
      setEditContent('');
    }
  };

  const startEdit = (note: any) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreating(true)} disabled={isCreating || isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Anotação
        </Button>
      </div>

      {isCreating && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Nova Anotação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Digite sua anotação..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="min-h-[120px]"
              autoFocus
            />
            <div className="flex space-x-2">
              <Button onClick={handleCreateNote} disabled={!newContent.trim()}>
                <Save className="w-4 h-4 mr-2" /> Salvar
              </Button>
              <Button variant="outline" onClick={() => { setIsCreating(false); setNewContent(''); }}>
                <X className="w-4 h-4 mr-2" /> Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {!isLoading && (
        <div className="space-y-3">
          {notes.length === 0 && !isCreating ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma anotação ainda</p>
              <p className="text-sm">Clique em "Nova Anotação" para começar</p>
            </div>
          ) : (
            notes.map((note) => (
              <Card key={note.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm text-gray-500">
                      {formatDate(note.created_at)}
                      {note.updated_at !== note.created_at && (
                        <span className="ml-2">(editado)</span>
                      )}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {editingId === note.id ? (
                        <>
                          <Button onClick={handleUpdateNote} size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600">
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button onClick={cancelEdit} size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => startEdit(note)} size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => deleteNote(note.id)} size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingId === note.id ? (
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[100px]"
                      autoFocus
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};
