import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: { id: string; name: string } | null;
  onSave: (categoryId: string, newName: string) => Promise<void>;
}

const CategoryEditModal = ({ isOpen, onClose, category, onSave }: CategoryEditModalProps) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
    }
  }, [category]);

  const handleSave = async () => {
    if (!category || !name.trim()) return;

    setLoading(true);
    try {
      await onSave(category.id, name.trim());
      onClose();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Categoria</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="categoryName">Nome da Categoria</Label>
            <Input
              id="categoryName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!name.trim() || loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryEditModal;