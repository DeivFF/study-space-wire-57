import { useState, useCallback, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, Filter, FolderOpen, FileText, Brain, NotebookPen } from 'lucide-react';
import { LessonCategory, Lesson } from '@/types/lessons';

interface SelectiveContentPickerProps {
  categories: LessonCategory[];
  lessons: Lesson[];
  onSelectionChange: (items: Array<{ type: string; id: string; data: any }>) => void;
  selectedItems: Array<{ type: string; id: string; data: any }>;
}

export const SelectiveContentPicker = ({ 
  categories, 
  lessons, 
  onSelectionChange, 
  selectedItems 
}: SelectiveContentPickerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>(['category', 'lesson']);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Filter content based on search term and selected types
  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      if (!selectedContentTypes.includes('category')) return false;
      if (searchTerm && !category.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [categories, searchTerm, selectedContentTypes]);

  const filteredLessons = useMemo(() => {
    return lessons.filter(lesson => {
      if (!selectedContentTypes.includes('lesson')) return false;
      if (searchTerm && !lesson.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [lessons, searchTerm, selectedContentTypes]);

  // Check if item is selected
  const isItemSelected = useCallback((type: string, id: string) => {
    return selectedItems.some(item => item.type === type && item.id === id);
  }, [selectedItems]);

  // Toggle item selection
  const toggleItemSelection = useCallback((type: string, id: string, data: any) => {
    const isSelected = isItemSelected(type, id);
    
    if (isSelected) {
      // Remove item and related items
      let newItems = selectedItems.filter(item => !(item.type === type && item.id === id));
      
      // If removing a category, also remove its lessons
      if (type === 'category') {
        newItems = newItems.filter(item => 
          !(item.type === 'lesson' && item.data.category_id === id)
        );
      }
      
      onSelectionChange(newItems);
    } else {
      // Add item
      const newItem = { type, id, data };
      let newItems = [...selectedItems, newItem];
      
      // If adding a category, also add its lessons
      if (type === 'category') {
        const categoryLessons = lessons
          .filter(lesson => lesson.category_id === id)
          .map(lesson => ({ type: 'lesson', id: lesson.id, data: lesson }));
        newItems = [...newItems, ...categoryLessons];
      }
      
      onSelectionChange(newItems);
    }
  }, [selectedItems, lessons, onSelectionChange, isItemSelected]);

  // Toggle category expansion
  const toggleCategoryExpansion = useCallback((categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  }, [expandedCategories]);

  // Toggle content type filter
  const toggleContentType = useCallback((type: string) => {
    setSelectedContentTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  // Count selected items by type
  const selectionCounts = useMemo(() => {
    const counts = { category: 0, lesson: 0, total: 0 };
    selectedItems.forEach(item => {
      if (item.type === 'category') counts.category++;
      if (item.type === 'lesson') counts.lesson++;
      counts.total++;
    });
    return counts;
  }, [selectedItems]);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categorias e aulas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Tipos:</span>
          {[
            { type: 'category', label: 'Categorias', icon: FolderOpen },
            { type: 'lesson', label: 'Aulas', icon: FileText }
          ].map(({ type, label, icon: Icon }) => (
            <Badge
              key={type}
              variant={selectedContentTypes.includes(type) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleContentType(type)}
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Content List */}
      <ScrollArea className="h-96">
        <div className="space-y-3">
          {/* Categories */}
          {filteredCategories.map(category => {
            const isSelected = isItemSelected('category', category.id);
            const categoryLessons = lessons.filter(lesson => lesson.category_id === category.id);
            const isExpanded = expandedCategories.has(category.id);
            
            return (
              <Card key={category.id} className={isSelected ? 'border-primary' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleItemSelection('category', category.id, category)}
                      />
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{category.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {categoryLessons.length} aulas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSelected && <Badge variant="default">Selecionado</Badge>}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCategoryExpansion(category.id)}
                      >
                        {isExpanded ? 'Ocultar' : 'Mostrar'} Aulas
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && categoryLessons.length > 0 && (
                  <CardContent className="pt-0">
                    <Separator className="mb-3" />
                    <div className="space-y-2">
                      {categoryLessons.map(lesson => {
                        const lessonSelected = isItemSelected('lesson', lesson.id);
                        return (
                          <div key={lesson.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                            <Checkbox
                              checked={lessonSelected}
                              onCheckedChange={() => toggleItemSelection('lesson', lesson.id, lesson)}
                              disabled={isSelected} // Disable if parent category is selected
                            />
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm">{lesson.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {lesson.duration_minutes} min
                                {lesson.watched && ' • Assistida'}
                              </p>
                            </div>
                            {lessonSelected && !isSelected && (
                              <Badge variant="outline">Selecionado</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* Standalone Lessons (not in selected categories) */}
          {selectedContentTypes.includes('lesson') && (
            <div className="space-y-2">
              {filteredLessons
                .filter(lesson => !isItemSelected('category', lesson.category_id))
                .map(lesson => {
                  const isSelected = isItemSelected('lesson', lesson.id);
                  const category = categories.find(c => c.id === lesson.category_id);
                  
                  return (
                    <Card key={lesson.id} className={isSelected ? 'border-primary' : ''}>
                      <CardContent className="pt-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleItemSelection('lesson', lesson.id, lesson)}
                          />
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <h4 className="font-medium">{lesson.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {category?.name} • {lesson.duration_minutes} min
                              {lesson.watched && ' • Assistida'}
                            </p>
                          </div>
                          {isSelected && <Badge variant="default">Selecionado</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};