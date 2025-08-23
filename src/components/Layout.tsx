
import { StudyAppProvider } from '@/contexts/StudyAppContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { LeftSidebar } from '@/components/LeftSidebar';
import { Header } from '@/components/StudyApp/Header';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <StudyAppProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-app-bg flex w-full">
          <LeftSidebar />
          
          <main className="flex flex-col flex-1 min-w-0">
            <Header />
            {children}
          </main>
        </div>
      </SidebarProvider>
    </StudyAppProvider>
  );
}
