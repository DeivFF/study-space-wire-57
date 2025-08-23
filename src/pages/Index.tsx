
import { StudyAppProvider } from '@/contexts/StudyAppContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { LeftSidebar } from '@/components/LeftSidebar';
import { Header } from '@/components/StudyApp/Header';
import { Toolbar } from '@/components/StudyApp/Toolbar';
import { MainArea } from '@/components/StudyApp/MainArea';
import { RightSidebar } from '@/components/StudyApp/RightSidebar';

const Index = () => {
  return (
    <StudyAppProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-app-bg flex w-full">
          <LeftSidebar />
          
          <main className="flex flex-col flex-1 min-w-0">
            <Header />
            <Toolbar />
            
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4 items-start">
              <div className="min-h-0 overflow-auto">
                <MainArea />
              </div>
              
              <div className="hidden lg:block">
                <RightSidebar />
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </StudyAppProvider>
  );
};

export default Index;
