
import { useState, useEffect, useCallback } from 'react';
import { Trophy, Star, Target, Zap, Calendar, BookOpen, Award, Medal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  icon: typeof Trophy;
  meta: number;
  progresso: number;
  desbloqueada: boolean;
  categoria: 'questoes' | 'tempo' | 'sequencia' | 'simulados';
  recompensa: number; // pontos XP
}

const Conquistas = () => {
  const { toast } = useToast();
  const [conquistas, setConquistas] = useState<Conquista[]>([
    {
      id: 'primeiros-passos',
      titulo: 'Primeiros Passos',
      descricao: 'Responda suas primeiras 10 questões',
      icon: Star,
      meta: 10,
      progresso: 0,
      desbloqueada: false,
      categoria: 'questoes',
      recompensa: 100
    },
    {
      id: 'centena',
      titulo: 'Centena Completa',
      descricao: 'Responda 100 questões',
      icon: Target,
      meta: 100,
      progresso: 0,
      desbloqueada: false,
      categoria: 'questoes',
      recompensa: 500
    },
    {
      id: 'milhar',
      titulo: 'Expert em Questões',
      descricao: 'Responda 1000 questões',
      icon: Trophy,
      meta: 1000,
      progresso: 0,
      desbloqueada: false,
      categoria: 'questoes',
      recompensa: 2000
    },
    {
      id: 'maratonista',
      titulo: 'Maratonista dos Estudos',
      descricao: 'Estude por 50 horas',
      icon: Zap,
      meta: 3000, // 50 horas em minutos
      progresso: 0,
      desbloqueada: false,
      categoria: 'tempo',
      recompensa: 800
    },
    {
      id: 'consistente',
      titulo: 'Estudante Consistente',
      descricao: 'Estude por 7 dias consecutivos',
      icon: Calendar,
      meta: 7,
      progresso: 0,
      desbloqueada: false,
      categoria: 'sequencia',
      recompensa: 600
    },
  ]);

  const [xpTotal, setXpTotal] = useState(0);
  const [nivel, setNivel] = useState(1);

  useEffect(() => {
    const savedData = localStorage.getItem('cnuConquistas');
    if (savedData) {
      const data = JSON.parse(savedData);
      setConquistas(prevConquistas => data.conquistas || prevConquistas);
      setXpTotal(data.xpTotal || 0);
      setNivel(data.nivel || 1);
    }
  }, []);

  const calcularNivel = (xp: number) => {
    return Math.floor(xp / 1000) + 1;
  };

  const verificarConquistas = useCallback(() => {
    const stats = JSON.parse(localStorage.getItem('cnuStudyStats') || '{}');
    const novasConquistas = conquistas.map(conquista => {
      let novoProgresso = conquista.progresso;
      
      switch (conquista.categoria) {
        case 'questoes':
          novoProgresso = stats.questoesResolvidas || 0;
          break;
        case 'tempo':
          novoProgresso = stats.tempoEstudo || 0;
          break;
        case 'sequencia':
          novoProgresso = 5; // Simulado por agora
          break;
      }

      if (novoProgresso >= conquista.meta && !conquista.desbloqueada) {
        toast({
          title: "🏆 Conquista Desbloqueada!",
          description: `${conquista.titulo} - +${conquista.recompensa} XP`,
        });
        return { ...conquista, progresso: novoProgresso, desbloqueada: true };
      }

      return { ...conquista, progresso: novoProgresso };
    });

    const novoXP = novasConquistas
      .filter(c => c.desbloqueada)
      .reduce((total, c) => total + c.recompensa, 0);

    const novoNivel = calcularNivel(novoXP);

    setConquistas(novasConquistas);
    setXpTotal(novoXP);
    setNivel(novoNivel);

    localStorage.setItem('cnuConquistas', JSON.stringify({
      conquistas: novasConquistas,
      xpTotal: novoXP,
      nivel: novoNivel
    }));
  }, [conquistas, toast]);

  useEffect(() => {
    verificarConquistas();
  }, [verificarConquistas]);

  const getProgressPercentage = (conquista: Conquista) => {
    return Math.min((conquista.progresso / conquista.meta) * 100, 100);
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'questoes': return Target;
      case 'tempo': return Zap;
      case 'sequencia': return Calendar;
      default: return Star;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com XP e Nível */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Sistema de Conquistas</h2>
            <p className="text-purple-100">Desbloqueie conquistas e ganhe XP estudando!</p>
          </div>
          <div className="text-center">
            <div className="bg-white/20 rounded-lg p-4">
              <Medal className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">Nível {nivel}</p>
              <p className="text-sm text-purple-200">{xpTotal} XP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Conquistas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {conquistas.map((conquista) => {
          const Icon = conquista.icon;
          const progress = getProgressPercentage(conquista);
          
          return (
            <div
              key={conquista.id}
              className={`bg-white rounded-xl border-2 p-6 transition-all duration-200 ${
                conquista.desbloqueada
                  ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg'
                  : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${
                  conquista.desbloqueada ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                {conquista.desbloqueada && (
                  <Award className="w-6 h-6 text-yellow-500" />
                )}
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2">{conquista.titulo}</h3>
              <p className="text-sm text-gray-600 mb-4">{conquista.descricao}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progresso</span>
                  <span className="font-medium">
                    {conquista.progresso}/{conquista.meta}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      conquista.desbloqueada ? 'bg-yellow-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {conquista.categoria}
                  </span>
                  <span className="text-xs font-medium text-purple-600">
                    +{conquista.recompensa} XP
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Próximo Nível */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progresso para o Próximo Nível</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Nível {nivel}</span>
            <span>Nível {nivel + 1}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
              style={{ width: `${(xpTotal % 1000) / 10}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 text-center">
            {1000 - (xpTotal % 1000)} XP restantes para o próximo nível
          </p>
        </div>
      </div>
    </div>
  );
};

export default Conquistas;
