
import { StudyAppProvider } from '@/contexts/StudyAppContext';
import { Header } from '@/components/StudyApp/Header';
import { Toolbar } from '@/components/StudyApp/Toolbar';
import { MainArea } from '@/components/StudyApp/MainArea';
import { RightSidebar } from '@/components/StudyApp/RightSidebar';
import { useRef } from 'react';

const Index = () => {
  const rightSidebarRef = useRef<{ refreshData: () => void }>(null);

  const handleRefreshSidebar = () => {
    rightSidebarRef.current?.refreshData();
  };

  return (
    <StudyAppProvider>
      <div className="min-h-screen bg-app-bg flex flex-col">
          <Header onRefreshSidebar={handleRefreshSidebar} />
          <Toolbar />
          
          <main className="flex-1">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 py-4 items-start">
                <div className="min-h-0 overflow-auto">
                  <MainArea />
                </div>
                
                <div className="hidden lg:block">
                  <RightSidebar ref={rightSidebarRef} />
                </div>
              </div>
            </div>
          </main>
      </div>
    </StudyAppProvider>
  );
};

export default Index;
