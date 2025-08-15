
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Clock, CheckCircle, BookOpen } from 'lucide-react';
import { useSupabaseLessons } from '@/hooks/useSupabaseLessons';
import { useAuth } from '@/hooks/useAuth';
import CategoryStats from './CategoryStats';

const EstatisticasCategoriaUnica = () => {
  const { user } = useAuth();
  const { categories, lessons } = useSupabaseLessons(); // categories já vem filtradas (sem arquivadas)
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categoryStats, setCategoryStats] = useState<{
    categoryName: string;
    totalLessons: number;
    watchedLessons: number;
    totalHours: number;
    watchedHours: number;
  } | null>(null);

  const calculateCategoryStats = useCallback((categoryId: string) => {
    if (categoryId === 'all') {
      // Filtrar apenas aulas de categorias ativas
      const activeCategoryIds = categories.map(cat => cat.id);
      const activeLessons = lessons.filter(lesson => activeCategoryIds.includes(lesson.category_id));
      
      const totalLessons = activeLessons.length;
      const watchedLessons = activeLessons.filter(lesson => lesson.watched).length;
      const totalMinutes = activeLessons.reduce((acc, lesson) => acc + lesson.duration_minutes, 0);
      const watchedMinutes = activeLessons
        .filter(lesson => lesson.watched)
        .reduce((acc, lesson) => acc + lesson.duration_minutes, 0);

      setCategoryStats({
        categoryName: 'Todas as Categorias (Ativas)',
        totalLessons,
        watchedLessons,
        totalHours: totalMinutes,
        watchedHours: watchedMinutes
      });
    } else {
      const categoryLessons = lessons.filter(lesson => lesson.category_id === categoryId);
      const category = categories.find(cat => cat.id === categoryId);
      
      if (category) {
        const totalLessons = categoryLessons.length;
        const watchedLessons = categoryLessons.filter(lesson => lesson.watched).length;
        const totalMinutes = categoryLessons.reduce((acc, lesson) => acc + lesson.duration_minutes, 0);
        const watchedMinutes = categoryLessons
          .filter(lesson => lesson.watched)
          .reduce((acc, lesson) => acc + lesson.duration_minutes, 0);

        setCategoryStats({
          categoryName: category.name,
          totalLessons,
          watchedLessons,
          totalHours: totalMinutes,
          watchedHours: watchedMinutes
        });
      }
    }
  }, [categories, lessons]);

  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    calculateCategoryStats(categoryId);
  }, [calculateCategoryStats]);

  useEffect(() => {
    if (lessons.length > 0) {
      calculateCategoryStats(selectedCategory);
    }
  }, [lessons, selectedCategory, calculateCategoryStats]);

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Faça login para ver suas estatísticas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas da Categoria Selecionada */}
      {categoryStats && (
        <CategoryStats
          categoryName={categoryStats.categoryName}
          totalLessons={categoryStats.totalLessons}
          watchedLessons={categoryStats.watchedLessons}
          totalHours={categoryStats.totalHours}
          watchedHours={categoryStats.watchedHours}
          filterComponent={
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias (Ativas)</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      )}
    </div>
  );
};

export default EstatisticasCategoriaUnica;
