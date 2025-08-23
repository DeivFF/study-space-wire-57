
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Navegacao from "./pages/Navegacao";
import Questoes from "./pages/Questoes";
import Aulas from "./pages/Aulas";
import Amigos from "./pages/Amigos";
import SalaEstudo from "./pages/SalaEstudo";
import Comunidades from "./pages/Comunidades";
import Feed from "./pages/Feed";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/sala-estudo" element={
              <ProtectedRoute>
                <SalaEstudo />
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
            <Route path="/perfil/:id" element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
