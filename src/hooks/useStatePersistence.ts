
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalStorage, useSessionStorage } from '@/hooks/useLocalStorage';

export interface PersistenceConfig {
  key: string;
  storage: 'local' | 'session';
  debounceMs?: number;
  fallbackValue?: any;
}

export function useStatePersistence<T>(
  initialValue: T,
  config: PersistenceConfig
): [T, (value: T | ((prev: T) => T)) => void] {
  const { key, storage, debounceMs = 300, fallbackValue } = config;
  const debounceRef = useRef<NodeJS.Timeout>();
  
  const storageHook = storage === 'local' ? useLocalStorage : useSessionStorage;
  const [storedValue, setStoredValue] = storageHook(key, fallbackValue || initialValue);
  
  const [value, setValue] = useState<T>(storedValue);

  const debouncedSetValue = useCallback((newValue: T | ((prev: T) => T)) => {
    const valueToSet = typeof newValue === 'function' ? (newValue as (prev: T) => T)(value) : newValue;
    setValue(valueToSet);
    
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new timeout for persistence
    debounceRef.current = setTimeout(() => {
      setStoredValue(valueToSet);
    }, debounceMs);
  }, [value, setStoredValue, debounceMs]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return [value, debouncedSetValue];
}
