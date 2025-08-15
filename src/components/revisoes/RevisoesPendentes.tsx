import { Calendar, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReviewCard from '../ReviewCard';

interface Review {
  id: string;
  lesson_id: string;
  next_review_date: string;
  ease_factor: number;
  repetition: number;
  rating: number;
  interval_days: number;
  lessons?: {
    id: string;
    name: string;
    category_id: string;
    lesson_categories: {
      id: string;
      name: string;
    };
  };
}

interface Lesson {
  id: string;
  name: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
}

interface RevisoesPendentesProps {
  filteredReviews: Review[];
  lessons: Lesson[];
  categories: Category[];
  selectedLesson: string;
  onRateLesson: (lessonId: string, rating: number) => Promise<void>;
  onShowHistory: (lessonId: string) => Promise<void>;
  onSelectLesson: (lessonId: string) => void;
}

const RevisoesPendentes = ({
  filteredReviews,
  lessons,
  categories,
  selectedLesson,
  onRateLesson,
  onShowHistory,
  onSelectLesson
}: RevisoesPendentesProps) => {
  const getLessonById = (lessonId: string) => {
    return lessons.find(lesson => lesson.id === lessonId);
  };

  const getCategoryById = (categoryId: string) => {
    return categories.find(category => category.id === categoryId);
  };

  if (filteredReviews.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Parabéns! Nenhuma revisão pendente
          </h3>
          <p className="text-gray-600 mb-4">
            Você está em dia com suas revisões. Continue estudando novas aulas!
          </p>
          <div className="text-sm text-gray-500">
            💡 Dica: Avalie aulas recém-estudadas para adicioná-las ao sistema de revisão
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Revisões Pendentes
          <span className="text-sm font-normal text-gray-500">
            ({filteredReviews.length} {filteredReviews.length === 1 ? 'aula' : 'aulas'})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredReviews.map((review) => {
            const lesson = review.lessons || getLessonById(review.lesson_id);
            if (!lesson) return null;

            const category = review.lessons?.lesson_categories || getCategoryById(lesson.category_id);

            return (
              <ReviewCard
                key={review.id}
                review={review}
                lessonName={lesson.name}
                categoryName={category?.name}
                onRate={onRateLesson}
                onShowHistory={onShowHistory}
                isSelected={selectedLesson === review.lesson_id}
                onSelect={onSelectLesson}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RevisoesPendentes;
