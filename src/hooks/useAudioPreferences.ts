
import { useState, useEffect } from 'react';

interface AudioPreferences {
  volume: number;
  isMuted: boolean;
  isShuffling: boolean;
  isRepeating: boolean;
  lastPlayedTrackId?: string;
}

const defaultPreferences: AudioPreferences = {
  volume: 1,
  isMuted: false,
  isShuffling: false,
  isRepeating: false,
};

export const useAudioPreferences = () => {
  const [preferences, setPreferences] = useState<AudioPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('audioPreferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (error) {
      console.error('Error loading audio preferences:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage
  const updatePreferences = (updates: Partial<AudioPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    
    try {
      localStorage.setItem('audioPreferences', JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Error saving audio preferences:', error);
    }
  };

  return {
    preferences,
    updatePreferences,
    isLoaded
  };
};
