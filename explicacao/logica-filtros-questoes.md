# Lógica Completa dos Filtros de Questões

## Visão Geral

O sistema de filtros de questões é composto por múltiplas camadas que permitem filtragem avançada e específica de questões por diferentes critérios. A lógica está dividida entre frontend (`QuestionFilters.tsx`) e backend (API), com uma camada de conversão que mapeia filtros legacy para o formato da API moderna.

## Estrutura dos Filtros

### 1. Interface FilterData (Frontend Legacy)

```typescript
interface FilterData {
  fundamentais: {
    exame: string | null;           // ENEM, OAB, Concursos, Vestibulares
    ano: number | null;             // Ano da questão
    disciplina: string | null;      // Disciplina específica
    assunto: string | null;         // Assunto (não usado atualmente)
    tipo: string[];                 // Objetiva, Discursiva, Peça prática
    dificuldade: string[];          // Fácil, Médio, Difícil
  };
  especificos: {
    enem: {
      area: string | null;          // Linguagens, Ciências Humanas, etc.
    };
    concursos: {
      banca: string | null;         // CESPE, FGV, FCC, etc.
      cargo: string | null;         // Analista, Técnico, etc.
      escolaridade: string[];       // Médio, Superior
      anoConcurso: number | null;   // Ano específico do concurso
    };
    oab: {
      fase: string[];               // 1ª fase, 2ª fase
      ramo: string | null;          // Área do Direito
      tipo: string[];               // Peça processual, Questão discursiva
    };
  };
  avancados: {
    q: string | null;               // Busca por palavra-chave
    erroMinPct: number;             // Taxa mínima de erro (0-100)
    favoritas: boolean;             // Apenas questões favoritas
  };
  personalizado: {
    nuncaRespondidas: boolean;      // Questões nunca respondidas pelo usuário
  };
}
```

### 2. Interface QuestionFilters (API Moderna)

```typescript
interface QuestionFilters {
  category: 'ENEM' | 'OAB' | 'CONCURSO';           // Categoria principal
  subcategory?: string;                             // Subcategoria (opcional)
  year?: number[];                                  // Anos (array)
  difficulty?: ('FACIL' | 'MEDIO' | 'DIFICIL')[];  // Dificuldades
  subject_area?: string[];                          // Áreas de conhecimento
  legal_branch?: string[];                          // Ramos do direito (OAB)
  exam_phase?: 'PRIMEIRA' | 'SEGUNDA';             // Fase do exame
  type?: ('OBJETIVA' | 'DISCURSIVA' | 'PECA_PRATICA')[]; // Tipos
  institution?: string[];                           // Instituições/Bancas
  position?: string[];                              // Cargos
  education_level?: 'MEDIO' | 'SUPERIOR';          // Nível de escolaridade
  favorites_only?: boolean;                         // Apenas favoritas
  never_answered?: boolean;                         // Nunca respondidas
  user_correct?: boolean;                           // Respondidas corretamente
  user_incorrect?: boolean;                         // Respondidas incorretamente
  min_error_rate?: number;                          // Taxa mínima de erro
  page?: number;                                    // Paginação
  limit?: number;                                   // Limite por página
}
```

## Fluxo de Funcionamento

### 1. Inicialização
```typescript
// Estado inicial dos filtros
const [filters, setFilters] = useState<FilterData>({
  fundamentais: { exame: null, ano: null, disciplina: null, assunto: null, tipo: [], dificuldade: [] },
  especificos: { enem: { area: null }, concursos: { /* ... */ }, oab: { /* ... */ } },
  avancados: { q: null, erroMinPct: 0, favoritas: false },
  personalizado: { nuncaRespondidas: false }
});
```

### 2. Mapeamento de Disciplinas por Exame
```typescript
const DISCIPLINAS_POR_EXAME = {
  ENEM: ['Matemática', 'Português', 'História', /* ... */],
  OAB: ['Direito Constitucional', 'Direito Civil', /* ... */],
  Concursos: ['Português', 'Matemática', 'Raciocínio Lógico', /* ... */],
  Vestibulares: ['Matemática', 'Português', 'História', /* ... */]
};
```

### 3. Contagem de Filtros Ativos
```typescript
useEffect(() => {
  let count = 0;
  
  // Filtros fundamentais
  if (filters.avancados.q) count++;
  if (filters.fundamentais.exame) count++;
  if (filters.fundamentais.disciplina) count++;
  if (filters.fundamentais.ano) count++;
  count += filters.fundamentais.tipo.length;
  count += filters.fundamentais.dificuldade.length;
  
  // Filtros específicos por categoria
  // ... contagem para ENEM, Concursos, OAB
  
  // Filtros avançados
  if (filters.avancados.favoritas) count++;
  if (filters.personalizado.nuncaRespondidas) count++;
  if (filters.avancados.erroMinPct > 0) count++;
  
  setActiveFiltersCount(count);
  updateChips();
}, [filters]);
```

### 4. Sistema de Chips (Visualização de Filtros Ativos)
```typescript
const updateChips = () => {
  const newChips = [];
  
  // Cria chips para cada filtro ativo com labels descritivos
  if (filters.fundamentais.exame) {
    newChips.push({ label: `Exame: ${filters.fundamentais.exame}`, key: 'exame' });
  }
  
  // ... criação de chips para todos os filtros ativos
  
  setChips(newChips);
};
```

