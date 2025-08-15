
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface VideosCategoryFormProps {
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  showCreateCategory: boolean;
  setShowCreateCategory: (show: boolean) => void;
  onCreateCategory: () => Promise<void>;
}

const VideosCategoryForm = ({
  newCategoryName,
  setNewCategoryName,
  showCreateCategory,
  setShowCreateCategory,
  onCreateCategory
}: VideosCategoryFormProps) => {
  return (
    <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Categoria</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="categoryName">Nome da Categoria</Label>
            <Input
              id="categoryName"
              placeholder="Ex: Matemática, Português, etc."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onCreateCategory()}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCreateCategory(false)}>
              Cancelar
            </Button>
            <Button onClick={onCreateCategory} disabled={!newCategoryName.trim()}>
              Criar Categoria
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideosCategoryForm;
