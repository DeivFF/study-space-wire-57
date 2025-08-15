import React, { useState } from 'react';
import EstatisticasCategoriaUnica from './EstatisticasCategoriaUnica';
import HistoricoAulasAssistidas from './HistoricoAulasAssistidas';
import ErrorBoundary from './ErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock, TrendingUp } from 'lucide-react';

const Estatisticas = () => {
  const [activeTab, setActiveTab] = useState('categories');

  return (
    <ErrorBoundary>
      <div className="space-y-6 p-6 py-0">
        {/* Header */}
        <div className="border-b border-border pb-4">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            Estatísticas de Estudo
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe seu progresso e desempenho nos estudos
          </p>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="space-y-4">
              <div className="border-b border-border pb-3">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Progresso por Categoria
                </h2>
                <p className="text-muted-foreground mt-1">
                  Acompanhe seu progresso em cada área de estudo
                </p>
              </div>
              <ErrorBoundary>
                <EstatisticasCategoriaUnica />
              </ErrorBoundary>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="space-y-4">
              <div className="border-b border-border pb-3">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Histórico Detalhado
                </h2>
                <p className="text-muted-foreground mt-1">
                  Veja todas as suas atividades de estudo
                </p>
              </div>
              <ErrorBoundary>
                <HistoricoAulasAssistidas />
              </ErrorBoundary>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
};

export default Estatisticas;