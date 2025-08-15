
import { useState, useEffect } from 'react';
import { Brain, Plus, RotateCcw, Star, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Flashcard {
  id: string;
  pergunta: string;
  resposta: string;
  materia: string;
  dificuldade: 'facil' | 'medio' | 'dificil';
  revisoes: number;
  acertos: number;
  criadoEm: Date;
}

const Flashcards = () => {
  const { toast } = useToast();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [modoEstudo, setModoEstudo] = useState(false);
  const [cartaoAtual, setCartaoAtual] = useState(0);
  const [mostrarResposta, setMostrarResposta] = useState(false);
  const [novoCartao, setNovoCartao] = useState({
    pergunta: '',
    resposta: '',
    materia: '',
    dificuldade: 'medio' as const
  });
  const [filtroMateria, setFiltroMateria] = useState('todas');

  useEffect(() => {
    const saved = localStorage.getItem('cnuFlashcards');
    if (saved) {
      setFlashcards(JSON.parse(saved));
    }
  }, []);

  const salvarFlashcards = (cards: Flashcard[]) => {
    setFlashcards(cards);
    localStorage.setItem('cnuFlashcards', JSON.stringify(cards));
  };

  const adicionarCartao = () => {
    if (!novoCartao.pergunta || !novoCartao.resposta || !novoCartao.materia) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const novoFlashcard: Flashcard = {
      id: Date.now().toString(),
      ...novoCartao,
      revisoes: 0,
      acertos: 0,
      criadoEm: new Date()
    };

    salvarFlashcards([...flashcards, novoFlashcard]);
    setNovoCartao({ pergunta: '', resposta: '', materia: '', dificuldade: 'medio' });
    
    toast({
      title: "Flashcard criado!",
      description: "Novo cartão adicionado com sucesso"
    });
  };

  const iniciarEstudo = () => {
    const cardsFiltrados = filtroMateria === 'todas' 
      ? flashcards 
      : flashcards.filter(card => card.materia === filtroMateria);
    
    if (cardsFiltrados.length === 0) {
      toast({
        title: "Nenhum cartão encontrado",
        description: "Crie alguns flashcards primeiro"
      });
      return;
    }
    
    setModoEstudo(true);
    setCartaoAtual(0);
    setMostrarResposta(false);
  };

  const embaralharCards = () => {
    const cardsFiltrados = filtroMateria === 'todas' 
      ? [...flashcards] 
      : flashcards.filter(card => card.materia === filtroMateria);
    
    for (let i = cardsFiltrados.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardsFiltrados[i], cardsFiltrados[j]] = [cardsFiltrados[j], cardsFiltrados[i]];
    }
    
    setFlashcards([...cardsFiltrados, ...flashcards.filter(card => 
      filtroMateria !== 'todas' && card.materia !== filtroMateria
    )]);
    setCartaoAtual(0);
  };

  const marcarResposta = (acertou: boolean) => {
    const cardsFiltrados = filtroMateria === 'todas' 
      ? flashcards 
      : flashcards.filter(card => card.materia === filtroMateria);
    
    const cartao = cardsFiltrados[cartaoAtual];
    const cardsAtualizados = flashcards.map(card => 
      card.id === cartao.id 
        ? { 
            ...card, 
            revisoes: card.revisoes + 1,
            acertos: acertou ? card.acertos + 1 : card.acertos
          }
        : card
    );
    
    salvarFlashcards(cardsAtualizados);
    proximoCartao();
  };

  const proximoCartao = () => {
    const cardsFiltrados = filtroMateria === 'todas' 
      ? flashcards 
      : flashcards.filter(card => card.materia === filtroMateria);
    
    if (cartaoAtual < cardsFiltrados.length - 1) {
      setCartaoAtual(cartaoAtual + 1);
      setMostrarResposta(false);
    } else {
      setModoEstudo(false);
      toast({
        title: "Estudo concluído!",
        description: "Você revisou todos os flashcards"
      });
    }
  };

  const cartaoAnterior = () => {
    if (cartaoAtual > 0) {
      setCartaoAtual(cartaoAtual - 1);
      setMostrarResposta(false);
    }
  };

  const materias = [...new Set(flashcards.map(card => card.materia))];
  const cardsFiltrados = filtroMateria === 'todas' 
    ? flashcards 
    : flashcards.filter(card => card.materia === filtroMateria);

  if (modoEstudo) {
    const cartao = cardsFiltrados[cartaoAtual];
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Modo Estudo</h2>
          <Button onClick={() => setModoEstudo(false)} variant="outline">
            Sair do Estudo
          </Button>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Cartão {cartaoAtual + 1} de {cardsFiltrados.length}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${((cartaoAtual + 1) / cardsFiltrados.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 min-h-[400px] flex flex-col justify-center">
          <div className="text-center">
            <div className="mb-4">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {cartao.materia}
              </span>
            </div>
            
            <h3 className="text-xl font-semibold mb-6">
              {mostrarResposta ? 'Resposta:' : 'Pergunta:'}
            </h3>
            
            <div className="text-lg mb-8 min-h-[100px] flex items-center justify-center">
              {mostrarResposta ? cartao.resposta : cartao.pergunta}
            </div>

            {!mostrarResposta ? (
              <Button onClick={() => setMostrarResposta(true)} className="mb-4">
                <RotateCcw className="w-4 h-4 mr-2" />
                Mostrar Resposta
              </Button>
            ) : (
              <div className="space-x-4">
                <Button 
                  onClick={() => marcarResposta(false)} 
                  variant="destructive"
                >
                  Errei
                </Button>
                <Button 
                  onClick={() => marcarResposta(true)}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Acertei
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <Button 
            onClick={cartaoAnterior} 
            disabled={cartaoAtual === 0}
            variant="outline"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          
          <Button onClick={embaralharCards} variant="outline">
            <Shuffle className="w-4 h-4 mr-2" />
            Embaralhar
          </Button>
          
          <Button 
            onClick={proximoCartao}
            disabled={cartaoAtual === cardsFiltrados.length - 1}
          >
            Próximo
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Brain className="w-6 h-6 mr-2 text-blue-500" />
          Flashcards
        </h2>
        <div className="flex space-x-4">
          <select 
            value={filtroMateria} 
            onChange={(e) => setFiltroMateria(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="todas">Todas as Matérias</option>
            {materias.map(materia => (
              <option key={materia} value={materia}>{materia}</option>
            ))}
          </select>
          <Button onClick={iniciarEstudo} disabled={cardsFiltrados.length === 0}>
            Iniciar Estudo
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 text-center">
          <h3 className="text-2xl font-bold text-blue-600">{flashcards.length}</h3>
          <p className="text-gray-600">Total de Cards</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <h3 className="text-2xl font-bold text-green-600">{materias.length}</h3>
          <p className="text-gray-600">Matérias</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <h3 className="text-2xl font-bold text-purple-600">
            {Math.round(flashcards.reduce((acc, card) => acc + (card.revisoes > 0 ? (card.acertos / card.revisoes) * 100 : 0), 0) / flashcards.length) || 0}%
          </h3>
          <p className="text-gray-600">Taxa de Acerto</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <h3 className="text-2xl font-bold text-orange-600">
            {flashcards.reduce((acc, card) => acc + card.revisoes, 0)}
          </h3>
          <p className="text-gray-600">Total Revisões</p>
        </div>
      </div>

      {/* Formulário para novo cartão */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Criar Novo Flashcard
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="materia">Matéria</Label>
            <Input
              id="materia"
              value={novoCartao.materia}
              onChange={(e) => setNovoCartao({...novoCartao, materia: e.target.value})}
              placeholder="Ex: Direito Constitucional"
            />
          </div>
          
          <div>
            <Label htmlFor="dificuldade">Dificuldade</Label>
            <select 
              value={novoCartao.dificuldade}
              onChange={(e) => setNovoCartao({...novoCartao, dificuldade: e.target.value as any})}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="facil">Fácil</option>
              <option value="medio">Médio</option>
              <option value="dificil">Difícil</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="pergunta">Pergunta</Label>
          <Input
            id="pergunta"
            value={novoCartao.pergunta}
            onChange={(e) => setNovoCartao({...novoCartao, pergunta: e.target.value})}
            placeholder="Digite a pergunta do flashcard"
          />
        </div>

        <div className="mt-4">
          <Label htmlFor="resposta">Resposta</Label>
          <Input
            id="resposta"
            value={novoCartao.resposta}
            onChange={(e) => setNovoCartao({...novoCartao, resposta: e.target.value})}
            placeholder="Digite a resposta do flashcard"
          />
        </div>

        <Button onClick={adicionarCartao} className="mt-4">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Flashcard
        </Button>
      </div>

      {/* Lista de flashcards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cardsFiltrados.map((card) => (
          <div key={card.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                {card.materia}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
                card.dificuldade === 'facil' ? 'bg-green-100 text-green-800' :
                card.dificuldade === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {card.dificuldade}
              </span>
            </div>
            
            <h4 className="font-medium mb-2 line-clamp-2">{card.pergunta}</h4>
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{card.resposta}</p>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>Revisões: {card.revisoes}</span>
              <span>
                Taxa: {card.revisoes > 0 ? Math.round((card.acertos / card.revisoes) * 100) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Flashcards;
