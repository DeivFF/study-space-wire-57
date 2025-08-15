
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const { toast } = useToast();

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erro ao ler localStorage key "${key}":`, error);
      toast({
        title: "Erro ao carregar dados",
        description: `Não foi possível carregar dados salvos para ${key}`,
        variant: "destructive"
      });
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Erro ao salvar localStorage key "${key}":`, error);
      toast({
        title: "Erro ao salvar dados",
        description: `Não foi possível salvar dados para ${key}`,
        variant: "destructive"
      });
    }
  }, [key, storedValue, toast]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Erro ao remover localStorage key "${key}":`, error);
      toast({
        title: "Erro ao remover dados",
        description: `Não foi possível remover dados para ${key}`,
        variant: "destructive"
      });
    }
  }, [key, initialValue, toast]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Erro ao sincronizar localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const { toast } = useToast();

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erro ao ler sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Erro ao salvar sessionStorage key "${key}":`, error);
      toast({
        title: "Erro ao salvar dados da sessão",
        description: `Não foi possível salvar dados temporários para ${key}`,
        variant: "destructive"
      });
    }
  }, [key, storedValue, toast]);

  const removeValue = useCallback(() => {
    try {
      window.sessionStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Erro ao remover sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