### 5. Remoção Individual de Filtros
```typescript
const removeChip = (key: string) => {
  const newFilters = { ...filters };
  
  // Lógica específica para cada tipo de filtro
  if (key === 'exame') {
    newFilters.fundamentais.exame = null;
    newFilters.fundamentais.disciplina = null; // Limpa disciplina dependente
  } else if (key.startsWith('tipo-')) {
    const tipo = key.replace('tipo-', '');
    newFilters.fundamentais.tipo = newFilters.fundamentais.tipo.filter(t => t !== tipo);
  }
  // ... lógica para outros filtros
  
  setFilters(newFilters);
};
```

### 6. Toggle de Filtros Multi-seleção
```typescript
const togglePill = (category: string, value: string) => {
  const newFilters = { ...filters };
  
  if (category === 'tipo') {
    const index = newFilters.fundamentais.tipo.indexOf(value);
    if (index > -1) {
      newFilters.fundamentais.tipo.splice(index, 1); // Remove se existe
    } else {
      newFilters.fundamentais.tipo.push(value);       // Adiciona se não existe
    }
  }
  // ... lógica similar para outros arrays
  
  setFilters(newFilters);
};
```

### 7. Conversão de Filtros Legacy para API
```typescript
const convertFilters = (legacyFilters: any): QuestionFilters => {
  const filters: QuestionFilters = { category: 'ENEM' };

  // Mapeamento de exame
  if (legacyFilters.fundamentais?.exame) {
    const exameMap = { 'ENEM': 'ENEM', 'OAB': 'OAB', 'Concursos': 'CONCURSO' };
    filters.category = exameMap[legacyFilters.fundamentais.exame] || 'ENEM';
  }

  // Mapeamento de dificuldade
  if (legacyFilters.fundamentais?.dificuldade?.length > 0) {
    const difficultyMap = { 'Fácil': 'FACIL', 'Médio': 'MEDIO', 'Difícil': 'DIFICIL' };
    filters.difficulty = legacyFilters.fundamentais.dificuldade
      .map(d => difficultyMap[d])
      .filter(Boolean);
  }

  // ... mapeamentos específicos por categoria
  
  return filters;
};
```

### 8. Aplicação dos Filtros
```typescript
const applyFilters = useCallback(() => {
  // Converte filtros legacy para formato da API
  const apiFilters = convertFilters(filters);
  
  // Callback para componente pai
  if (onFiltersApply) {
    onFiltersApply(apiFilters);
  }
  
  // Evento para compatibilidade reversa
  window.dispatchEvent(new CustomEvent('filters:apply', { detail: apiFilters }));
}, [filters, convertFilters, onFiltersApply]);
```

### 9. Persistência de Presets
```typescript
const savePreset = () => {
  localStorage.setItem('questoes:filters:preset', JSON.stringify(filters));
};

// Restauração na inicialização
useEffect(() => {
  const saved = localStorage.getItem('questoes:filters:preset');
  if (saved) {
    setFilters(JSON.parse(saved));
  }
}, []);
```

### 10. Carregamento Dinâmico de Opções
```typescript
useEffect(() => {
  if (filters.fundamentais.exame) {
    const categoryMap = { 'ENEM': 'ENEM', 'OAB': 'OAB', 'Concursos': 'CONCURSO' };
    const category = categoryMap[filters.fundamentais.exame];
    if (category) {
      fetchFilterOptions(category); // Busca opções específicas da API
    }
  }
}, [filters.fundamentais.exame, fetchFilterOptions]);
```

## Regras de Negócio

### 1. Dependências entre Filtros
- **Exame → Disciplina**: Quando um exame é selecionado, as disciplinas são filtradas de acordo
- **Exame → Filtros Específicos**: Cada tipo de exame habilita filtros específicos (ENEM → área, OAB → fase/ramo, etc.)
- **Limpeza em Cascata**: Alterar o exame limpa automaticamente a disciplina selecionada

### 2. Validações e Restrições
- **Tipo de Questão**: Não é exibido para ENEM (que tem formato fixo)
- **Disciplinas**: Limitadas de acordo com o exame selecionado
- **Anos**: Lista dos últimos 10 anos (2015-2024)
- **Percentual de Erro**: Aceita valores de 0 a 100, em incrementos de 5

### 3. Comportamento da Interface
- **Modo Compacto**: Linha principal com filtros mais usados
- **Expansão**: Seção "Mais filtros" com opções avançadas
- **Chips**: Visualização rápida de filtros ativos com remoção individual
- **Contador**: Exibe número total de filtros ativos

### 4. Integração com Backend
- **Conversão Automática**: Filtros frontend são convertidos automaticamente para formato da API
- **Paginação**: Suporte a page/limit para resultados grandes
- **Cache**: Opções de filtro são cacheadas por categoria
- **Validação**: Backend valida e sanitiza todos os parâmetros recebidos

## Performance e Otimização

### 1. Debouncing
- **Busca por Texto**: Input de palavra-chave pode ser otimizado com debounce
- **Aplicação Automática**: Filtros são aplicados sob demanda via botão

### 2. Memoização
- **useCallback**: Funções de manipulação são memoizadas
- **Conversão**: Hook de conversão usa useCallback para evitar recálculos

### 3. Carregamento Lazy
- **Opções de Filtro**: Carregadas apenas quando categoria é selecionada
- **Disciplinas**: Filtradas no frontend por performance

Esta arquitetura garante flexibilidade, performance e extensibilidade para futuras categorias de exames e filtros.