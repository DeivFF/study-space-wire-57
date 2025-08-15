import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface ImportedContentItem {
  id: string;
  user_id: string;
  original_shared_content_id: string;
  imported_item_type: string;
  original_item_id: string;
  new_item_id: string;
  imported_at: string;
  shared_content?: any;
}

export const useImportedContentManager = () => {
  const { user } = useAuth();
  const [importedContent, setImportedContent] = useState<ImportedContentItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all imported content for the user
  const loadImportedContent = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('imported_content_tracking')
        .select(`
          *,
          shared_content(*)
        `)
        .eq('user_id', user.id)
        .order('imported_at', { ascending: false });

      if (error) throw error;
      setImportedContent(data || []);
    } catch (error) {
      console.error('Error loading imported content:', error);
      toast({
        title: "Erro ao carregar conteúdo importado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Delete imported content and its tracking
  const deleteImportedContent = useCallback(async (trackingId: string, newItemId: string, itemType: string) => {
    if (!user) return false;

    try {
      // Delete the actual content based on type
      let deleteError = null;
      
      switch (itemType) {
        case 'category': {
          // First delete all lessons in the category
          const { data: lessonsInCategory } = await supabase
            .from('lessons')
            .select('id')
            .eq('category_id', newItemId)
            .eq('user_id', user.id);

          if (lessonsInCategory) {
            for (const lesson of lessonsInCategory) {
              await deleteImportedLesson(lesson.id);
            }
          }

          // Then delete the category
          const { error: categoryError } = await supabase
            .from('lesson_categories')
            .delete()
            .eq('id', newItemId)
            .eq('user_id', user.id);

          deleteError = categoryError;
          break;
        }

        case 'lesson':
          await deleteImportedLesson(newItemId);
          break;

        default:
          console.warn('Unknown item type for deletion:', itemType);
      }

      if (deleteError) throw deleteError;

      // Remove from tracking
      const { error: trackingError } = await supabase
        .from('imported_content_tracking')
        .delete()
        .eq('id', trackingId)
        .eq('user_id', user.id);

      if (trackingError) throw trackingError;

      await loadImportedContent();
      toast({
        title: "Conteúdo importado removido",
        description: "O conteúdo foi removido da sua conta com sucesso"
      });

      return true;
    } catch (error) {
      console.error('Error deleting imported content:', error);
      toast({
        title: "Erro ao remover conteúdo",
        description: "Não foi possível remover o conteúdo importado",
        variant: "destructive"
      });
      return false;
    }
  }, [user, loadImportedContent]);

  // Helper function to delete a lesson and all its related content
  const deleteImportedLesson = async (lessonId: string) => {
    // Delete lesson documents
    const { data: documents } = await supabase
      .from('lesson_documents')
      .select('file_path')
      .eq('lesson_id', lessonId)
      .eq('user_id', user!.id);

    if (documents) {
      for (const doc of documents) {
        if (doc.file_path) {
          await supabase.storage.from('documents').remove([doc.file_path]);
        }
      }
    }

    await supabase
      .from('lesson_documents')
      .delete()
      .eq('lesson_id', lessonId)
      .eq('user_id', user!.id);

    // Delete lesson flashcards
    await supabase
      .from('lesson_flashcards')
      .delete()
      .eq('lesson_id', lessonId)
      .eq('user_id', user!.id);

    // Delete lesson notes
    await supabase
      .from('lesson_notes')
      .delete()
      .eq('lesson_id', lessonId)
      .eq('user_id', user!.id);

    // Delete annotation questions
    await supabase
      .from('annotation_questions')
      .delete()
      .eq('document_id', lessonId);

    // Delete lesson files from storage
    const { data: lesson } = await supabase
      .from('lessons')
      .select('audio_file_path, html_file_path')
      .eq('id', lessonId)
      .eq('user_id', user!.id)
      .single();

    if (lesson) {
      const filesToDelete = [];
      if (lesson.audio_file_path) filesToDelete.push(lesson.audio_file_path);
      if (lesson.html_file_path) filesToDelete.push(lesson.html_file_path);
      
      if (filesToDelete.length > 0) {
        await supabase.storage.from('lesson-files').remove(filesToDelete);
      }
    }

    // Finally delete the lesson
    await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId)
      .eq('user_id', user!.id);
  };

  // Get import statistics
  const getImportStats = useCallback(() => {
    const stats = {
      totalImports: importedContent.length,
      categoriesImported: importedContent.filter(item => item.imported_item_type === 'category').length,
      lessonsImported: importedContent.filter(item => item.imported_item_type === 'lesson').length,
      recentImports: importedContent.filter(item => {
        const importDate = new Date(item.imported_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return importDate > weekAgo;
      }).length
    };
    return stats;
  }, [importedContent]);

  return {
    importedContent,
    loading,
    loadImportedContent,
    deleteImportedContent,
    getImportStats
  };
};