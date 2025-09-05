import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { GamificationProvider } from "./contexts/GamificationContext";
import { ChatProvider } from "./contexts/ChatContext";
import { CommandPalette } from "./components/Command/CommandPalette";
import { useCommandPalette } from "./hooks/useCommandPalette";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ChatManager } from "./components/Chat/ChatManager";
import { FloatingChatWidget } from "./components/Chat/FloatingChatWidget";
import Index from "./pages/Index";
import Navegacao from "./pages/Navegacao";
import Questoes from "./pages/Questoes";
import Aulas from "./pages/Aulas";
import Amigos from "./pages/Amigos";
import Comunidades from "./pages/Comunidades";
import Feed from "./pages/Feed";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Calendario from "./pages/Calendario";
import Sala from "./pages/Sala";
import Biblioteca from "./pages/Biblioteca";
import { OnboardingModal } from "./components/OnboardingModal";
import { useTokenExpiration } from "./hooks/useTokenExpiration";
import { useGamificationIntegration } from "./hooks/useGamificationIntegration";
import { AppLayout } from "./components/Layout/AppLayout";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { showOnboardingModal, completeOnboarding, user } = useAuth();
  const { isOpen, setIsOpen } = useCommandPalette();
  useTokenExpiration();
  useGamificationIntegration(); // Initialize gamification system

  return (
    <AppLayout>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } />
        <Route path="/navegacao" element={
          <ProtectedRoute>
            <Navegacao />
          </ProtectedRoute>
        } />
        <Route path="/questoes" element={
          <ProtectedRoute>
            <Questoes />
          </ProtectedRoute>
        } />
        <Route path="/aulas" element={
          <ProtectedRoute>
            <Aulas />
          </ProtectedRoute>
        } />
        <Route path="/amigos" element={
          <ProtectedRoute>
            <Amigos />
          </ProtectedRoute>
        } />
        <Route path="/comunidades" element={
          <ProtectedRoute>
            <Comunidades />
          </ProtectedRoute>
        } />
        <Route path="/feed" element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        } />
        <Route path="/perfil/:nickname" element={
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        } />
        <Route path="/meu-perfil" element={
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        } />
        <Route path="/calendario" element={
          <ProtectedRoute>
            <Calendario />
          </ProtectedRoute>
        } />
        <Route path="/sala" element={
          <ProtectedRoute>
            <Sala />
          </ProtectedRoute>
        } />
        <Route path="/sala/:roomId" element={
          <ProtectedRoute>
            <Sala />
          </ProtectedRoute>
        } />
        <Route path="/biblioteca" element={
          <ProtectedRoute>
            <Biblioteca />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {user && <ChatManager />}
      {user && <FloatingChatWidget />}
      {showOnboardingModal && user && (
        <OnboardingModal
          isOpen={showOnboardingModal}
          onComplete={completeOnboarding}
          userEmail={user.email}
        />
      )}
      <CommandPalette open={isOpen} onOpenChange={setIsOpen} />
    </AppLayout>
  );
};

const AppContent = () => {
  return (
    <>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SocketProvider>
        <GamificationProvider>
          <ChatProvider>
            <AppContent />
          </ChatProvider>
        </GamificationProvider>
      </SocketProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;