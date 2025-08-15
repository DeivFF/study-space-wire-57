import { useState, useEffect } from 'react';
import { FileQuestion, Plus, CheckCircle, XCircle, Clock, BookOpen, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseQuestoes } from '@/hooks/useSupabaseQuestoes';
import { useSupabaseStats } from '@/hooks/useSupabaseStats';
import AnotacoesQuestao from './AnotacoesQuestao';
import HistoricoTentativas from './HistoricoTentativas';
import QuestoesFiltros from './QuestoesFiltros';

interface Questao {
  id: string;
  enunciado: string;
  alternativas: string[];
  resposta_correta: number;
  explicacao: string;
  materia: string;
  assunto: string;
  banca: string;
  ano: number;
  dificuldade: 'facil' | 'medio' | 'dificil';
  respondida: boolean;
  acertou?: boolean;
  tempo_resposta?: number;
  created_at: string;
}

interface FiltrosQuestoes {
  materia: string;
  status: string;
  busca: string;
}

const BancoQuestoes = () => {
  const { toast } = useToast();
  const { signOut } = useAuth();
  const { questoes, loading, adicionarQuestao, atualizarQuestao } = useSupabaseQuestoes();
  const { atualizarEstatisticas } = useSupabaseStats();

  const [questaoAtual, setQuestaoAtual] = useState<Questao | null>(null);
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosQuestoes>({
    materia: 'todas',
    status: 'todas',
    busca: ''
  });
  const [modoAdicionar, setModoAdicionar] = useState(false);
  const [novaQuestao, setNovaQuestao] = useState({
    enunciado: '',
    alternativas: ['', '', '', '', ''],
    resposta_correta: 0,
    explicacao: '',
    materia: '',
    assunto: '',
    banca: '',
    ano: new Date().getFullYear(),
    dificuldade: 'medio' as const
  });
  const [inicioTempo, setInicioTempo] = useState<Date | null>(null);

  const questoesFiltradas = questoes.filter(questao => {
    const matchMateria = filtros.materia === 'todas' || questao.materia === filtros.materia;
    const matchStatus = 
      filtros.status === 'todas' ||
      (filtros.status === 'respondidas' && questao.respondida) ||
      (filtros.status === 'nao-respondidas' && !questao.respondida) ||
      (filtros.status === 'acertadas' && questao.respondida && questao.acertou) ||
      (filtros.status === 'erradas' && questao.respondida && !questao.acertou);
    const matchBusca = filtros.busca === '' || 
      questao.enunciado.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      questao.assunto.toLowerCase().includes(filtros.busca.toLowerCase());
    
    return matchMateria && matchStatus && matchBusca;
  });

  const iniciarQuestao = (questao: Questao) => {
    setQuestaoAtual(questao);
    setRespostaSelecionada(null);
    setMostrarResultado(false);
    setInicioTempo(new Date());
  };

  const responderQuestao = async () => {
    if (respostaSelecionada === null || !questaoAtual || !inicioTempo) return;

    const tempoResposta = Math.floor((new Date().getTime() - inicioTempo.getTime()) / 1000);
    const acertou = respostaSelecionada === questaoAtual.resposta_correta;
    
    try {
      await atualizarQuestao(questaoAtual.id, {
        respondida: true,
        acertou,
        tempo_resposta: tempoResposta
      });

      await atualizarEstatisticas({
        questoes_resolvidas: 1,
        questoes_corretas: acertou ? 1 : 0
      });

      setMostrarResultado(true);

      toast({
        title: acertou ? "Parabéns! ✅" : "Ops! ❌",
        description: acertou ? "Resposta correta!" : "Continue estudando!"
      });
    } catch (error) {
      console.error('Erro ao responder questão:', error);
    }
  };

  const adicionarNovaQuestao = async () => {
    if (!novaQuestao.enunciado || !novaQuestao.materia || novaQuestao.alternativas.some(alt => !alt)) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      await adicionarQuestao(novaQuestao);
      setNovaQuestao({
        enunciado: '',
        alternativas: ['', '', '', '', ''],
        resposta_correta: 0,
        explicacao: '',
        materia: '',
        assunto: '',
        banca: '',
        ano: new Date().getFullYear(),
        dificuldade: 'medio'
      });
      setModoAdicionar(false);
    } catch (error) {
      console.error('Erro ao adicionar questão:', error);
    }
  };

  const limparFiltros = () => {
    setFiltros({
      materia: 'todas',
      status: 'todas',
      busca: ''
    });
  };

  const materias = [...new Set(questoes.map(q => q.materia))];
  const bancas = [...new Set(questoes.map(q => q.banca))];
  const totalQuestoes = questoes.length;
  const questoesRespondidas = questoes.filter(q => q.respondida).length;
  const questoesCorretas = questoes.filter(q => q.acertou).length;
  const taxaAcerto = questoesRespondidas > 0 ? Math.round((questoesCorretas / questoesRespondidas) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (questaoAtual && !mostrarResultado) {
    const getDifficultyClass = (dificuldade: string) => {
      switch (dificuldade) {
        case 'facil':
          return 'bg-green-100 text-green-800';
        case 'medio':
          return 'bg-yellow-100 text-yellow-800';
        case 'dificil':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Resolvendo Questão</h2>
          <div className="flex space-x-2">
            <Button onClick={() => setQuestaoAtual(null)} variant="outline">
              Voltar ao Banco
            </Button>
            <Button onClick={signOut} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-4 text-sm text-gray-600">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{questaoAtual.materia}</span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">{questaoAtual.banca}</span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">{questaoAtual.ano}</span>
              <span className={`px-2 py-1 rounded text-xs ${getDifficultyClass(questaoAtual.dificuldade)}`}>
                {questaoAtual.dificuldade}
              </span>
            </div>
            {inicioTempo && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                {Math.floor((new Date().getTime() - inicioTempo.getTime()) / 1000)}s
              </div>
            )}
          </div>

          <h3 className="text-lg font-medium mb-6">{questaoAtual.enunciado}</h3>

          <div className="space-y-3 mb-6">
            {questaoAtual.alternativas.map((alternativa, index) => (
              <button
                key={index}
                onClick={() => setRespostaSelecionada(index)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  respostaSelecionada === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium mr-3">
                  {String.fromCharCode(65 + index)})
                </span>
                {alternativa}
              </button>
            ))}
          </div>

          <Button 
            onClick={responderQuestao} 
            disabled={respostaSelecionada === null}
            className="w-full"
          >
            Confirmar Resposta
          </Button>
        </div>
      </div>
    );
  }

  if (questaoAtual && mostrarResultado) {
    const acertou = respostaSelecionada === questaoAtual.resposta_correta;
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Resultado</h2>
          <div className="flex space-x-2">
            <Button onClick={() => setQuestaoAtual(null)} variant="outline">
              Voltar ao Banco
            </Button>
            <Button onClick={signOut} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className={`text-center mb-6 p-4 rounded-lg ${
            acertou ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {acertou ? (
              <CheckCircle className="w-12 h-12 mx-auto mb-2" />
            ) : (
              <XCircle className="w-12 h-12 mx-auto mb-2" />
            )}
            <h3 className="text-xl font-bold">
              {acertou ? 'Parabéns! Resposta Correta!' : 'Resposta Incorreta'}
            </h3>
          </div>

          <div className="mb-6">
            <h4 className="font-medium mb-2">Sua resposta:</h4>
            <p className={`p-3 rounded ${acertou ? 'bg-green-100' : 'bg-red-100'}`}>
              {String.fromCharCode(65 + (respostaSelecionada || 0))}) {questaoAtual.alternativas[respostaSelecionada || 0]}
            </p>
          </div>

          {!acertou && (
            <div className="mb-6">
              <h4 className="font-medium mb-2">Resposta correta:</h4>
              <p className="p-3 rounded bg-green-100">
                {String.fromCharCode(65 + questaoAtual.resposta_correta)}) {questaoAtual.alternativas[questaoAtual.resposta_correta]}
              </p>
            </div>
          )}

          {questaoAtual.explicacao && (
            <div className="mb-6">
              <h4 className="font-medium mb-2">Explicação:</h4>
              <p className="p-3 rounded bg-gray-50 text-gray-700">
                {questaoAtual.explicacao}
              </p>
            </div>
          )}

          <AnotacoesQuestao questaoId={questaoAtual.id} />
          <HistoricoTentativas questaoId={questaoAtual.id} />

          <div className="flex space-x-4 mt-6">
            <Button onClick={() => setQuestaoAtual(null)}>
              Voltar ao Banco
            </Button>
            <Button 
              onClick={() => {
                const proximaQuestao = questoesFiltradas.find(q => !q.respondida && q.id !== questaoAtual.id);
                if (proximaQuestao) {
                  iniciarQuestao(proximaQuestao);
                } else {
                  setQuestaoAtual(null);
                  toast({
                    title: "Parabéns!",
                    description: "Você completou todas as questões disponíveis!"
                  });
                }
              }}
              variant="outline"
            >
              Próxima Questão
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <FileQuestion className="w-6 h-6 mr-2 text-blue-500" />
          Banco de Questões
        </h2>
        <div className="flex space-x-2">
          <Button onClick={() => setModoAdicionar(!modoAdicionar)}>
            <Plus className="w-4 h-4 mr-2" />
            {modoAdicionar ? 'Cancelar' : 'Nova Questão'}
          </Button>
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 text-center">
          <h3 className="text-2xl font-bold text-blue-600">{totalQuestoes}</h3>
          <p className="text-gray-600">Total de Questões</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <h3 className="text-2xl font-bold text-green-600">{questoesRespondidas}</h3>
          <p className="text-gray-600">Respondidas</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <h3 className="text-2xl font-bold text-purple-600">{taxaAcerto}%</h3>
          <p className="text-gray-600">Taxa de Acerto</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <h3 className="text-2xl font-bold text-orange-600">{totalQuestoes - questoesRespondidas}</h3>
          <p className="text-gray-600">Restantes</p>
        </div>
      </div>

      <QuestoesFiltros
        filtros={filtros}
        setFiltros={setFiltros}
        materias={materias}
        onLimpar={limparFiltros}
      />

      {/* Formulário para nova questão */}
      {modoAdicionar && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Adicionar Nova Questão</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="nova-materia">Matéria</Label>
              <Input
                id="nova-materia"
                value={novaQuestao.materia}
                onChange={(e) => setNovaQuestao({...novaQuestao, materia: e.target.value})}
                placeholder="Ex: Direito Constitucional"
              />
            </div>
            <div>
              <Label htmlFor="assunto">Assunto</Label>
              <Input
                id="assunto"
                value={novaQuestao.assunto}
                onChange={(e) => setNovaQuestao({...novaQuestao, assunto: e.target.value})}
                placeholder="Ex: Direitos Fundamentais"
              />
            </div>
            <div>
              <Label htmlFor="banca">Banca</Label>
              <Input
                id="banca"
                value={novaQuestao.banca}
                onChange={(e) => setNovaQuestao({...novaQuestao, banca: e.target.value})}
                placeholder="Ex: CESPE"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="ano">Ano</Label>
              <Input
                id="ano"
                type="number"
                value={novaQuestao.ano}
                onChange={(e) => setNovaQuestao({...novaQuestao, ano: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="nova-dificuldade">Dificuldade</Label>
              <select
                value={novaQuestao.dificuldade}
                onChange={(e) => setNovaQuestao({...novaQuestao, dificuldade: e.target.value as any})}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="facil">Fácil</option>
                <option value="medio">Médio</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <Label htmlFor="enunciado">Enunciado</Label>
            <textarea
              id="enunciado"
              value={novaQuestao.enunciado}
              onChange={(e) => setNovaQuestao({...novaQuestao, enunciado: e.target.value})}
              placeholder="Digite o enunciado da questão"
              className="w-full border rounded-lg px-3 py-2 h-24"
            />
          </div>

          <div className="mb-4">
            <Label>Alternativas</Label>
            {novaQuestao.alternativas.map((alt, index) => (
              <div key={index} className="flex items-center space-x-2 mt-2">
                <input
                  type="radio"
                  name="resposta-correta"
                  checked={novaQuestao.resposta_correta === index}
                  onChange={() => setNovaQuestao({...novaQuestao, resposta_correta: index})}
                />
                <span className="font-medium">{String.fromCharCode(65 + index)})</span>
                <Input
                  value={alt}
                  onChange={(e) => {
                    const newAlts = [...novaQuestao.alternativas];
                    newAlts[index] = e.target.value;
                    setNovaQuestao({...novaQuestao, alternativas: newAlts});
                  }}
                  placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                />
              </div>
            ))}
          </div>

          <div className="mb-4">
            <Label htmlFor="explicacao">Explicação</Label>
            <textarea
              id="explicacao"
              value={novaQuestao.explicacao}
              onChange={(e) => setNovaQuestao({...novaQuestao, explicacao: e.target.value})}
              placeholder="Explicação da resposta (opcional)"
              className="w-full border rounded-lg px-3 py-2 h-20"
            />
          </div>

          <div className="flex space-x-4">
            <Button onClick={adicionarNovaQuestao}>Adicionar Questão</Button>
            <Button onClick={() => setModoAdicionar(false)} variant="outline">Cancelar</Button>
          </div>
        </div>
      )}

      {/* Lista de questões */}
      <div className="grid grid-cols-1 gap-4">
        {questoesFiltradas.map((questao) => {
          const getDifficultyClass = (dificuldade: string) => {
            switch (dificuldade) {
              case 'facil':
                return 'bg-green-100 text-green-800';
              case 'medio':
                return 'bg-yellow-100 text-yellow-800';
              case 'dificil':
                return 'bg-red-100 text-red-800';
              default:
                return 'bg-gray-100 text-gray-800';
            }
          };

          return (
            <div key={questao.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {questao.materia}
                  </span>
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                    {questao.banca} - {questao.ano}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${getDifficultyClass(questao.dificuldade)}`}>
                    {questao.dificuldade}
                  </span>
                  {questao.respondida && (
                    <span className={`px-2 py-1 rounded text-xs ${
                      questao.acertou ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {questao.acertou ? 'Acertou' : 'Errou'}
                    </span>
                  )}
                </div>
              </div>
              
              <h4 className="font-medium mb-3 line-clamp-2">{questao.enunciado}</h4>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Assunto: {questao.assunto}</span>
                  {questao.tempo_resposta && (
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {questao.tempo_resposta}s
                    </span>
                  )}
                </div>
                
                <Button 
                  onClick={() => iniciarQuestao(questao)}
                  size="sm"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  {questao.respondida ? 'Revisar' : 'Resolver'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {questoesFiltradas.length === 0 && (
        <div className="text-center py-12">
          <FileQuestion className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Nenhuma questão encontrada
          </h3>
          <p className="text-gray-500">
            Tente ajustar os filtros ou adicione novas questões
          </p>
        </div>
      )}
    </div>
  );
};

export default BancoQuestoes;
