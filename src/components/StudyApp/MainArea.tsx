import { useState } from 'react';
import { useStudyApp } from '@/contexts/StudyAppContext';
import { LessonCard } from './LessonCard';
import { LessonListItem } from './LessonListItem';
import { LessonDetail } from './LessonDetail';
import { NovaAulaModal } from '../NovaAulaModal';
import { Lesson } from '@/services/studyApi';

export function MainArea() {
  const { state } = useStudyApp();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [lessonToEdit, setLessonToEdit] = useState<Lesson | null>(null);

  const handleEditLesson = (lesson: Lesson) => {
    setLessonToEdit(lesson);
    setEditModalOpen(true);
  };

  // Get selected category
  const selectedCategory = state.categories.find(cat => cat.id === state.selectedCategoryId);

  // Handle different app modes
  if (state.appMode === 'share') {
    return (
      <>
        <div className="bg-app-bg-soft border border-app-border rounded-2xl p-3">
          Compartilhar (placeholder)
        </div>
        <NovaAulaModal 
          open={editModalOpen} 
          onOpenChange={setEditModalOpen}
          lesson={lessonToEdit}
          mode="edit"
        />
      </>
    );
  }

  if (state.appMode === 'import') {
    return (
      <>
        <div className="bg-app-bg-soft border border-app-border rounded-2xl p-3">
          Importar (placeholder)
        </div>
        <NovaAulaModal 
          open={editModalOpen} 
          onOpenChange={setEditModalOpen}
          lesson={lessonToEdit}
          mode="edit"
        />
      </>
    );
  }

  if (state.appMode === 'detail') {
    return (
      <>
        <LessonDetail />
        <NovaAulaModal 
          open={editModalOpen} 
          onOpenChange={setEditModalOpen}
          lesson={lessonToEdit}
          mode="edit"
        />
      </>
    );
  }

  // Filter lessons based on current filters
  const filterLessons = (lessons: typeof selectedCategory.lessons) => {
    const query = state.query.trim().toLowerCase();
    return lessons.filter(lesson => {
      const byQuery = query ? lesson.title.toLowerCase().includes(query) : true;
      const byDifficulty = state.difficulty === 'all' ? true : lesson.difficulty === state.difficulty;
      const byStatus = state.status === 'all' ? true : lesson.status === state.status;
      const byType = state.typeFilter === 'all' ? true : 
        lesson.resources.some(resource => resource.type === state.typeFilter);
      
      return byQuery && byDifficulty && byStatus && byType;
    });
  };

  if (!selectedCategory) {
    return (
      <>
        <div className="bg-app-bg-soft border border-app-border rounded-2xl p-5">
          <div className="text-app-text">Sem categorias</div>
        </div>
        <NovaAulaModal 
          open={editModalOpen} 
          onOpenChange={setEditModalOpen}
          lesson={lessonToEdit}
          mode="edit"
        />
      </>
    );
  }

  const filteredLessons = filterLessons(selectedCategory.lessons);

  if (filteredLessons.length === 0) {
    console.log('MainArea - No filtered lessons. Selected category:', selectedCategory, 'Total lessons:', selectedCategory?.lessons?.length);
    return (
      <>
        <div className="bg-app-bg-soft border border-app-border rounded-2xl p-5">
          <div className="text-app-text">Nenhuma aula com esses filtros.</div>
        </div>
        <NovaAulaModal 
          open={editModalOpen} 
          onOpenChange={setEditModalOpen}
          lesson={lessonToEdit}
          mode="edit"
        />
      </>
    );
  }

  if (state.view === 'cards') {
    return (
      <>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {filteredLessons.map(lesson => (
            <LessonCard key={lesson.id} lesson={lesson} onEdit={handleEditLesson} />
          ))}
        </div>
        <NovaAulaModal 
          open={editModalOpen} 
          onOpenChange={setEditModalOpen}
          lesson={lessonToEdit}
          mode="edit"
        />
      </>
    );
  }

  // List view
  return (
    <>
      <div className="border border-app-border rounded-2xl overflow-hidden bg-app-bg-soft">
        <div className="grid grid-cols-[40px_1fr_180px_120px_260px_40px] gap-2 px-3 py-2 text-app-text-muted text-sm font-medium border-b border-app-border">
          <div></div>
          <div>Título</div>
          <div>Progresso</div>
          <div>Acerto</div>
          <div>Recursos</div>
          <div></div>
        </div>
        {filteredLessons.map(lesson => (
          <LessonListItem key={lesson.id} lesson={lesson} />
        ))}
      </div>
      <NovaAulaModal 
        open={editModalOpen} 
        onOpenChange={setEditModalOpen}
        lesson={lessonToEdit}
        mode="edit"
      />
    </>
  );
}