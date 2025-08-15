
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

interface AudioPositionData {
  [trackId: string]: number;
}

export const useAudioPersistence = () => {
  const { user } = useAuth();
  const [persistedData, setPersistedData] = useState<AudioPositionData>({});
  const [isRestoringPosition, setIsRestoringPosition] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const hasInitialized = useRef(false);

  // Initialize data from localStorage on mount
  useEffect(() => {
    if (!user || hasInitialized.current) return;
    
    try {
      const savedData = localStorage.getItem(`audio_positions_${user.id}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setPersistedData(parsedData);
      }
      hasInitialized.current = true;
    } catch (error) {
      console.error('Error loading audio positions:', error);
    }
  }, [user]);

  // Save to localStorage with debounce
  const saveToStorage = useCallback((data: AudioPositionData) => {
    if (!user) return;
    
    try {
      localStorage.setItem(`audio_positions_${user.id}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving audio positions:', error);
    }
  }, [user]);

  // Debounced save function
  const savePosition = useCallback((trackId: string, position: number) => {
    if (!user || !trackId || position < 0) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Update local state immediately
    setPersistedData(prev => {
      const newData = { ...prev, [trackId]: position };
      
      // Debounce the actual save to storage
      saveTimeoutRef.current = setTimeout(() => {
        saveToStorage(newData);
      }, 2000);
      
      return newData;
    });
  }, [user, saveToStorage]);

  // Get saved position for a track
  const getSavedPosition = useCallback((trackId: string): number => {
    if (!trackId || !persistedData[trackId]) return 0;
    return persistedData[trackId];
  }, [persistedData]);

  // Set restoring state
  const setRestoring = useCallback((restoring: boolean) => {
    setIsRestoringPosition(restoring);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    savePosition,
    getSavedPosition,
    isRestoringPosition,
    setRestoring,
    persistedData
  };
};
