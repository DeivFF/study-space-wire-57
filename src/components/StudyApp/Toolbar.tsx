import { Search, Filter, LayoutGrid, Rows } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStudyApp } from '@/contexts/StudyAppContext';

export function Toolbar() {
  const { state, dispatch } = useStudyApp();

  return (
    <div className="sticky top-14 z-9 bg-app-panel border-b border-app-border">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 py-3">
          <div className="relative">
            <Search className="absolute left-2 top-2 w-4 h-4 text-app-text-muted" />
            <Input
              placeholder="Buscar aulas… (/)"
              value={state.query}
              onChange={(e) => dispatch({ type: 'SET_QUERY', payload: e.target.value })}
              className="pl-8 min-w-[260px] bg-app-bg border-app-border text-app-text"
            />
          </div>
          
          <select
            value={state.difficulty}
            onChange={(e) => dispatch({ type: 'SET_DIFFICULTY', payload: e.target.value })}
            className="appearance-none bg-app-bg border border-app-border text-app-text py-2 px-3 pr-8 rounded-lg min-w-[160px] bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2716%27%20height%3D%2716%27%20fill%3D%27%236d7483%27%20viewBox%3D%270%200%2024%2024%27%3E%3Cpath%20d%3D%27M7%2010l5%205%205-5z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_10px_center]"
          >
            <option value="all">Dificuldade (todas)</option>
            <option value="facil">Fácil</option>
            <option value="medio">Médio</option>
            <option value="dificil">Difícil</option>
          </select>
          
          <select
            value={state.status}
            onChange={(e) => dispatch({ type: 'SET_STATUS', payload: e.target.value })}
            className="appearance-none bg-app-bg border border-app-border text-app-text py-2 px-3 pr-8 rounded-lg min-w-[160px] bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2716%27%20height%3D%2716%27%20fill%3D%27%236d7483%27%20viewBox%3D%270%200%2024%2024%27%3E%3Cpath%20d%3D%27M7%2010l5%205%205-5z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_10px_center]"
          >
            <option value="all">Status (todos)</option>
            <option value="nao_iniciado">Não iniciado</option>
            <option value="em_andamento">Em andamento</option>
            <option value="estudado">Estudado</option>
          </select>
          
          <select
            value={state.typeFilter}
            onChange={(e) => dispatch({ type: 'SET_TYPE_FILTER', payload: e.target.value })}
            className="appearance-none bg-app-bg border border-app-border text-app-text py-2 px-3 pr-8 rounded-lg min-w-[160px] bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2716%27%20height%3D%2716%27%20fill%3D%27%236d7483%27%20viewBox%3D%270%200%2024%2024%27%3E%3Cpath%20d%3D%27M7%2010l5%205%205-5z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_10px_center]"
          >
            <option value="all">Tipo (todos)</option>
            <option value="pdf">PDF</option>
            <option value="audio">Áudio</option>
            <option value="html">HTML</option>
            <option value="site">Website</option>
          </select>
          
          <div className="flex-1" />
          
          <Button 
            variant="outline"
            className="bg-app-bg border-app-border text-app-text hover:bg-app-muted"
          >
            <Filter className="w-4 h-4" />
            Salvar vista
          </Button>
          
          <div className="flex gap-1">
            <Button 
              variant={state.view === 'cards' ? 'default' : 'outline'}
              size="icon"
              onClick={() => dispatch({ type: 'SET_VIEW', payload: 'cards' })}
              className={state.view === 'cards' 
                ? 'bg-gradient-to-r from-app-accent to-app-accent-2 text-white' 
                : 'bg-app-bg border-app-border text-app-text hover:bg-app-muted'
              }
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button 
              variant={state.view === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => dispatch({ type: 'SET_VIEW', payload: 'list' })}
              className={state.view === 'list' 
                ? 'bg-gradient-to-r from-app-accent to-app-accent-2 text-white' 
                : 'bg-app-bg border-app-border text-app-text hover:bg-app-muted'
              }
            >
              <Rows className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}