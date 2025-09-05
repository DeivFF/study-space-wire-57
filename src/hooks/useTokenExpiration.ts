import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useTokenExpiration = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleTokenExpired = () => {
      // Redirect to auth page (login)
      navigate('/auth', { replace: true });
    };

    // Listen for token expiration events
    window.addEventListener('tokenExpired', handleTokenExpired);

    // Cleanup
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired);
    };
  }, [navigate]);
};