import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Upload } from 'lucide-react';
import { useSupabaseLessons } from '@/hooks/useSupabaseLessons';
import { useToast } from '@/hooks/use-toast';

interface AulasUploadModalProps {
  onUploadSuccess?: () => void;
}

const AulasUploadModal = ({ onUploadSuccess }: AulasUploadModalProps) => {
  const { categories, criarAula, atualizarWebsiteUrl } = useSupabaseLessons();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [lessonName, setLessonName] = useState('');
  const [duration, setDuration] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lessonName.trim() || !duration || !videoUrl.trim() || !selectedCategory) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para adicionar a aula",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Criar a aula
      const lesson = await criarAula(selectedCategory, lessonName.trim(), parseInt(duration));
      
      if (lesson) {
        // Atualizar com a URL do vídeo
        const success = await atualizarWebsiteUrl(lesson.id, videoUrl.trim());
        
        if (success) {
          toast({
            title: "Aula adicionada!",
            description: "A aula foi criada com sucesso e está pronta para assistir"
          });
          
          // Resetar formulário
          setLessonName('');
          setDuration('');
          setVideoUrl('');
          setSelectedCategory('');
          setIsOpen(false);
          
          if (onUploadSuccess) {
            onUploadSuccess();
          }
        }
      }
    } catch (error) {
      console.error('Erro ao criar aula:', error);
      toast({
        title: "Erro ao criar aula",
        description: "Não foi possível criar a aula. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url: string) => {
    // Extrair ID do Google Drive
    const driveMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (driveMatch) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
    
    // Outros formatos de URL podem ser adicionados aqui
    return url;
  };

  const handleUrlChange = (url: string) => {
    setVideoUrl(extractVideoId(url));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Aula
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Adicionar Nova Aula
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome da Aula</Label>
            <Input
              id="name"
              value={lessonName}
              onChange={(e) => setLessonName(e.target.value)}
              placeholder="Ex: Aula 01 - Introdução"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duração (minutos)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Ex: 60"
              min="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">URL do Vídeo</Label>
            <Input
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Cole a URL do Google Drive ou outro serviço"
              required
            />
            <p className="text-xs text-gray-500">
              Suporte para Google Drive, YouTube, Vimeo e outros serviços de vídeo
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adicionando...' : 'Adicionar Aula'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AulasUploadModal;