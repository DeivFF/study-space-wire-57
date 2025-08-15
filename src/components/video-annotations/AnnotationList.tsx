
import { useState } from 'react';
import { Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

interface Annotation {
  id: string;
  timestamp: number;
  content: string;
  createdAt: string;
}

interface AnnotationListProps {
  annotations: Annotation[];
  onDeleteAnnotation: (id: string) => void;
  onUpdateAnnotation: (id: string, content: string) => void;
}

const AnnotationList = ({ annotations, onDeleteAnnotation, onUpdateAnnotation }: AnnotationListProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startEdit = (annotation: Annotation) => {
    setEditingId(annotation.id);
    setEditContent(annotation.content);
  };

  const saveEdit = () => {
    if (!editContent.trim()) return;
    onUpdateAnnotation(editingId!, editContent.trim());
    setEditingId(null);
    setEditContent('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  if (annotations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma anotação ainda</p>
        <p className="text-sm">Adicione uma anotação para começar</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {annotations.map((annotation) => (
        <Card key={annotation.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-medium text-blue-600">
                {formatTime(annotation.timestamp)}
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => startEdit(annotation)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => onDeleteAnnotation(annotation.id)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {editingId === annotation.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex space-x-2">
                  <Button onClick={saveEdit} size="sm">
                    Salvar
                  </Button>
                  <Button onClick={cancelEdit} size="sm" variant="outline">
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 text-sm whitespace-pre-wrap">
                {annotation.content}
              </p>
            )}
            
            <p className="text-xs text-gray-400 mt-2">
              {new Date(annotation.createdAt).toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AnnotationList;
