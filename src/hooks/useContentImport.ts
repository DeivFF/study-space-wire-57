import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface ImportProgress {
  currentStep: string;
  totalSteps: number;
  currentStepNumber: number;
  isComplete: boolean;
  error?: string;
}

export const useContentImport = () => {
  const { user } = useAuth();
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Generate new UUID for imported content
  const generateNewId = () => crypto.randomUUID();

  // Copy file in storage for the importing user
  const copyFileForUser = async (originalPath: string, newPath: string, bucket: string) => {
    try {
      // Download the original file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(originalPath);

      if (downloadError) {
        console.error('Error downloading file:', downloadError);
        return null;
      }

      // Upload to new path for the importing user
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(newPath, fileData, {
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return null;
      }

      return newPath;
    } catch (error) {
      console.error('Error copying file:', error);
      return null;
    }
  };

  // Generate new file path for imported content
  const generateNewFilePath = (originalPath: string, newId: string, originalOwnerId: string) => {
    if (!originalPath) return null;
    
    // Extract file extension
    const extension = originalPath.split('.').pop();
    // Create new path with user ID and new lesson ID
    return `${user?.id}/${newId}_imported.${extension}`;
  };

  // Import a single category
  const importCategory = async (categoryData: any, idMapping: Map<string, string>) => {
    if (!user) return null;

    const newCategoryId = generateNewId();
    idMapping.set(categoryData.id, newCategoryId);

    const { data, error } = await supabase
      .from('lesson_categories')
      .insert({
        id: newCategoryId,
        user_id: user.id,
        name: `${categoryData.name} (Importado)`,
        is_archived: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error importing category:', error);
      return null;
    }

    return data;
  };

  // Import a single lesson with file copying
  const importLesson = async (lessonData: any, newCategoryId: string, idMapping: Map<string, string>) => {
    if (!user) return null;

    const newLessonId = generateNewId();
    idMapping.set(lessonData.id, newLessonId);

    // Copy files if they exist
    let newAudioPath = null;
    let newHtmlPath = null;

    if (lessonData.audio_file_path) {
      const newPath = generateNewFilePath(lessonData.audio_file_path, newLessonId, lessonData.user_id);
      if (newPath) {
        newAudioPath = await copyFileForUser(lessonData.audio_file_path, newPath, 'lesson-files');
      }
    }

    if (lessonData.html_file_path) {
      const newPath = generateNewFilePath(lessonData.html_file_path, newLessonId, lessonData.user_id);
      if (newPath) {
        newHtmlPath = await copyFileForUser(lessonData.html_file_path, newPath, 'lesson-files');
      }
    }

    const { data, error } = await supabase
      .from('lessons')
      .insert({
        id: newLessonId,
        user_id: user.id,
        category_id: newCategoryId,
        name: lessonData.name,
        duration_minutes: lessonData.duration_minutes,
        watched: false,
        watched_at: null,
        audio_file_path: newAudioPath,
        html_file_path: newHtmlPath,
        website_url: lessonData.website_url,
        rating: null,
        rated_at: null
      })
      .select()
      .single();

    if (error) {
      console.error('Error importing lesson:', error);
      return null;
    }

    return data;
  };

  // Import lesson documents
  const importLessonDocuments = async (originalLessonId: string, newLessonId: string) => {
    if (!user) return;

    try {
      // Get original documents
      const { data: documents, error: fetchError } = await supabase
        .from('lesson_documents')
        .select('*')
        .eq('lesson_id', originalLessonId);

      if (fetchError || !documents) return;

      for (const doc of documents) {
        const newDocumentId = generateNewId();
        const newFilePath = generateNewFilePath(doc.file_path, newDocumentId, doc.user_id);
        
        let copiedPath = null;
        if (newFilePath) {
          copiedPath = await copyFileForUser(doc.file_path, newFilePath, 'documents');
        }

        await supabase
          .from('lesson_documents')
          .insert({
            id: newDocumentId,
            user_id: user.id,
            lesson_id: newLessonId,
            title: doc.title,
            file_name: doc.file_name,
            file_path: copiedPath || doc.file_path,
            document_type: doc.document_type
          });
      }
    } catch (error) {
      console.error('Error importing lesson documents:', error);
    }
  };

  // Import lesson flashcards
  const importLessonFlashcards = async (originalLessonId: string, newLessonId: string) => {
    if (!user) return;

    try {
      const { data: flashcards, error: fetchError } = await supabase
        .from('lesson_flashcards')
        .select('*')
        .eq('lesson_id', originalLessonId);

      if (fetchError || !flashcards) return;

      const flashcardsToInsert = flashcards.map(flashcard => ({
        id: generateNewId(),
        user_id: user.id,
        lesson_id: newLessonId,
        frente: flashcard.frente,
        verso: flashcard.verso,
        dica: flashcard.dica
      }));

      await supabase
        .from('lesson_flashcards')
        .insert(flashcardsToInsert);
    } catch (error) {
      console.error('Error importing lesson flashcards:', error);
    }
  };

  // Import lesson notes
  const importLessonNotes = async (originalLessonId: string, newLessonId: string) => {
    if (!user) return;

    try {
      const { data: notes, error: fetchError } = await supabase
        .from('lesson_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', originalLessonId);

      if (fetchError || !notes) return;

      const notesToInsert = notes.map(note => ({
        id: generateNewId(),
        user_id: user.id,
        lesson_id: newLessonId,
        title: note.title,
        content: note.content
      }));

      await supabase
        .from('lesson_notes')
        .insert(notesToInsert);
    } catch (error) {
      console.error('Error importing lesson notes:', error);
    }
  };

  // Import annotation questions
  const importAnnotationQuestions = async (originalLessonId: string, newLessonId: string) => {
    if (!user) return;

    try {
      const { data: questions, error: fetchError } = await supabase
        .from('annotation_questions')
        .select('*')
        .eq('document_id', originalLessonId);

      if (fetchError || !questions) return;

      const questionsToInsert = questions.map(question => ({
        id: generateNewId(),
        document_id: newLessonId,
        question: question.question,
        options: question.options,
        correct_answer: question.correct_answer,
        explanation: question.explanation
      }));

      await supabase
        .from('annotation_questions')
        .insert(questionsToInsert);
    } catch (error) {
      console.error('Error importing annotation questions:', error);
    }
  };

  // Main import function
  const importSharedContent = async (sharedContentId: string, items: any[]) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return false;
    }

    setIsImporting(true);
    const idMapping = new Map<string, string>();
    
    try {
      // Calculate total steps
      const totalSteps = items.length + (items.filter(item => item.item_type === 'lesson').length * 4); // Extra steps for lesson sub-items
      let currentStep = 0;

      setImportProgress({
        currentStep: 'Iniciando importação...',
        totalSteps,
        currentStepNumber: currentStep,
        isComplete: false
      });

      // Group items by type
      const categories = items.filter(item => item.item_type === 'category');
      const lessons = items.filter(item => item.item_type === 'lesson');

      // Import categories first
      for (const categoryItem of categories) {
        currentStep++;
        setImportProgress({
          currentStep: `Importando categoria: ${categoryItem.item_data.name}`,
          totalSteps,
          currentStepNumber: currentStep,
          isComplete: false
        });

        await importCategory(categoryItem.item_data, idMapping);
      }

      // Import lessons
      for (const lessonItem of lessons) {
        currentStep++;
        const lessonData = lessonItem.item_data;
        const newCategoryId = idMapping.get(lessonData.category_id);
        
        if (!newCategoryId) {
          console.error('Category not found for lesson:', lessonData.name);
          continue;
        }

        setImportProgress({
          currentStep: `Importando aula: ${lessonData.name}`,
          totalSteps,
          currentStepNumber: currentStep,
          isComplete: false
        });

        const importedLesson = await importLesson(lessonData, newCategoryId, idMapping);
        
        if (importedLesson) {
          // Import related content
          currentStep++;
          setImportProgress({
            currentStep: `Importando documentos da aula: ${lessonData.name}`,
            totalSteps,
            currentStepNumber: currentStep,
            isComplete: false
          });
          await importLessonDocuments(lessonData.id, importedLesson.id);

          currentStep++;
          setImportProgress({
            currentStep: `Importando flashcards da aula: ${lessonData.name}`,
            totalSteps,
            currentStepNumber: currentStep,
            isComplete: false
          });
          await importLessonFlashcards(lessonData.id, importedLesson.id);

          currentStep++;
          setImportProgress({
            currentStep: `Importando anotações da aula: ${lessonData.name}`,
            totalSteps,
            currentStepNumber: currentStep,
            isComplete: false
          });
          await importLessonNotes(lessonData.id, importedLesson.id);

          currentStep++;
          setImportProgress({
            currentStep: `Importando exercícios da aula: ${lessonData.name}`,
            totalSteps,
            currentStepNumber: currentStep,
            isComplete: false
          });
          await importAnnotationQuestions(lessonData.id, importedLesson.id);

          // Track imported content
          await supabase
            .from('imported_content_tracking')
            .insert({
              user_id: user.id,
              original_shared_content_id: sharedContentId,
              imported_item_type: 'lesson',
              original_item_id: lessonData.id,
              new_item_id: importedLesson.id
            });
        }
      }

      setImportProgress({
        currentStep: 'Importação concluída!',
        totalSteps,
        currentStepNumber: totalSteps,
        isComplete: true
      });

      toast({
        title: "Importação concluída!",
        description: "Todo o conteúdo foi importado com sucesso para sua conta"
      });

      return true;
    } catch (error) {
      console.error('Error importing content:', error);
      setImportProgress({
        currentStep: 'Erro na importação',
        totalSteps: 0,
        currentStepNumber: 0,
        isComplete: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });

      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro durante a importação do conteúdo",
        variant: "destructive"
      });

      return false;
    } finally {
      setIsImporting(false);
      // Clear progress after 3 seconds
      setTimeout(() => setImportProgress(null), 3000);
    }
  };

  return {
    importSharedContent,
    importProgress,
    isImporting
  };
};