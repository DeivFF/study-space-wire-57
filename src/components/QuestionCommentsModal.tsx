import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, Send, MessageSquare, Edit2, Trash2 } from 'lucide-react';
import { useQuestionRatings } from '@/hooks/useQuestionRatings';
import { useAuth } from '@/hooks/useAuth';

interface Comment {
  id: string;
  user_id: string;
  difficulty_rating: number;
  comment?: string;
  created_at: string;
}

interface QuestionCommentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string;
  questionTitle: string;
}

export const QuestionCommentsModal = ({ 
  open, 
  onOpenChange, 
  questionId, 
  questionTitle 
}: QuestionCommentsModalProps) => {
  const { addRating, updateRating, deleteRating, getRatingsForQuestion, loading } = useQuestionRatings();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editComment, setEditComment] = useState('');
  const [editRating, setEditRating] = useState(0);

  const loadComments = useCallback(async () => {
    const ratings = await getRatingsForQuestion(questionId);
    setComments(ratings);
  }, [getRatingsForQuestion, questionId]);

  useEffect(() => {
    if (open && questionId) {
      loadComments();
    }
  }, [open, questionId, loadComments]);

  const handleAddComment = async () => {
    if (!newComment.trim() && !newRating) return;

    const success = await addRating(questionId, newRating || 1, newComment.trim());
    
    if (success) {
      setNewComment('');
      setNewRating(0);
      await loadComments();
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingId(comment.id);
    setEditComment(comment.comment || '');
    setEditRating(comment.difficulty_rating);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    const success = await updateRating(editingId, editRating, editComment.trim());
    
    if (success) {
      setEditingId(null);
      setEditComment('');
      setEditRating(0);
      await loadComments();
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditComment('');
    setEditRating(0);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este comentário?')) {
      const success = await deleteRating(commentId);
      
      if (success) {
        await loadComments();
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Comentários da Questão</span>
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">{questionTitle}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing Comments */}
          {comments.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">
                Comentários ({comments.length})
              </h3>
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {comment.difficulty_rating && (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span>Dificuldade: {comment.difficulty_rating}/5</span>
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.created_at)}
                      </span>
                      {user?.id === comment.user_id && (
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditComment(comment)}
                            className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {editingId === comment.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">
                          Dificuldade
                        </label>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setEditRating(star)}
                              className={`w-6 h-6 transition-colors ${
                                star <= editRating
                                  ? 'text-yellow-500'
                                  : 'text-gray-300 hover:text-yellow-400'
                              }`}
                            >
                              <Star className="w-full h-full fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>
                      <Textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        rows={3}
                        className="w-full text-sm"
                        placeholder="Edite seu comentário..."
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={loading}
                        >
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    comment.comment && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.comment}
                      </p>
                    )
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhum comentário ainda</p>
            </div>
          )}

          {/* Add New Comment Form */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Adicionar Comentário
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Avaliação de dificuldade (opcional)
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className={`w-8 h-8 transition-colors ${
                        star <= newRating
                          ? 'text-yellow-500'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      <Star className="w-full h-full fill-current" />
                    </button>
                  ))}
                  {newRating > 0 && (
                    <button
                      onClick={() => setNewRating(0)}
                      className="ml-2 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Comentário
                </label>
                <Textarea
                  placeholder="Adicione suas observações sobre esta questão..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  className="w-full"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddComment}
                  disabled={loading || (!newComment.trim() && !newRating)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Adicionar Comentário
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
