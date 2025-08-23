import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CommunityHeaderProps {
  onCreateCommunity: () => void;
}

export function CommunityHeader({ onCreateCommunity }: CommunityHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Title and Create Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-app-text">Explorar Comunidades</h1>
        <Button onClick={onCreateCommunity} className="bg-gradient-to-r from-app-accent to-app-accent-2">
          <Plus className="w-4 h-4" />
          Criar comunidade
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-app-text-muted" />
          <Input 
            placeholder="Buscar comunidades..." 
            className="pl-10 bg-app-muted border-app-border"
          />
        </div>
        
        <Select defaultValue="all">
          <SelectTrigger className="w-[140px] bg-app-panel border-app-border">
            <SelectValue placeholder="Área: Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Área: Todas</SelectItem>
            <SelectItem value="direito">Direito</SelectItem>
            <SelectItem value="admin">Administração</SelectItem>
            <SelectItem value="ti">TI</SelectItem>
            <SelectItem value="medicina">Medicina</SelectItem>
          </SelectContent>
        </Select>
        
        <Select defaultValue="all-tags">
          <SelectTrigger className="w-[140px] bg-app-panel border-app-border">
            <SelectValue placeholder="Tags: Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-tags">Tags: Todas</SelectItem>
            <SelectItem value="fgv">FGV</SelectItem>
            <SelectItem value="enem">ENEM</SelectItem>
            <SelectItem value="oab">OAB</SelectItem>
          </SelectContent>
        </Select>
        
        <Select defaultValue="popular">
          <SelectTrigger className="w-[120px] bg-app-panel border-app-border">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Populares</SelectItem>
            <SelectItem value="recent">Recentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Tags */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm bg-app-accent/10 text-app-accent px-3 py-1 rounded-full border border-app-accent/20">
          #FGV
          <button className="ml-2 hover:text-app-danger">×</button>
        </span>
        <span className="text-sm bg-app-accent/10 text-app-accent px-3 py-1 rounded-full border border-app-accent/20">
          #Direito
          <button className="ml-2 hover:text-app-danger">×</button>
        </span>
        <span className="text-sm bg-app-accent/10 text-app-accent px-3 py-1 rounded-full border border-app-accent/20">
          #ENEM
          <button className="ml-2 hover:text-app-danger">×</button>
        </span>
        <Button variant="ghost" size="sm" className="text-xs">
          Limpar tudo
        </Button>
      </div>
    </div>
  );
}