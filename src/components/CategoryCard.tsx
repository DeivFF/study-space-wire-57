import React, { useState } from 'react';
import { ChevronDown, ChevronRight, SquarePen, Archive, Trash2, ArchiveRestore, Share2, Plus, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LessonCard, Lesson as LessonType } from './LessonCard';
import { ShareModal } from './ShareModal';
import { useContentSharing } from '../hooks/useContentSharing';
import { toast } from '../hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';


// Temporary lesson type, will be replaced by the one from Resumos
// export interface Lesson extends LessonType {}

// Temporary category type
export interface Category {
  id: string;
  name:string;
  is_archived: boolean;
}

interface CategoryCardProps {
  category: Category;
  lessons: LessonType[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (category: Category) => void;
  onArchive: (categoryId: string, isArchived: boolean) => void;
  onDelete: (categoryId: string) => void;
  onLessonClick: (lessonId: string) => void;
  onAddLesson: (categoryId: string) => void;
  onAddBulkLessons: (categoryId: string) => void;
  // Props for Lesson Card actions
  onEditLesson: (lesson: LessonType) => void;
  onDeleteLesson: (lessonId: string, lessonName: string) => void;
  onMarkLessonAsWatched: (lessonId: string, watched: boolean) => void;
}

export function CategoryCard({
  category,
  lessons,
  isExpanded,
  onToggle,
  onEdit,
  onArchive,
  onDelete,
  onLessonClick,
  onEditLesson,
  onDeleteLesson,
  onMarkLessonAsWatched,
  onAddLesson,
  onAddBulkLessons,
}: CategoryCardProps) {
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const { createSharedContent, sendShareRequest } = useContentSharing();

  const handleOpenShareModal = () => {
    setShareModalOpen(true);
  };

  const handleShare = async (friendId: string) => {
    if (!category) return;

    try {
      const lessonIds = lessons.map(l => l.id);

      // Fetch all related items in parallel
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

      // 1. Create content package
      const itemsToShare = [
        { type: 'category', id: category.id, data: { name: category.name, is_archived: category.is_archived } },
        ...lessons.map(lesson => ({
          type: 'lesson',
          id: lesson.id,
          data: {
            name: lesson.name,
            category_id: lesson.category_id,
            duration_minutes: lesson.duration_minutes,
            summary: lesson.summary,
            audio_file_path: lesson.audio_file_path,
            watched: false,
          },
        })),
        ...(flashcards || []).map(item => ({ type: 'flashcard', id: item.id, data: { ...item, id: undefined } })),
        ...(questions || []).map(item => ({ type: 'question', id: item.id, data: { ...item, id: undefined } })),
        ...(documents || []).map(item => ({ type: 'document', id: item.id, data: { ...item, id: undefined } })),
      ];

      const sharedContent = await createSharedContent(
        category.name,
        `Uma categoria com ${lessons.length} aulas e outros conteúdos.`,
        'category',
        itemsToShare
      );

      if (!sharedContent) {
        throw new Error('Failed to create shared content package.');
      }

      // 2. Send the request
      await sendShareRequest(sharedContent.id, category.name, friendId);

    } catch (error) {
      console.error('Sharing failed:', error);
      toast({
        title: 'Falha no Compartilhamento',
        description: 'Não foi possível compartilhar a categoria.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        {/* Category Header */}
        <div className={`p-4 border-b ${category.is_archived ? 'bg-slate-50' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={onToggle} className="flex items-center space-x-3">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                )}
                <h2 className={`text-lg font-semibold text-gray-800 ${category.is_archived ? 'line-through' : ''}`}>
                  {category.name}
                </h2>
              </button>
              <span className="text-sm text-muted-foreground bg-slate-200 px-2.5 py-1 rounded-full font-medium">
                {lessons.length} aulas
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => onAddLesson(category.id)}>
                <Plus className="h-4 w-4 mr-1" />
                Nova Aula
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAddBulkLessons(category.id)}>
                <Upload className="h-4 w-4 mr-1" />
                Múltiplas Aulas
              </Button>
              {/* Action Icons */}
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="icon" onClick={handleOpenShareModal} className="group">
                  <Share2 className="h-4 w-4 text-gray-500 group-hover:text-purple-600" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onEdit(category)} className="group">
                  <SquarePen className="h-4 w-4 text-gray-500 group-hover:text-blue-600" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onArchive(category.id, category.is_archived)} className="group">
                  {category.is_archived ? (
                    <ArchiveRestore className="h-4 w-4 text-gray-500 group-hover:text-green-600" />
                  ) : (
                    <Archive className="h-4 w-4 text-gray-500 group-hover:text-yellow-600" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(category.id)} className="group">
                  <Trash2 className="h-4 w-4 text-gray-500 group-hover:text-red-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        {isExpanded && (
          <div className="bg-white [&>:last-child]:border-b-0">
            {lessons.length > 0 ? (
              lessons.map(lesson => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onLessonClick={onLessonClick}
                  onEdit={onEditLesson}
                  onDelete={onDeleteLesson}
                  onMarkAsWatched={onMarkLessonAsWatched}
                />
              ))
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                <p>Nenhuma aula disponível nesta categoria</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ShareModal
        open={isShareModalOpen}
        onOpenChange={setShareModalOpen}
        contentTitle={category.name}
        onSelectFriend={handleShare}
      />
    </>
  );
}
