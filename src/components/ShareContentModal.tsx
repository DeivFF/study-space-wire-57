import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useFriends } from '@/hooks/useFriends';
import { useContentSharing } from '@/hooks/useContentSharing';
import { SelectiveContentPicker } from './SelectiveContentPicker';
import { Lesson, LessonCategory } from '@/types/lessons';
import { Share2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ShareContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: LessonCategory[];
  lessons: Lesson[];
  sendShareRequest: (sharedContentId: string, contentTitle: string, friendId: string, shareMessage: string) => Promise<boolean>;
}

export const ShareContentModal = ({ isOpen, onClose, categories, lessons, sendShareRequest }: ShareContentModalProps) => {
  const { friends } = useFriends();
  const { createSharedContent } = useContentSharing();
  
  const [selectedItems, setSelectedItems] = useState<Array<{ type: string; id: string; data: any }>>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [shareMessage, setShareMessage] = useState('');
  const [step, setStep] = useState<'content' | 'recipients'>('content');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateAndShare = async () => {
    if (selectedItems.length === 0) return;

    setIsCreating(true);
    try {
      const lessonIds = selectedItems
        .filter(item => item.type === 'lesson')
        .map(item => item.id);

      let fullItemsToShare = [...selectedItems];

      if (lessonIds.length > 0) {
        const [
          { data: flashcards, error: flashcardsError },
          { data: questions, error: questionsError },
          { data: documents, error: documentsError }
        ] = await Promise.all([
          supabase.from('lesson_flashcards').select('*').in('lesson_id', lessonIds),
          supabase.from('annotation_questions').select('*').in('document_id', lessonIds),
          supabase.from('lesson_documents').select('*').in('lesson_id', lessonIds)
        ]);

        if (flashcardsError || questionsError || documentsError) {
          console.error('Error fetching related content:', { flashcardsError, questionsError, documentsError });
          throw new Error('Failed to fetch related content for sharing.');
        }

        const flashcardItems = (flashcards || []).map(item => ({ type: 'flashcard', id: item.id, data: { ...item, id: undefined } }));
        const questionItems = (questions || []).map(item => ({ type: 'question', id: item.id, data: { ...item, id: undefined } }));
        const documentItems = (documents || []).map(item => ({ type: 'document', id: item.id, data: { ...item, id: undefined } }));

        fullItemsToShare = [...fullItemsToShare, ...flashcardItems, ...questionItems, ...documentItems];
      }

      // Auto-generate a title
      const autoTitle = `Conteúdo Compartilhado - ${new Date().toLocaleDateString()}`;

      // Create shared content
      const sharedContent = await createSharedContent(
        autoTitle,
        '', // Empty description
        'resumos',
        fullItemsToShare
      );

      if (sharedContent && selectedFriends.length > 0) {
        // Send share requests to selected friends
        const sharePromises = selectedFriends.map(friendId =>
          sendShareRequest(sharedContent.id, sharedContent.title, friendId, shareMessage)
        );
        
        await Promise.all(sharePromises);
      }

      // Reset form and close
      setSelectedItems([]);
      setSelectedFriends([]);
      setShareMessage('');
      setStep('content');
      onClose();
    } catch (error) {
      console.error('Error creating and sharing content:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartilhar Conteúdo
          </DialogTitle>
        </DialogHeader>

        {step === 'content' && (
          <div className="space-y-6 flex flex-col">
            <div>
              <label className="text-sm font-medium mb-2 block">Selecionar Conteúdo para Compartilhar</label>
              <SelectiveContentPicker
                categories={categories}
                lessons={lessons}
                selectedItems={selectedItems}
                onSelectionChange={setSelectedItems}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => setStep('recipients')}
                disabled={selectedItems.length === 0}
                className="flex-1"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 'recipients' && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Users className="h-4 w-4" />
                Selecionar Amigos
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {friends.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Você ainda não tem amigos para compartilhar conteúdo.
                  </p>
                ) : (
                friends.map(friendship => {
                  const friendId = friendship.friend_profile?.user_id;
                  const friendName = friendship.friend_profile?.nickname || `Usuário #${friendId?.slice(0, 8)}`;

                  if (!friendId) return null;

                  return (
                    <div key={friendship.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`friend-${friendId}`}
                        checked={selectedFriends.includes(friendId)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFriends(prev => [...prev, friendId]);
                          } else {
                            setSelectedFriends(prev => prev.filter(id => id !== friendId));
                          }
                        }}
                      />
                      <label htmlFor={`friend-${friendId}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {friendName}
                      </label>
                    </div>
                  )
                })
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Mensagem (opcional)</label>
              <Textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                placeholder="Adicione uma mensagem personalizada..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('content')}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={handleCreateAndShare}
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? 'Compartilhando...' : 'Compartilhar'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};