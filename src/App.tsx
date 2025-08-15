
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FriendsProvider } from "@/contexts/FriendsContext";
import { StudySessionProvider } from "@/contexts/StudySessionContext";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { LoadingPage } from "@/components/ui/loading-spinner";
import Auth from "@/components/Auth";
import SignupForm from "@/components/SignupForm";
import Index from "./pages/Index";
import StudyTrails from "./pages/StudyTrails";
import TrailDetail from "./pages/TrailDetail";
import NotFound from "./pages/NotFound";
import StudyRoom from "./pages/StudyRoom";
import PublicRooms from "./pages/PublicRooms";
import AdvancedStudyRoom from "./pages/AdvancedStudyRoom";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <FriendsProvider>
            <StudySessionProvider>
              <AppProvider>
                <TooltipProvider>
                  <Toaster />
                <Sonner />
                <AppContent />
                </TooltipProvider>
              </AppProvider>
            </StudySessionProvider>
          </FriendsProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingPage message="Verificando autenticação..." />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/signup" element={<SignupForm />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/trilhas" element={<StudyTrails />} />
      <Route path="/trilhas/:trailId" element={<TrailDetail />} />
      <Route path="/study-room/:roomId" element={<StudyRoom />} />
      <Route path="/sala-de-estudos-avancada" element={<AdvancedStudyRoom />} />
      <Route path="/salas-publicas" element={<PublicRooms />} />
      <Route path="/revisoes" element={<Index />} />
      <Route path="/resumos" element={<Index />} />
      <Route path="/aulas" element={<Index />} />
      <Route path="/questoes" element={<Index />} />
      <Route path="/audios" element={<Index />} />
      <Route path="/estatisticas" element={<Index />} />
      <Route path="/plano-estudos" element={<Index />} />
      <Route path="/topicos" element={<Index />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
