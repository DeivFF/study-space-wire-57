import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Eye, Pencil, Copy, Save, X, Sparkles, StickyNote, Layers, MoreVertical } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { FlashcardPreview } from './FlashcardPreview';
import { useFlashcards } from '@/hooks/useFlashcards';
import { FlashcardMigration } from './FlashcardMigration';

interface FlashcardManagerProps {
  lessonId: string;
}

const FlashcardManager: React.FC<FlashcardManagerProps> = ({ lessonId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [currentCard, setCurrentCard] = useState<any>(null);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [showMigration, setShowMigration] = useState(true);

  const {
    allCards,
    createCard,
    updateCard,
    deleteCard,
    isCreating,
    isUpdating,
    isDeleting,
  } = useFlashcards(lessonId);

  // Close modal when creation/update is successful
  const [wasCreating, setWasCreating] = useState(false);
  const [wasUpdating, setWasUpdating] = useState(false);

  useEffect(() => {
    // Track when operations start
    if (isCreating && !wasCreating) {
      setWasCreating(true);
    }
    if (isUpdating && !wasUpdating) {
      setWasUpdating(true);
    }
    
    // Close modal when operations complete
    if (wasCreating && !isCreating) {
      setEditModal(false);
      setEditingCard(null);
      setWasCreating(false);
    }
    if (wasUpdating && !isUpdating) {
      setEditModal(false);
      setEditingCard(null);
      setWasUpdating(false);
    }
  }, [isCreating, isUpdating, wasCreating, wasUpdating]);

  const filteredCards = allCards.filter(card => {
    const text = [card.front_content, card.back_content, ...card.tags].join(' ').toLowerCase();
    const matchesSearch = !searchTerm || text.includes(searchTerm.toLowerCase());
    const matchesTag = !filterTag || card.tags.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase()));
    const matchesTipo = filterTipo === 'all' || (card as any).tipo === filterTipo;
    return matchesSearch && matchesTag && matchesTipo;
  });

  const handleNewCard = () => {
    setEditingCard({
      id: '',
      front_content: '',
      back_content: '',
      tags: [],
      tipo: 'conceito'
    });
    setEditModal(true);
  };

  const handleEditCard = (card: any) => {
    setEditingCard({ ...card });
    setEditModal(true);
  };

  const handleViewCard = (card: any) => {
    setCurrentCard(card);
    setViewModal(true);
  };

  const handleSaveCard = () => {
    if (!editingCard || !editingCard.front_content.trim()) {
      alert('Informe a pergunta.');
      return;
    }

    const cardData = {
      front_content: editingCard.front_content,
      back_content: editingCard.back_content,
      tags: Array.isArray(editingCard.tags) 
        ? editingCard.tags 
        : (typeof editingCard.tags === 'string' && editingCard.tags.trim()) 
          ? editingCard.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          : []
    };

    if (editingCard.id) {
      updateCard({ cardId: editingCard.id, data: cardData });
    } else {
      createCard(cardData);
    }
  };

  const handleDeleteCard = (cardId: string) => {
    deleteCard(cardId);
  };

  const handleCloneCard = (card: any) => {
    const clonedData = {
      front_content: `${card.front_content} (cópia)`,
      back_content: card.back_content,
      tags: card.tags || []
    };
    createCard(clonedData);
  };

  const handleBulkDelete = () => {
    if (selectedCards.size === 0) {
      alert('Nenhum card selecionado.');
      return;
    }
    selectedCards.forEach(cardId => {
      deleteCard(cardId);
    });
    setSelectedCards(new Set());
  };

  const mdLite = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  };

  return (
    <div className="space-y-4">
      {/* Migration Component */}
      {showMigration && (
        <FlashcardMigration 
          lessonId={lessonId} 
          onComplete={() => setShowMigration(false)} 
        />
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleNewCard} className="bg-app-accent text-white hover:bg-app-accent/90">
          <Plus className="w-4 h-4" />
          Novo card
        </Button>
        <Input
          placeholder="Buscar pergunta, tags, referência…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[220px] bg-app-bg border-app-border text-app-text"
        />
        <Input
          placeholder="Filtrar por tag"
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="bg-app-bg border-app-border text-app-text w-32"
        />
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-40 bg-app-bg border-app-border text-app-text">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tipo: Todos</SelectItem>
            <SelectItem value="conceito">Conceito</SelectItem>
            <SelectItem value="definição">Definição</SelectItem>
            <SelectItem value="caso">Caso</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleBulkDelete} variant="outline" className="border-app-border text-app-text hover:bg-app-muted">
          <Trash2 className="w-4 h-4" />
          Excluir selecionados
        </Button>
      </div>

      {/* Cards Table */}
      <div className="border border-app-border rounded-xl overflow-hidden">
        <div className="flex items-center px-3 py-2.5 text-xs text-app-text-muted border-b border-app-border bg-app-muted">
          <div className="w-10 text-center">
            <Checkbox
              checked={selectedCards.size === filteredCards.length && filteredCards.length > 0}
              onCheckedChange={(checked) => {
                setSelectedCards(checked ? new Set(filteredCards.map(c => c.id)) : new Set());
              }}
            />
          </div>
          <div className="flex-1 min-w-0">Pergunta</div>
          <div className="w-32 text-center">Ações</div>
        </div>
        
        {filteredCards.map(card => (
          <div key={card.id} className="flex items-center px-3 py-2.5 border-b border-app-border hover:bg-app-muted">
            <div className="w-10 text-center">
              <Checkbox
                checked={selectedCards.has(card.id)}
                onCheckedChange={(checked) => {
                  const newSelected = new Set(selectedCards);
                  if (checked) {
                    newSelected.add(card.id);
                  } else {
                    newSelected.delete(card.id);
                  }
                  setSelectedCards(newSelected);
                }}
              />
            </div>
            <div className="flex-1 min-w-0 pr-3">
              <div className="font-semibold text-app-text truncate" dangerouslySetInnerHTML={{ __html: mdLite(card.front_content) }} />
              <div className="text-xs text-app-text-muted truncate">{card.tags.join(', ')}</div>
            </div>
            <div className="w-[140px] flex justify-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-app-text border-app-border hover:bg-app-muted p-2"
                onClick={() => handleViewCard(card)} 
                title="Ver"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-app-text border-app-border hover:bg-app-muted p-2"
                onClick={() => handleEditCard(card)} 
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-app-text border-app-border hover:bg-app-muted p-2"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleCloneCard(card)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteCard(card.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {/* View Modal */}
      <Dialog open={viewModal} onOpenChange={setViewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Visualizar card
            </DialogTitle>
          </DialogHeader>
          
          {currentCard && (
            <FlashcardPreview 
              card={currentCard}
              showExportButton={false}
              showMetadata={true}
              showRating={false}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              {editingCard?.id ? 'Editar card' : 'Novo card'}
            </DialogTitle>
          </DialogHeader>
          
          {editingCard && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm text-app-text-muted">Pergunta</label>
                  <Textarea
                    value={editingCard.front_content}
                    onChange={(e) => setEditingCard({...editingCard, front_content: e.target.value})}
                    className="bg-app-bg border-app-border text-app-text"
                    placeholder="Digite o enunciado do card…"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm text-app-text-muted">Resposta</label>
                  <Textarea
                    value={editingCard.back_content}
                    onChange={(e) => setEditingCard({...editingCard, back_content: e.target.value})}
                    className="bg-app-bg border-app-border text-app-text"
                    placeholder="Digite a resposta do card…"
                    rows={4}
                  />
                </div>
                
                <div>
                  <label className="text-sm text-app-text-muted">Tags (separadas por vírgula)</label>
                  <Input
                    value={Array.isArray(editingCard.tags) ? editingCard.tags.join(', ') : editingCard.tags}
                    onChange={(e) => setEditingCard({...editingCard, tags: e.target.value})}
                    className="bg-app-bg border-app-border text-app-text"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                {editingCard.id && (
                  <Button variant="outline" onClick={() => handleDeleteCard(editingCard.id)}>
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button onClick={handleSaveCard} className="bg-app-accent text-white hover:bg-app-accent/90" disabled={isCreating || isUpdating}>
                    <Save className="w-4 h-4" />
                    {isCreating || isUpdating ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlashcardManager;