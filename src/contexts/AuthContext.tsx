
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  avatarUrl?: string;
  isVerified: boolean;
  onboardingCompleted: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean }>;
  logout: () => void;
  isLoading: boolean;
  resetPassword: (email: string) => Promise<boolean>;
  verificationData: { email: string; code: string } | null;
  clearVerificationData: () => void;
  showOnboardingModal: boolean;
  setShowOnboardingModal: (show: boolean) => void;
  completeOnboarding: (nickname: string, avatarUrl?: string) => Promise<boolean>;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  handleTokenExpiration: () => void;
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
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationData, setVerificationData] = useState<{ email: string; code: string } | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  useEffect(() => {
    // Check if there's a logged-in user in localStorage
    const initAuth = () => {
      try {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('accessToken');
        
        if (savedUser && savedToken) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setToken(savedToken);
        }
      } catch (error) {
        console.error('Error loading saved auth data:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login error:', errorData);
        setIsLoading(false);
        return false;
      }

      const data = await response.json();
      const userData = {
        id: data.data.user.id,
        email: data.data.user.email,
        name: data.data.user.name,
        nickname: data.data.user.nickname || '',
        avatarUrl: data.data.user.avatar_url || '',
        isVerified: data.data.user.isVerified,
        onboardingCompleted: data.data.user.onboardingCompleted
      };

      setUser(userData);
      setToken(data.data.tokens.accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<{ success: boolean }> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3002/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Registration error:', errorData);
        setIsLoading(false);
        return { success: false };
      }

      const data = await response.json();
      console.log('Registration successful:', data);
      
      // Automatically log in the user after successful registration
      const userData = {
        id: data.data.user.id,
        email: data.data.user.email,
        name: data.data.user.name,
        nickname: data.data.user.nickname || '',
        avatarUrl: data.data.user.avatar_url || '',
        isVerified: data.data.user.isVerified,
        onboardingCompleted: data.data.user.onboardingCompleted
      };

      setUser(userData);
      setToken(data.data.tokens.accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
      // Removed refreshToken since we're not using it
      
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      return { success: false };
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3002/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Password reset error:', errorData);
        setIsLoading(false);
        return false;
      }

      const data = await response.json();
      console.log('Password reset email sent:', data);
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    // Call logout endpoint to revoke refresh token
    // const refreshToken = localStorage.getItem('refreshToken');
    // if (refreshToken) {
    //   fetch('http://localhost:3002/api/auth/logout', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({ refreshToken }),
    //   }).catch(error => console.error('Logout error:', error));
    // }
    
    setUser(null);
    setToken(null);
    setVerificationData(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    // localStorage.removeItem('refreshToken'); // Removed since we're not using it
  };

  const clearVerificationData = () => {
    setVerificationData(null);
  };

  const completeOnboarding = async (nickname: string, avatarUrl?: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3002/api/profile/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ nickname, avatarUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Onboarding completion error:', errorData);
        setIsLoading(false);
        return false;
      }

      const data = await response.json();
      console.log('Onboarding completed:', data);
      
      // Update user data with onboarding completion
      if (user) {
        const updatedUser = {
          ...user,
          nickname: nickname,
          avatarUrl: avatarUrl || user.avatarUrl,
          onboardingCompleted: true
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      setShowOnboardingModal(false);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Onboarding completion error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const handleTokenExpiration = () => {
    logout();
    // Trigger a custom event that components can listen to
    window.dispatchEvent(new CustomEvent('tokenExpired'));
  };

  const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, requestOptions);
      
      // Check if the response indicates token expiration
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.message === 'Token expired' || errorData.message === 'Access token required') {
          // Token expired, handle expiration
          handleTokenExpiration();
          throw new Error('Token expired - user logged out');
        }
      }

      return response;
    } catch (error) {
      // If it's a fetch error (network issue), let it bubble up
      if (error instanceof TypeError) {
        throw error;
      }
      
      // Re-throw our custom error
      throw error;
    }
  };

  // Check if user needs onboarding when user data changes
  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      setShowOnboardingModal(true);
    } else {
      setShowOnboardingModal(false);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      isLoading,
      resetPassword,
      verificationData,
      clearVerificationData,
      showOnboardingModal,
      setShowOnboardingModal,
      completeOnboarding,
      authenticatedFetch,
      handleTokenExpiration
    }}>
      {children}
    </AuthContext.Provider>
  );
};
