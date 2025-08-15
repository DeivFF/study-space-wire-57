
import { useState } from 'react';
import { Plus, BookOpen, Trash2, Upload, ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupabaseLessons } from '@/hooks/useSupabaseLessons';
import { LessonEditModal } from './LessonEditModal';
import { BulkLessonForm } from './BulkLessonForm';

interface GerenciarVideosProps {
  onClose: () => void;
}

const GerenciarVideos = ({ onClose }: GerenciarVideosProps) => {
  const { 
    categories, 
    lessons, 
    loading, 
    criarCategoria, 
    criarAula,
    criarAulasEmLote,
    editarAula,
    excluirAula,
    excluirCategoria,
    obterEstatisticas 
  } = useSupabaseLessons();

  const [novaCategoria, setNovaCategoria] = useState('');
  const [novaAula, setNovaAula] = useState({
    nome: '',
    duracao: 60,
    categoria: ''
  });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [selectedCategoryForBulk, setSelectedCategoryForBulk] = useState('');

  const stats = obterEstatisticas();

  const handleAdicionarCategoria = async () => {
    if (!novaCategoria.trim()) return;
    
    const resultado = await criarCategoria(novaCategoria.trim());
    if (resultado) {
      setNovaCategoria('');
      setShowAddCategory(false);
    }
  };

  const handleAdicionarAula = async () => {
    if (!novaAula.nome.trim() || !novaAula.categoria || novaAula.duracao <= 0) return;
    
    const resultado = await criarAula(novaAula.categoria, novaAula.nome.trim(), novaAula.duracao);
    if (resultado) {
      setNovaAula({ nome: '', duracao: 60, categoria: '' });
      setShowAddLesson(false);
    }
  };

  const handleBulkSubmit = async (lessonsData: { name: string; duration_minutes: number }[]) => {
    if (!selectedCategoryForBulk) return;
    
    const success = await criarAulasEmLote(selectedCategoryForBulk, lessonsData);
    if (success) {
      setShowBulkForm(false);
      setSelectedCategoryForBulk('');
    }
  };

  const handleEditarAula = async (lessonId: string, name: string, duration: number) => {
    console.log('Editando aula:', lessonId, name, duration);
    return await editarAula(lessonId, name, duration);
  };

  const handleExcluirAula = async (lessonId: string, lessonName: string) => {
    console.log('Tentando excluir aula:', lessonId, lessonName);
    if (window.confirm(`Tem certeza que deseja excluir a aula "${lessonName}"?`)) {
      await excluirAula(lessonId);
    }
  };

  const handleExcluirCategoria = async (categoryId: string, categoryName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a categoria "${categoryName}" e todas as suas aulas?`)) {
      await excluirCategoria(categoryId);
    }
  };

  const handleOpenBulkForm = () => {
    if (categories.length === 0) {
      alert('Você precisa criar pelo menos uma categoria antes de adicionar aulas em lote.');
      return;
    }
    setShowBulkForm(true);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={onClose} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-blue-500" />
            Gerenciar Aulas
          </h2>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setShowAddCategory(true)}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Categoria
          </Button>
          <Button onClick={() => setShowAddLesson(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Aula
          </Button>
          <Button onClick={handleOpenBulkForm} variant="secondary">
            <Upload className="w-4 h-4 mr-2" />
            Lote (JSON)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Aulas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAulas}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aulas Assistidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.aulasAssistidas}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.percentualProgresso}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.tempoTotalHoras}h {stats.tempoTotalMinutos}m
            </div>
          </CardContent>
        </Card>
      </div>

      {showAddCategory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Adicionar Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nova-categoria">Nome da Categoria</Label>
              <Input
                id="nova-categoria"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                placeholder="Ex: Direito Constitucional"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAdicionarCategoria} disabled={!novaCategoria.trim()}>
                Adicionar
              </Button>
              <Button onClick={() => setShowAddCategory(false)} variant="outline">
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showAddLesson && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Adicionar Aula</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="categoria-aula">Categoria</Label>
              <Select value={novaAula.categoria} onValueChange={(value) => setNovaAula({...novaAula, categoria: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(categoria => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="nome-aula">Nome da Aula</Label>
              <Input
                id="nome-aula"
                value={novaAula.nome}
                onChange={(e) => setNovaAula({...novaAula, nome: e.target.value})}
                placeholder="Ex: 1 - Introdução aos Direitos Fundamentais"
              />
            </div>
            
            <div>
              <Label htmlFor="duracao-aula">Duração (minutos)</Label>
              <Input
                id="duracao-aula"
                type="number"
                min="1"
                value={novaAula.duracao}
                onChange={(e) => setNovaAula({...novaAula, duracao: parseInt(e.target.value) || 0})}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleAdicionarAula} 
                disabled={!novaAula.nome.trim() || !novaAula.categoria || novaAula.duracao <= 0}
              >
                Adicionar
              </Button>
              <Button onClick={() => setShowAddLesson(false)} variant="outline">
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {categories.map(categoria => {
          const aulasCategoria = lessons.filter(aula => aula.category_id === categoria.id);
          console.log(`Categoria ${categoria.name}: ${aulasCategoria.length} aulas`);
          
          return (
            <Card key={categoria.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    {categoria.name}
                    <Badge variant="secondary" className="ml-2">
                      {aulasCategoria.length} aulas
                    </Badge>
                  </CardTitle>
                  <Button
                    onClick={() => handleExcluirCategoria(categoria.id, categoria.name)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aulasCategoria.map(aula => {
                    console.log('Renderizando aula:', aula.name, aula.id);
                    return (
                      <div key={aula.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">{aula.name}</h4>
                            <div className="flex items-center text-sm text-gray-600 space-x-4">
                              <span>⏱️ {aula.duration_minutes} minutos</span>
                              {aula.watched && <span className="text-green-600 font-medium">✅ Assistida</span>}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                            <Button
                              onClick={() => {
                                console.log('Clicou em editar aula:', aula.id);
                                setEditingLesson(aula);
                              }}
                              variant="outline"
                              size="sm"
                              className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                              title="Editar aula"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => {
                                console.log('Clicou em excluir aula:', aula.id);
                                handleExcluirAula(aula.id, aula.name);
                              }}
                              variant="outline"
                              size="sm"
                              className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                              title="Excluir aula"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {aulasCategoria.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nenhuma aula nesta categoria</p>
                      <p className="text-sm text-gray-400">Clique em "Aula" ou "Lote (JSON)" para adicionar</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <LessonEditModal
        lesson={editingLesson}
        isOpen={!!editingLesson}
        onClose={() => setEditingLesson(null)}
        onSave={handleEditarAula}
      />

      {showBulkForm && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selecionar Categoria para Lote</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCategoryForBulk} onValueChange={setSelectedCategoryForBulk}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(categoria => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <BulkLessonForm
            isOpen={showBulkForm && !!selectedCategoryForBulk}
            onClose={() => {
              setShowBulkForm(false);
              setSelectedCategoryForBulk('');
            }}
            onSubmit={handleBulkSubmit}
            categoryId={selectedCategoryForBulk}
          />
        </div>
      )}
    </div>
  );
};

export default GerenciarVideos;
