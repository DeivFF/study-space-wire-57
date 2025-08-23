
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  resetPassword: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há um usuário logado no localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simular autenticação - aceitar login/login ou qualquer email com login/login
      if ((identifier === 'login' || identifier.includes('@')) && password === 'login') {
        const mockUser: User = {
          id: '1',
          email: identifier.includes('@') ? identifier : 'login@exemplo.com',
          name: 'Usuário'
        };
        
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simular cadastro bem-sucedido
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    return true;
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simular envio de email
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isLoading,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
