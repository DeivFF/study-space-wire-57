import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Resumos from '@/components/Resumos';
import Estatisticas from '@/components/Estatisticas';
import PlanoEstudos from '@/components/PlanoEstudos';
import Questoes from '@/components/Questoes';
import Audios from '@/components/Audios';
import Aulas from '@/components/Aulas';
import Topics from '@/components/Topics';
import { useAppContext } from '@/contexts/AppContext';
import { useScrollPersistence } from '@/hooks/useScrollPersistence';
const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    state,
    actions
  } = useAppContext();
  const { setSelectedSection, markActivity } = actions;

  // Extrair seção da URL
  const urlSection = location.pathname.slice(1) || 'resumos';
  const activeSection = urlSection;

  // Sincronizar seção com URL apenas quando necessário
  useEffect(() => {
    if (activeSection !== state.selectedSection) {
      setSelectedSection(activeSection);
    }
  }, [activeSection, setSelectedSection]); // Removed state.selectedSection to prevent loop

  // Função para navegar entre seções
  const handleSectionChange = (section: string) => {
    navigate(`/${section}`);
  };

  // Persist scroll position for main content
  useScrollPersistence('main-content', [activeSection]);

  // Mark activity only on mount, not on every render
  useEffect(() => {
    markActivity();
  }, []); // Empty dependency array

  const renderContent = () => {
    switch (activeSection) {
      case 'resumos':
        return <Resumos />;
      case 'aulas':
        return <Aulas />;
      case 'questoes':
        return <Questoes />;
      case 'audios':
        return <Audios />;
      case 'estatisticas':
        return <Estatisticas />;
      case 'plano-estudos':
        return <PlanoEstudos />;
      case 'topicos':
        return <Topics />;
      default:
        return <Resumos />;
    }
  };
  return <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex w-full">
        <Sidebar activeSection={activeSection} setActiveSection={handleSectionChange} />
        
        <div className="flex-1 flex flex-col">
          <Header />
          <main id="main-content" className="flex-1 container mx-auto overflow-y-auto py-0 px-0">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>;
};
export default Index;