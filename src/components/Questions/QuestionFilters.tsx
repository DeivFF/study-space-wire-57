import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Filter, RotateCcw, Star, Sparkles } from 'lucide-react';
import { useQuestions, useFilterConverter } from '@/hooks/useQuestions';

interface FilterData {
  fundamentais: {
    exame: string | null;
    ano: number | null;
    disciplina: string | null;
    assunto: string | null;
    tipo: string[];
    dificuldade: string[];
  };
  especificos: {
    enem: {
      area: string | null;
    };
    concursos: {
      banca: string | null;
      cargo: string | null;
      escolaridade: string[];
      anoConcurso: number | null;
    };
    oab: {
      fase: string[];
      ramo: string | null;
      tipo: string[];
    };
  };
  avancados: {
    q: string | null;
    erroMinPct: number;
    favoritas: boolean;
  };
  personalizado: {
    nuncaRespondidas: boolean;
  };
}

// Mapeamento de disciplinas por tipo de exame
const DISCIPLINAS_POR_EXAME: Record<string, string[]> = {
  ENEM: ['Matemática', 'Português', 'História', 'Geografia', 'Física', 'Química', 'Biologia', 'Filosofia', 'Sociologia', 'Inglês', 'Espanhol', 'Artes', 'Educação Física'],
  OAB: ['Direito Constitucional', 'Direito Civil', 'Direito Penal', 'Direito Processual Civil', 'Direito Processual Penal', 'Direito do Trabalho', 'Direito Tributário', 'Direito Administrativo', 'Direito Empresarial', 'Ética Profissional'],
  Concursos: ['Português', 'Matemática', 'Raciocínio Lógico', 'Direito Constitucional', 'Direito Administrativo', 'Informática', 'Atualidades', 'Conhecimentos Específicos'],
  Vestibulares: ['Matemática', 'Português', 'História', 'Geografia', 'Física', 'Química', 'Biologia', 'Literatura', 'Redação', 'Inglês']
};

const CARGOS_CONCURSOS = [
  'Analista', 'Técnico', 'Assistente', 'Auditor', 'Perito', 'Delegado', 
  'Escrivão', 'Agente', 'Oficial', 'Procurador', 'Defensor', 'Promotor'
];

const ANOS_DISPONIVEIS = Array.from({ length: 10 }, (_, i) => 2024 - i);

interface QuestionFiltersProps {
  onFiltersApply?: (filters: any) => void;
}

