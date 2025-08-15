
import { useState, useEffect } from 'react';
import { Target, Calendar, TrendingUp, CheckCircle, Plus, Edit, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Meta {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'questoes' | 'tempo' | 'acertos';
  valorMeta: number;
  valorAtual: number;
  prazo: string;
  prioridade: 'alta' | 'media' | 'baixa';
  concluida: boolean;
  criadaEm: string;
}

const MetasInteligentes = () => {
  const { toast } = useToast();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [novaMeta, setNovaMeta] = useState({
    titulo: '',
    descricao: '',
    tipo: 'questoes' as const,
    valorMeta: 0,
    prazo: '',
    prioridade: 'media' as const
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    const metasSalvas = localStorage.getItem('cnuMetas');
    if (metasSalvas) {
      setMetas(JSON.parse(metasSalvas));
    } else {
      // Metas iniciais sugeridas
      const metasIniciais: Meta[] = [
        {
          id: '1',
          titulo: 'Meta Diária de Questões',
          descricao: 'Resolver 50 questões por dia',
          tipo: 'questoes',
          valorMeta: 50,
          valorAtual: 32,
          prazo: '2024-01-31',
          prioridade: 'alta',
          concluida: false,
          criadaEm: '2024-01-01'
        },
        {
          id: '2',
          titulo: 'Tempo de Estudo Semanal',
          descricao: 'Estudar 20 horas por semana',
          tipo: 'tempo',
          valorMeta: 1200, // 20 horas em minutos
          valorAtual: 840, // 14 horas
          prazo: '2024-01-31',
          prioridade: 'alta',
          concluida: false,
          criadaEm: '2024-01-01'
        }
      ];
      setMetas(metasIniciais);
      localStorage.setItem('cnuMetas', JSON.stringify(metasIniciais));
    }
  }, []);

  const salvarMetas = (novasMetas: Meta[]) => {
    setMetas(novasMetas);
    localStorage.setItem('cnuMetas', JSON.stringify(novasMetas));
  };

  const adicionarMeta = () => {
    if (!novaMeta.titulo || !novaMeta.valorMeta || !novaMeta.prazo) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const meta: Meta = {
      id: Date.now().toString(),
      ...novaMeta,
      valorAtual: 0,
      concluida: false,
      criadaEm: new Date().toISOString().split('T')[0]
    };

    salvarMetas([...metas, meta]);
    setNovaMeta({
      titulo: '',
      descricao: '',
      tipo: 'questoes',
      valorMeta: 0,
      prazo: '',
      prioridade: 'media'
    });
    setMostrarFormulario(false);

    toast({
      title: "Meta criada!",
      description: "Sua nova meta foi adicionada com sucesso"
    });
  };

  const excluirMeta = (id: string) => {
    const novasMetas = metas.filter(meta => meta.id !== id);
    salvarMetas(novasMetas);
    toast({
      title: "Meta removida",
      description: "A meta foi excluída com sucesso"
    });
  };

  const marcarComoConcluida = (id: string) => {
    const novasMetas = metas.map(meta =>
      meta.id === id ? { ...meta, concluida: true } : meta
    );
    salvarMetas(novasMetas);
    toast({
      title: "🎉 Meta concluída!",
      description: "Parabéns! Você atingiu sua meta."
    });
  };

  const calcularProgresso = (meta: Meta) => {
    return Math.min((meta.valorAtual / meta.valorMeta) * 100, 100);
  };

  const getDiasRestantes = (prazo: string) => {
    const hoje = new Date();
    const dataPrazo = new Date(prazo);
    const diffTime = dataPrazo.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCorPrioridade = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'border-red-300 bg-red-50';
      case 'media': return 'border-yellow-300 bg-yellow-50';
      case 'baixa': return 'border-green-300 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const formatarValor = (tipo: string, valor: number) => {
    switch (tipo) {
      case 'tempo': {
        const horas = Math.floor(valor / 60);
        const minutos = valor % 60;
        return `${horas}h ${minutos}m`;
      }
      case 'questoes':
        return valor.toString();
      case 'acertos':
        return `${valor}%`;
      default:
        return valor.toString();
    }
  };

  const getIconeTipo = (tipo: string) => {
    switch (tipo) {
      case 'tempo': return Clock;
      case 'questoes': return Target;
      case 'acertos': return TrendingUp;
      default: return Target;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Metas Inteligentes</h2>
            <p className="text-emerald-100">Defina e acompanhe seus objetivos de estudo</p>
          </div>
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Nova Meta</span>
          </button>
        </div>
      </div>

      {/* Formulário de Nova Meta */}
      {mostrarFormulario && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Criar Nova Meta</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título da Meta
              </label>
              <input
                type="text"
                value={novaMeta.titulo}
                onChange={(e) => setNovaMeta({ ...novaMeta, titulo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Ex: Resolver 100 questões de Português"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Meta
              </label>
              <select
                value={novaMeta.tipo}
                onChange={(e) => setNovaMeta({ ...novaMeta, tipo: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="questoes">Número de Questões</option>
                <option value="tempo">Tempo de Estudo</option>
                <option value="acertos">Taxa de Acertos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor da Meta
              </label>
              <input
                type="number"
                value={novaMeta.valorMeta}
                onChange={(e) => setNovaMeta({ ...novaMeta, valorMeta: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Ex: 100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prazo
              </label>
              <input
                type="date"
                value={novaMeta.prazo}
                onChange={(e) => setNovaMeta({ ...novaMeta, prazo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <select
                value={novaMeta.prioridade}
                onChange={(e) => setNovaMeta({ ...novaMeta, prioridade: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição (opcional)
              </label>
              <input
                type="text"
                value={novaMeta.descricao}
                onChange={(e) => setNovaMeta({ ...novaMeta, descricao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Detalhes sobre a meta..."
              />
            </div>
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={adicionarMeta}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Criar Meta
            </button>
            <button
              onClick={() => setMostrarFormulario(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metas.map((meta) => {
          const progresso = calcularProgresso(meta);
          const diasRestantes = getDiasRestantes(meta.prazo);
          const IconeTipo = getIconeTipo(meta.tipo);

          return (
            <div
              key={meta.id}
              className={`border-2 rounded-xl p-6 transition-all duration-200 ${
                meta.concluida
                  ? 'border-green-300 bg-green-50'
                  : getCorPrioridade(meta.prioridade)
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    meta.concluida ? 'bg-green-100 text-green-600' : 'bg-white text-gray-600'
                  }`}>
                    <IconeTipo className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{meta.titulo}</h3>
                    <p className="text-sm text-gray-600">{meta.descricao}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {!meta.concluida && progresso >= 100 && (
                    <button
                      onClick={() => marcarComoConcluida(meta.id)}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => excluirMeta(meta.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progresso</span>
                  <span className="font-medium">
                    {formatarValor(meta.tipo, meta.valorAtual)} / {formatarValor(meta.tipo, meta.valorMeta)}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      meta.concluida ? 'bg-green-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${progresso}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    meta.prioridade === 'alta' ? 'bg-red-100 text-red-700' :
                    meta.prioridade === 'media' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {meta.prioridade.toUpperCase()}
                  </span>
                  
                  <span className={`text-xs ${
                    diasRestantes < 0 ? 'text-red-600' :
                    diasRestantes <= 7 ? 'text-orange-600' :
                    'text-gray-600'
                  }`}>
                    {diasRestantes < 0 ? 'Prazo expirado' :
                     diasRestantes === 0 ? 'Expira hoje' :
                     `${diasRestantes} dias restantes`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {metas.length === 0 && !mostrarFormulario && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma meta definida</h3>
          <p className="text-gray-600 mb-6">Crie sua primeira meta para começar a acompanhar seu progresso</p>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg"
          >
            Criar Primeira Meta
          </button>
        </div>
      )}
    </div>
  );
};

export default MetasInteligentes;