export const QuestionFilters: React.FC<QuestionFiltersProps> = ({ onFiltersApply }) => {
  const { fetchFilterOptions, filterOptions } = useQuestions();
  const { convertFilters } = useFilterConverter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [filters, setFilters] = useState<FilterData>({
    fundamentais: {
      exame: null,
      ano: null,
      disciplina: null,
      assunto: null,
      tipo: [],
      dificuldade: []
    },
    especificos: {
      enem: { area: null },
      concursos: { banca: null, cargo: null, escolaridade: [], anoConcurso: null },
      oab: { fase: [], ramo: null, tipo: [] }
    },
    avancados: {
      q: null,
      erroMinPct: 0,
      favoritas: false
    },
    personalizado: {
      nuncaRespondidas: false
    }
  });

  const [chips, setChips] = useState<Array<{ label: string; key: string }>>([]);

  // Contar filtros ativos
  useEffect(() => {
    let count = 0;
    
    // Contar filtros fundamentais
    if (filters.avancados.q) count++;
    if (filters.fundamentais.exame) count++;
    if (filters.fundamentais.disciplina) count++;
    if (filters.fundamentais.ano) count++;
    count += filters.fundamentais.tipo.length;
    count += filters.fundamentais.dificuldade.length;
    
    // Contar filtros específicos
    if (filters.especificos.enem.area) count++;
    if (filters.especificos.concursos.banca) count++;
    if (filters.especificos.concursos.cargo) count++;
    count += filters.especificos.concursos.escolaridade.length;
    if (filters.especificos.concursos.anoConcurso) count++;
    count += filters.especificos.oab.fase.length;
    if (filters.especificos.oab.ramo) count++;
    count += filters.especificos.oab.tipo.length;
    
    // Contar filtros avançados
    if (filters.avancados.favoritas) count++;
    if (filters.personalizado.nuncaRespondidas) count++;
    if (filters.avancados.erroMinPct > 0) count++;
    
    setActiveFiltersCount(count);
    updateChips();
  }, [filters]);

  const updateChips = () => {
    const newChips: Array<{ label: string; key: string }> = [];
    
    if (filters.fundamentais.exame) {
      newChips.push({ label: `Exame: ${filters.fundamentais.exame}`, key: 'exame' });
    }
    if (filters.fundamentais.disciplina) {
      newChips.push({ label: `Disciplina: ${filters.fundamentais.disciplina}`, key: 'disciplina' });
    }
    if (filters.fundamentais.ano) {
      newChips.push({ label: `Ano: ${filters.fundamentais.ano}`, key: 'ano' });
    }
    filters.fundamentais.tipo.forEach(t => {
      newChips.push({ label: `Tipo: ${t}`, key: `tipo-${t}` });
    });
    filters.fundamentais.dificuldade.forEach(d => {
      newChips.push({ label: `Dif: ${d}`, key: `dif-${d}` });
    });
    
    // Chips específicos
    if (filters.especificos.enem.area) {
      newChips.push({ label: `ENEM: ${filters.especificos.enem.area}`, key: 'enem-area' });
    }
    if (filters.especificos.concursos.banca) {
      newChips.push({ label: `Banca: ${filters.especificos.concursos.banca}`, key: 'banca' });
    }
    if (filters.especificos.concursos.cargo) {
      newChips.push({ label: `Cargo: ${filters.especificos.concursos.cargo}`, key: 'cargo' });
    }
    filters.especificos.concursos.escolaridade.forEach(e => {
      newChips.push({ label: `Escolaridade: ${e}`, key: `esc-${e}` });
    });
    if (filters.especificos.concursos.anoConcurso) {
      newChips.push({ label: `Ano concurso: ${filters.especificos.concursos.anoConcurso}`, key: 'ano-concurso' });
    }
    filters.especificos.oab.fase.forEach(f => {
      newChips.push({ label: `OAB Fase: ${f}`, key: `fase-${f}` });
    });
    if (filters.especificos.oab.ramo) {
      newChips.push({ label: `OAB: ${filters.especificos.oab.ramo}`, key: 'oab-ramo' });
    }
    filters.especificos.oab.tipo.forEach(t => {
      newChips.push({ label: `OAB: ${t}`, key: `oab-tipo-${t}` });
    });
    
    if (filters.avancados.favoritas) {
      newChips.push({ label: 'Só favoritas', key: 'favoritas' });
    }
    if (filters.personalizado.nuncaRespondidas) {
      newChips.push({ label: 'Nunca respondidas', key: 'nunca' });
    }
    if (filters.avancados.erroMinPct > 0) {
      newChips.push({ label: `Erro ≥ ${filters.avancados.erroMinPct}%`, key: 'erro' });
    }
    
    setChips(newChips);
  };

  const removeChip = (key: string) => {
    const newFilters = { ...filters };
    
    if (key === 'exame') {
      newFilters.fundamentais.exame = null;
      newFilters.fundamentais.disciplina = null;
    } else if (key === 'disciplina') {
      newFilters.fundamentais.disciplina = null;
    } else if (key === 'ano') {
      newFilters.fundamentais.ano = null;
    } else if (key.startsWith('tipo-')) {
      const tipo = key.replace('tipo-', '');
      newFilters.fundamentais.tipo = newFilters.fundamentais.tipo.filter(t => t !== tipo);
    } else if (key.startsWith('dif-')) {
      const dif = key.replace('dif-', '');
      newFilters.fundamentais.dificuldade = newFilters.fundamentais.dificuldade.filter(d => d !== dif);
    } else if (key === 'enem-area') {
      newFilters.especificos.enem.area = null;
    } else if (key === 'banca') {
      newFilters.especificos.concursos.banca = null;
    } else if (key === 'cargo') {
      newFilters.especificos.concursos.cargo = null;
    } else if (key.startsWith('esc-')) {
      const esc = key.replace('esc-', '');
      newFilters.especificos.concursos.escolaridade = newFilters.especificos.concursos.escolaridade.filter(e => e !== esc);
    } else if (key === 'ano-concurso') {
      newFilters.especificos.concursos.anoConcurso = null;
    } else if (key.startsWith('fase-')) {
      const fase = key.replace('fase-', '');
      newFilters.especificos.oab.fase = newFilters.especificos.oab.fase.filter(f => f !== fase);
    } else if (key === 'oab-ramo') {
      newFilters.especificos.oab.ramo = null;
    } else if (key.startsWith('oab-tipo-')) {
      const tipo = key.replace('oab-tipo-', '');
      newFilters.especificos.oab.tipo = newFilters.especificos.oab.tipo.filter(t => t !== tipo);
    } else if (key === 'favoritas') {
      newFilters.avancados.favoritas = false;
    } else if (key === 'nunca') {
      newFilters.personalizado.nuncaRespondidas = false;
    } else if (key === 'erro') {
      newFilters.avancados.erroMinPct = 0;
    }
    
    setFilters(newFilters);
  };

  const togglePill = (category: string, value: string) => {
    const newFilters = { ...filters };
    
    if (category === 'tipo') {
      const index = newFilters.fundamentais.tipo.indexOf(value);
      if (index > -1) {
        newFilters.fundamentais.tipo.splice(index, 1);
      } else {
        newFilters.fundamentais.tipo.push(value);
      }
    } else if (category === 'dificuldade') {
      const index = newFilters.fundamentais.dificuldade.indexOf(value);
      if (index > -1) {
        newFilters.fundamentais.dificuldade.splice(index, 1);
      } else {
        newFilters.fundamentais.dificuldade.push(value);
      }
    } else if (category === 'escolaridade') {
      const index = newFilters.especificos.concursos.escolaridade.indexOf(value);
      if (index > -1) {
        newFilters.especificos.concursos.escolaridade.splice(index, 1);
      } else {
        newFilters.especificos.concursos.escolaridade.push(value);
      }
    } else if (category === 'fase') {
      const index = newFilters.especificos.oab.fase.indexOf(value);
      if (index > -1) {
        newFilters.especificos.oab.fase.splice(index, 1);
      } else {
        newFilters.especificos.oab.fase.push(value);
      }
    } else if (category === 'tipoOab') {
      const index = newFilters.especificos.oab.tipo.indexOf(value);
      if (index > -1) {
        newFilters.especificos.oab.tipo.splice(index, 1);
      } else {
        newFilters.especificos.oab.tipo.push(value);
      }
    }
    
    setFilters(newFilters);
  };

  const applyFilters = useCallback(() => {
    // Convert legacy filters to new API format
    const apiFilters = convertFilters(filters);
    
    // Call parent callback if provided
    if (onFiltersApply) {
      onFiltersApply(apiFilters);
    }
    
    // Also dispatch event for backward compatibility
    window.dispatchEvent(new CustomEvent('filters:apply', { detail: apiFilters }));
    console.log('Aplicando filtros:', apiFilters);
  }, [filters, convertFilters, onFiltersApply]);

  const clearFilters = () => {
    setFilters({
      fundamentais: {
        exame: null,
        ano: null,
        disciplina: null,
        assunto: null,
        tipo: [],
        dificuldade: []
      },
      especificos: {
        enem: { area: null },
        concursos: { banca: null, cargo: null, escolaridade: [], anoConcurso: null },
        oab: { fase: [], ramo: null, tipo: [] }
      },
      avancados: {
        q: null,
        erroMinPct: 0,
        favoritas: false
      },
      personalizado: {
        nuncaRespondidas: false
      }
    });
  };

  const savePreset = () => {
    localStorage.setItem('questoes:filters:preset', JSON.stringify(filters));
    alert('Preset de filtros salvo!');
  };

  // Restaurar preset ao montar
  useEffect(() => {
    const saved = localStorage.getItem('questoes:filters:preset');
    if (saved) {
      try {
        setFilters(JSON.parse(saved));
      } catch (e) {
        console.error('Erro ao restaurar preset:', e);
      }
    }
  }, []);

  // Carregar opções de filtro quando a categoria muda
  useEffect(() => {
    if (filters.fundamentais.exame) {
      const categoryMap: Record<string, 'ENEM' | 'OAB' | 'CONCURSO'> = {
        'ENEM': 'ENEM',
        'OAB': 'OAB',
        'Concursos': 'CONCURSO'
      };
      const category = categoryMap[filters.fundamentais.exame];
      if (category) {
        fetchFilterOptions(category);
      }
    }
  }, [filters.fundamentais.exame, fetchFilterOptions]);

  const disciplinasDisponiveis = filters.fundamentais.exame 
    ? DISCIPLINAS_POR_EXAME[filters.fundamentais.exame] || []
    : [];

  // Não mostrar tipo de questão quando for ENEM
  const showTipoQuestao = filters.fundamentais.exame !== 'ENEM';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <Filter className="w-5 h-5 text-gray-700" />
        <div className="font-bold text-gray-900">Filtros (Modo Compacto)</div>
        <div className="flex-1" />
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          activeFiltersCount > 0 
            ? 'bg-blue-50 text-blue-600 border border-blue-200' 
            : 'bg-gray-50 text-gray-600 border border-gray-200'
        }`}>
          {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro ativo' : 'filtros ativos'}
        </span>
      </div>

      <div className="p-4">
        {/* Linha de filtros rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
            <input
              type="text"
              placeholder="Palavra-chave no enunciado"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={filters.avancados.q || ''}
              onChange={(e) => setFilters({ ...filters, avancados: { ...filters.avancados, q: e.target.value || null } })}
            />
          </div>
          
          <select
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            value={filters.fundamentais.exame || ''}
            onChange={(e) => setFilters({ 
              ...filters, 
              fundamentais: { 
                ...filters.fundamentais, 
                exame: e.target.value || null,
                disciplina: null
              } 
            })}
          >
            <option value="">Exame/Prova</option>
            <option value="ENEM">ENEM</option>
            <option value="OAB">OAB</option>
            <option value="Concursos">Concursos</option>
            <option value="Vestibulares">Vestibulares</option>
          </select>
          
          <select
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            value={filters.fundamentais.disciplina || ''}
            onChange={(e) => setFilters({ ...filters, fundamentais: { ...filters.fundamentais, disciplina: e.target.value || null } })}
            disabled={!filters.fundamentais.exame}
          >
            <option value="">Disciplina</option>
            {disciplinasDisponiveis.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          
          <button
            onClick={applyFilters}
            className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Aplicar
          </button>
        </div>

        {/* Chips de filtros ativos */}
        {chips.length > 0 && (
          <div className="flex gap-2 overflow-auto pb-2 mt-3">
            {chips.map(chip => (
              <button
                key={chip.key}
                onClick={() => removeChip(chip.key)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                {chip.label}
                <span className="ml-1 text-gray-400 hover:text-gray-600">×</span>
              </button>
            ))}
          </div>
        )}

        <div className="h-px bg-gray-200 my-4" />

        {/* Mais filtros */}
        <div className="border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
          <button 
            className="w-full p-3 flex items-center gap-2 text-left"
            onClick={() => setIsExpanded(!isExpanded)}
            type="button"
          >
            <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            <strong className="text-gray-900">Mais filtros</strong>
            <span className="text-gray-500 text-sm">(Fundamentais, Específicos por Exame, Personalizado)</span>
          </button>
          
          {isExpanded && (
            <div className="p-4 border-t border-gray-200">
              {/* Filtros fundamentais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Ano</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={filters.fundamentais.ano || ''}
                    onChange={(e) => setFilters({ ...filters, fundamentais: { ...filters.fundamentais, ano: e.target.value ? Number(e.target.value) : null } })}
                  >
                    <option value="">ex.: 2024</option>
                    {ANOS_DISPONIVEIS.map(ano => (
                      <option key={ano} value={ano}>{ano}</option>
                    ))}
                  </select>
                </div>
                
                {showTipoQuestao && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Tipo de questão</label>
                    <div className="flex gap-2 flex-wrap">
                      {['Objetiva', 'Discursiva', 'Peça prática'].map(tipo => (
                        <button
                          key={tipo}
                          onClick={() => togglePill('tipo', tipo)}
                          type="button"
                          className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                            filters.fundamentais.tipo.includes(tipo)
                              ? 'border-blue-400 bg-blue-50 text-blue-600'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {tipo}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Dificuldade</label>
                  <div className="flex gap-2 flex-wrap">
                    {['Fácil', 'Médio', 'Difícil'].map(dif => (
                      <button
                        key={dif}
                        onClick={() => togglePill('dificuldade', dif)}
                        type="button"
                        className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                          filters.fundamentais.dificuldade.includes(dif)
                            ? 'border-blue-400 bg-blue-50 text-blue-600'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {dif}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-200 my-4" />

              {/* Filtros específicos por exame */}
              {filters.fundamentais.exame === 'ENEM' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Área (ENEM)</label>
                    <select
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={filters.especificos.enem.area || ''}
                      onChange={(e) => setFilters({ ...filters, especificos: { ...filters.especificos, enem: { area: e.target.value || null } } })}
                    >
                      <option value="">— Qualquer —</option>
                      <option>Linguagens</option>
                      <option>Ciências Humanas</option>
                      <option>Ciências da Natureza</option>
                      <option>Matemática</option>
                      <option>Redação</option>
                    </select>
                  </div>
                </div>
              )}

              {filters.fundamentais.exame === 'Concursos' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">Órgão/Banca</label>
                      <select
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={filters.especificos.concursos.banca || ''}
                        onChange={(e) => setFilters({ ...filters, especificos: { ...filters.especificos, concursos: { ...filters.especificos.concursos, banca: e.target.value || null } } })}
                      >
                        <option value="">— Qualquer —</option>
                        <option>CESPE/CEBRASPE</option>
                        <option>FGV</option>
                        <option>FCC</option>
                        <option>Vunesp</option>
                        <option>IBFC</option>
                        <option>Quadrix</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">Cargo</label>
                      <select
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={filters.especificos.concursos.cargo || ''}
                        onChange={(e) => setFilters({ ...filters, especificos: { ...filters.especificos, concursos: { ...filters.especificos.concursos, cargo: e.target.value || null } } })}
                      >
                        <option value="">ex.: Analista</option>
                        {CARGOS_CONCURSOS.map(cargo => (
                          <option key={cargo} value={cargo}>{cargo}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">Escolaridade</label>
                      <div className="flex gap-2 flex-wrap">
                        {['Médio', 'Superior'].map(esc => (
                          <button
                            key={esc}
                            onClick={() => togglePill('escolaridade', esc)}
                            type="button"
                            className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                              filters.especificos.concursos.escolaridade.includes(esc)
                                ? 'border-blue-400 bg-blue-50 text-blue-600'
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {esc}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">Ano do concurso</label>
                      <select
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={filters.especificos.concursos.anoConcurso || ''}
                        onChange={(e) => setFilters({ ...filters, especificos: { ...filters.especificos, concursos: { ...filters.especificos.concursos, anoConcurso: e.target.value ? Number(e.target.value) : null } } })}
                      >
                        <option value="">ex.: 2023</option>
                        {ANOS_DISPONIVEIS.map(ano => (
                          <option key={ano} value={ano}>{ano}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {filters.fundamentais.exame === 'OAB' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Fase</label>
                    <div className="flex gap-2 flex-wrap">
                      {['1ª fase', '2ª fase'].map(fase => (
                        <button
                          key={fase}
                          onClick={() => togglePill('fase', fase)}
                          type="button"
                          className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                            filters.especificos.oab.fase.includes(fase)
                              ? 'border-blue-400 bg-blue-50 text-blue-600'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {fase}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Ramo do Direito</label>
                    <select
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={filters.especificos.oab.ramo || ''}
                      onChange={(e) => setFilters({ ...filters, especificos: { ...filters.especificos, oab: { ...filters.especificos.oab, ramo: e.target.value || null } } })}
                    >
                      <option value="">— Qualquer —</option>
                      <option>Ética</option>
                      <option>Constitucional</option>
                      <option>Civil</option>
                      <option>Penal</option>
                      <option>Trabalho</option>
                      <option>Tributário</option>
                      <option>Empresarial</option>
                      <option>Administrativo</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Tipo</label>
                    <div className="flex gap-2 flex-wrap">
                      {['Peça processual', 'Questão discursiva'].map(tipo => (
                        <button
                          key={tipo}
                          onClick={() => togglePill('tipoOab', tipo)}
                          type="button"
                          className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                            filters.especificos.oab.tipo.includes(tipo)
                              ? 'border-blue-400 bg-blue-50 text-blue-600'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {tipo}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(filters.fundamentais.exame === 'ENEM' || 
                filters.fundamentais.exame === 'Concursos' || 
                filters.fundamentais.exame === 'OAB') && (
                <div className="h-px bg-gray-200 my-4" />
              )}

              {/* Estudo personalizado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Favoritas/salvas</label>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.avancados.favoritas}
                      onChange={(e) => setFilters({ ...filters, avancados: { ...filters.avancados, favoritas: e.target.checked } })}
                      className="accent-blue-500"
                    />
                    <span className="text-sm text-gray-700">Incluir só favoritas</span>
                  </label>
                </div>
                
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Questões nunca respondidas</label>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.personalizado.nuncaRespondidas}
                      onChange={(e) => setFilters({ ...filters, personalizado: { ...filters.personalizado, nuncaRespondidas: e.target.checked } })}
                      className="accent-blue-500"
                    />
                    <span className="text-sm text-gray-700">Evitar repetição</span>
                  </label>
                </div>
                
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Erro mínimo (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={filters.avancados.erroMinPct}
                    onChange={(e) => setFilters({ ...filters, avancados: { ...filters.avancados, erroMinPct: Number(e.target.value) } })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-3 mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Limpar
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={savePreset}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Star className="w-4 h-4" />
              Salvar preset
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold flex items-center gap-2 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};